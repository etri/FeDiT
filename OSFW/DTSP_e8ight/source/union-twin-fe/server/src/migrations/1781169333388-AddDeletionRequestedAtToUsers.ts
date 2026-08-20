import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletionRequestedAtToUsers1781169333388 implements MigrationInterface {
  name = 'AddDeletionRequestedAtToUsers1781169333388';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "deletionRequestedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "deletionRequestedAt"`,
    );
  }
}
