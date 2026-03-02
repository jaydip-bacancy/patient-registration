import { Module } from '@nestjs/common';
import { MedicalSnapshotController } from './medical-snapshot.controller';
import { MedicalSnapshotService } from './medical-snapshot.service';

@Module({
  controllers: [MedicalSnapshotController],
  providers: [MedicalSnapshotService],
})
export class MedicalSnapshotModule {}
