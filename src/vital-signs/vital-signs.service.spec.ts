import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VitalSignsService } from './vital-signs.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';

const visitId = 'visit-uuid-0001';

const mockVitalSigns = {
  id: 'vitals-uuid-001',
  visitId,
  bloodPressure: '120/80',
  pulseRate: 78,
  temperature: 98.6,
  weight: 72.5,
  height: 170,
  bmi: 25.1,
  oxygenSaturation: 98,
  respiratoryRate: 16,
  recordedAt: new Date(),
};

const recordDto = {
  visitId,
  bloodPressure: '120/80',
  pulseRate: 78,
  temperature: 98.6,
  weight: 72.5,
  height: 170,
  oxygenSaturation: 98,
  respiratoryRate: 16,
};

describe('VitalSignsService', () => {
  let service: VitalSignsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VitalSignsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<VitalSignsService>(VitalSignsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('record', () => {
    it('records vitals and auto-calculates BMI', async () => {
      prismaMock.visit.findUnique.mockResolvedValue({ id: visitId } as never);
      prismaMock.vitalSigns.findUnique.mockResolvedValue(null);
      prismaMock.vitalSigns.create.mockResolvedValue(mockVitalSigns as never);

      const result = await service.record(recordDto);

      expect(result.message).toBe('Vital signs recorded successfully');
      expect(prismaMock.vitalSigns.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ bmi: 25.1 }),
        }),
      );
    });

    it('throws NotFoundException when visit does not exist', async () => {
      prismaMock.visit.findUnique.mockResolvedValue(null);

      await expect(service.record(recordDto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when vitals are already recorded for the visit', async () => {
      prismaMock.visit.findUnique.mockResolvedValue({ id: visitId } as never);
      prismaMock.vitalSigns.findUnique.mockResolvedValue(mockVitalSigns as never);

      await expect(service.record(recordDto)).rejects.toThrow(BadRequestException);
    });

    it('correctly calculates BMI = weight / (height/100)^2', async () => {
      prismaMock.visit.findUnique.mockResolvedValue({ id: visitId } as never);
      prismaMock.vitalSigns.findUnique.mockResolvedValue(null);
      prismaMock.vitalSigns.create.mockResolvedValue(mockVitalSigns as never);

      await service.record({ ...recordDto, weight: 80, height: 160 });

      const createCall = prismaMock.vitalSigns.create.mock.calls[0][0];
      // BMI = 80 / (1.6^2) = 80 / 2.56 ≈ 31.25 → rounded to 31.2 (1 decimal)
      expect(createCall.data.bmi).toBeCloseTo(31.2, 0);
    });

    it('sets bmi to null when weight or height is not provided', async () => {
      prismaMock.visit.findUnique.mockResolvedValue({ id: visitId } as never);
      prismaMock.vitalSigns.findUnique.mockResolvedValue(null);
      prismaMock.vitalSigns.create.mockResolvedValue({ ...mockVitalSigns, bmi: null } as never);

      await service.record({ visitId, pulseRate: 78 });

      const createCall = prismaMock.vitalSigns.create.mock.calls[0][0];
      expect(createCall.data.bmi).toBeNull();
    });
  });

  describe('findByVisit', () => {
    it('returns vitals for the visit', async () => {
      prismaMock.vitalSigns.findUnique.mockResolvedValue(mockVitalSigns as never);

      const result = await service.findByVisit(visitId);

      expect(result.bloodPressure).toBe('120/80');
      expect(result.bmi).toBe(25.1);
    });

    it('throws NotFoundException when no vitals recorded', async () => {
      prismaMock.vitalSigns.findUnique.mockResolvedValue(null);

      await expect(service.findByVisit(visitId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates only the provided fields', async () => {
      prismaMock.vitalSigns.findUnique.mockResolvedValue(mockVitalSigns as never);
      prismaMock.vitalSigns.update.mockResolvedValue({ ...mockVitalSigns, pulseRate: 85 } as never);

      const result = await service.update(visitId, { pulseRate: 85 });

      expect(result.message).toBe('Vital signs updated successfully');
      expect(prismaMock.vitalSigns.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ pulseRate: 85 }),
        }),
      );
    });

    it('throws NotFoundException when no vitals exist to update', async () => {
      prismaMock.vitalSigns.findUnique.mockResolvedValue(null);

      await expect(service.update(visitId, { pulseRate: 85 })).rejects.toThrow(NotFoundException);
    });
  });
});
