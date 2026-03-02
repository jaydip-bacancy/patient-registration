import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Role, OtpStatus } from '@prisma/client';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ message: string; otp?: string }> {
    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone: dto.phone, role: Role.PATIENT },
      });
      this.logger.log(`New user created for phone: ${dto.phone}`);
    }

    // Expire all previous pending OTPs for this user
    await this.prisma.otp.updateMany({
      where: { userId: user.id, status: OtpStatus.PENDING },
      data: { status: OtpStatus.EXPIRED },
    });

    const otpCode = this.generateOtp();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        code: otpCode,
        status: OtpStatus.PENDING,
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      },
    });

    // In production: send via SMS provider (Twilio, MSG91, etc.)
    this.logger.log(`OTP for ${dto.phone}: ${otpCode} (mock - not sent via SMS)`);

    const response: { message: string; otp?: string } = {
      message: `OTP sent to ${dto.phone}`,
    };

    // Expose OTP only in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      response.otp = otpCode;
    }

    return response;
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; phone: string; role: Role };
  }> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (!user) {
      throw new UnauthorizedException('Phone number not registered');
    }

    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: dto.otp,
        status: OtpStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.prisma.$transaction([
      this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { status: OtpStatus.VERIFIED },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      }),
    ]);

    const payload: JwtPayload = { sub: user.id, phone: user.phone, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, phone: user.phone, role: user.role },
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isVerified) {
        throw new UnauthorizedException('User not found or not verified');
      }

      const newPayload: JwtPayload = { sub: user.id, phone: user.phone, role: user.role };
      const accessToken = await this.jwtService.signAsync(newPayload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateOtp(): string {
    const length = parseInt(process.env.OTP_LENGTH || '6', 10);
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }
}
