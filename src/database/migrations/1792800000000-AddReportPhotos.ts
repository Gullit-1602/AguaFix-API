import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReportPhotos1792800000000 implements MigrationInterface {
  name = 'AddReportPhotos1792800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('WATER_REPORT', new TableColumn({
      name: 'photoUrl', type: 'text', isNullable: true,
    }));
    await queryRunner.addColumn('WATER_REPORT', new TableColumn({
      name: 'repairPhotoUrl', type: 'text', isNullable: true,
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('WATER_REPORT', 'repairPhotoUrl');
    await queryRunner.dropColumn('WATER_REPORT', 'photoUrl');
  }
}
