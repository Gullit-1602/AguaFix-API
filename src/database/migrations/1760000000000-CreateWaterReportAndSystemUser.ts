import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateWaterReportAndSystemUser1760000000000 implements MigrationInterface {
  name = 'CreateWaterReportAndSystemUser1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'SYSTEM_USER',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar' },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'password', type: 'varchar' },
          { name: 'isNotificationEnabled', type: 'boolean', default: true },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'WATER_REPORT',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'address', type: 'varchar' },
          { name: 'description', type: 'text' },
          { name: 'severity', type: 'varchar' },
          { name: 'reporterPhone', type: 'varchar' },
          { name: 'isResolved', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('WATER_REPORT');
    await queryRunner.dropTable('SYSTEM_USER');
  }
}