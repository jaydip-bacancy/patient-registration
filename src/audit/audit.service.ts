import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

interface CreateAuditLogDto {
  entityType: string;
  entityId: string;
  action: AuditAction;
  performedBy: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: dto.entityType,
          entityId: dto.entityId,
          action: dto.action,
          performedBy: dto.performedBy,
          metadata:  (dto.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      // Audit failures must NEVER crash the main operation
      this.logger.error(
        `Failed to write audit log for ${dto.entityType}:${dto.entityId}`,
        err,
      );
    }
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByPerformer(performedBy: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { performedBy },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async findAll(limit = 100, offset = 0) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { logs, total, limit, offset };
  }
}
