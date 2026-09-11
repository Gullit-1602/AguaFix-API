import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'SYSTEM_USER' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', select: false })
  password: string;

  @Column({ type: 'boolean', default: true })
  isNotificationEnabled: boolean;
}