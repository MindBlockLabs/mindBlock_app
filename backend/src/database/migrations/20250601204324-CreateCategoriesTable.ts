import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable20250601204324 implements MigrationInterface {
  name = 'CreateCategoriesTable20250601204324';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "category" (
        "id" SERIAL NOT NULL,
        "name" character varying(120) NOT NULL,
        "description" character varying(500),
        "icon" character varying(120),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_category_id" PRIMARY KEY ("id")
      );

      CREATE INDEX "IDX_category_name" ON "category" ("name");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_category_name";
      DROP TABLE "category";
    `);
  }
}