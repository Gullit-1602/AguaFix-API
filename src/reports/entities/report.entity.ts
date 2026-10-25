import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ReportSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity({ name: 'WATER_REPORT' })
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar' })
  severity: ReportSeverity;

  @Column({ type: 'varchar' })
  reporterPhone: string;

  @Column({ type: 'text', nullable: true })
  photoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  repairPhotoUrl: string | null;

  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
