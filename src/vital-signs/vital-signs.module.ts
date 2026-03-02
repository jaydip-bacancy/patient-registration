import { Module } from '@nestjs/common';
import { VitalSignsController } from './vital-signs.controller';
import { VitalSignsService } from './vital-signs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VitalSignsController],
  providers: [VitalSignsService],
  exports: [VitalSignsService],
})
export class VitalSignsModule {}
