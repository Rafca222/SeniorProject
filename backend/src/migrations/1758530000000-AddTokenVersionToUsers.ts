import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenVersionToUsers1758530000000 implements MigrationInterface {
  name = 'AddTokenVersionToUsers1758530000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "token_version" integer NOT NULL DEFAULT 0`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "token_version"`);
  }
}
