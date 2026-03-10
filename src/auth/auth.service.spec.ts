import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

jest.mock('../email/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendOtpEmail: jest.fn().mockResolvedValue(undefined),
  })),
}));
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';
import { mockPatientUser, mockOtp } from '../../test/helpers/fixtures';
import { OtpStatus, Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: { sendOtpEmail: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── sendOtp ────────────────────────────────────────────────────────────────

  describe('sendOtp', () => {
    it('throws BadRequestException when email is not registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.sendOtp({ email: 'unknown@example.com' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.sendOtp({ email: 'unknown@example.com' })).rejects.toThrow(
        'Email not registered',
      );
      expect(prismaMock.otp.create).not.toHaveBeenCalled();
    });

    it('sends OTP when email is already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.otp.create.mockResolvedValue(mockOtp);

      await service.sendOtp({ email: 'user@example.com' });

      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(prismaMock.otp.updateMany).toHaveBeenCalledWith({
        where: { userId: mockPatientUser.id, status: OtpStatus.PENDING },
        data: { status: OtpStatus.EXPIRED },
      });
    });

    it('expires all previous pending OTPs before creating a new one', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.updateMany.mockResolvedValue({ count: 2 });
      prismaMock.otp.create.mockResolvedValue(mockOtp);

      await service.sendOtp({ email: 'user@example.com' });

      // updateMany must be called before create
      expect(prismaMock.otp.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
        prismaMock.otp.create.mock.invocationCallOrder[0],
      );
    });

    it('exposes OTP in response when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.otp.create.mockResolvedValue(mockOtp);

      const result = await service.sendOtp({ email: 'user@example.com' });

      expect(result.otp).toBeDefined();
      expect(result.otp).toHaveLength(6);
    });

    it('hides OTP in response when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.otp.create.mockResolvedValue(mockOtp);

      const result = await service.sendOtp({ email: 'user@example.com' });

      expect(result.otp).toBeUndefined();
      process.env.NODE_ENV = 'development';
    });
  });

  // ── verifyOtp ──────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('returns accessToken and refreshToken on valid OTP', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.findFirst.mockResolvedValue(mockOtp);
      prismaMock.$transaction.mockResolvedValue([]);
      jwtService.signAsync.mockResolvedValue('mock-token' as never);

      const result = await service.verifyOtp({ email: 'user@example.com', otp: '482910' });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user.email).toBe('user@example.com');
    });

    it('throws UnauthorizedException when email is not registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ email: 'user@example.com', otp: '000000' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when OTP is invalid or expired', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ email: 'user@example.com', otp: '999999' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid or expired OTP'));
    });

    it('marks OTP as VERIFIED and user as isVerified in a transaction', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.findFirst.mockResolvedValue(mockOtp);
      prismaMock.$transaction.mockResolvedValue([]);
      jwtService.signAsync.mockResolvedValue('mock-token' as never);

      await service.verifyOtp({ email: 'user@example.com', otp: '482910' });

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  // ── refreshToken ───────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('returns a new accessToken for a valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: mockPatientUser.id,
        email: mockPatientUser.email,
        role: mockPatientUser.role,
      } as never);
      prismaMock.user.findUnique.mockResolvedValue({ ...mockPatientUser, isVerified: true });
      jwtService.signAsync.mockResolvedValue('new-access-token' as never);

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
    });

    it('throws UnauthorizedException for an invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

      await expect(service.refreshToken('bad-token')).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });

    it('throws UnauthorizedException when user is not verified', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: mockPatientUser.id } as never);
      prismaMock.user.findUnique.mockResolvedValue({ ...mockPatientUser, isVerified: false });

      await expect(service.refreshToken('token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
