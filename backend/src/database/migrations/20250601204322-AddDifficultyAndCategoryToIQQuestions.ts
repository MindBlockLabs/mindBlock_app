import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDifficultyAndCategoryToIQQuestions20250601204322 implements MigrationInterface {
  name = 'AddDifficultyAndCategoryToIQQuestions20250601204322';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."question_difficulty_enum" AS ENUM('easy', 'medium', 'hard')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."question_category_enum" AS ENUM(
        'Science', 'Mathematics', 'Logic', 'Language', 'History', 
        'Geography', 'Literature', 'Art', 'Sports', 'Entertainment', 'General Knowledge'
      )
    `);

    // Add columns to iq_questions table
    await queryRunner.query(`
      ALTER TABLE "iq_questions" 
      ADD COLUMN "difficulty" "public"."question_difficulty_enum" NOT NULL DEFAULT 'medium'
    `);

    await queryRunner.query(`
      ALTER TABLE "iq_questions" 
      ADD COLUMN "category" "public"."question_category_enum"
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_iq_questions_difficulty" ON "iq_questions" ("difficulty")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_iq_questions_category" ON "iq_questions" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_iq_questions_difficulty_category" ON "iq_questions" ("difficulty", "category")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "IDX_iq_questions_difficulty_category"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_iq_questions_category"`);
    await queryRunner.query(`DROP INDEX "IDX_iq_questions_difficulty"`);

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE "iq_questions" DROP COLUMN "category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "iq_questions" DROP COLUMN "difficulty"`,
    );

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."question_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."question_difficulty_enum"`);
  }
}
