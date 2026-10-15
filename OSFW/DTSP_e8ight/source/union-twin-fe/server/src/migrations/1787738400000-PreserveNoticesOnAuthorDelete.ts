import { MigrationInterface, QueryRunner } from 'typeorm';

export class PreserveNoticesOnAuthorDelete1787738400000 implements MigrationInterface {
  name = 'PreserveNoticesOnAuthorDelete1787738400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notices" DROP CONSTRAINT "FK_623c2128ffee13d67f4fb2292c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notices" ALTER COLUMN "authorId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notices" ADD CONSTRAINT "FK_623c2128ffee13d67f4fb2292c2" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notices" DROP CONSTRAINT "FK_623c2128ffee13d67f4fb2292c2"`,
    );
    await queryRunner.query(`DELETE FROM "notices" WHERE "authorId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "notices" ALTER COLUMN "authorId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notices" ADD CONSTRAINT "FK_623c2128ffee13d67f4fb2292c2" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
