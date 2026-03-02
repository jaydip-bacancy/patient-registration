import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── sendOtp ────────────────────────────────────────────────────────────────

  describe('sendOtp', () => {
    it('creates a new user when phone is not registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockPatientUser);
      prismaMock.otp.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.otp.create.mockResolvedValue(mockOtp);

      const result = await service.sendOtp({ phone: '+919876543210' });

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { phone: '+919876543210', role: Role.PATIENT },
      });
      expect(prismaMock.otp.create).toHaveBeenCalledTimes(1);
      expect(result.message).toContain('+919876543210');
    });

    it('reuses existing user when phone is already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.otp.create.mockResolvedValue(mockOtp);

      await service.sendOtp({ phone: '+919876543210' });

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

      await service.sendOtp({ phone: '+919876543210' });

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

      const result = await service.sendOtp({ phone: '+919876543210' });

      expect(result.otp).toBeDefined();
      expect(result.otp).toHaveLength(6);
    });

    it('hides OTP in response when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.otp.create.mockResolvedValue(mockOtp);

      const result = await service.sendOtp({ phone: '+919876543210' });

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

      const result = await service.verifyOtp({ phone: '+919876543210', otp: '482910' });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user.phone).toBe('+919876543210');
    });

    it('throws UnauthorizedException when phone is not registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ phone: '+919876543210', otp: '000000' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when OTP is invalid or expired', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ phone: '+919876543210', otp: '999999' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid or expired OTP'));
    });

    it('marks OTP as VERIFIED and user as isVerified in a transaction', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockPatientUser);
      prismaMock.otp.findFirst.mockResolvedValue(mockOtp);
      prismaMock.$transaction.mockResolvedValue([]);
      jwtService.signAsync.mockResolvedValue('mock-token' as never);

      await service.verifyOtp({ phone: '+919876543210', otp: '482910' });

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  // ── refreshToken ───────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('returns a new accessToken for a valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: mockPatientUser.id,
        phone: mockPatientUser.phone,
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
