import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPuzzleEntities20250601204321 implements MigrationInterface {
  name = 'AddPuzzleEntities20250601204321';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."puzzle_type_enum" AS ENUM('logic', 'coding', 'blockchain');
      CREATE TYPE "public"."puzzle_difficulty_enum" AS ENUM('easy', 'medium', 'hard');

      CREATE TABLE "puzzle" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "description" character varying NOT NULL,
        "type" "public"."puzzle_type_enum" NOT NULL,
        "difficulty" "public"."puzzle_difficulty_enum" NOT NULL,
        "solution" character varying NOT NULL,
        "isPublished" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_puzzle_id" PRIMARY KEY ("id")
      );

      CREATE TABLE "puzzle_submission" (
        "id" SERIAL NOT NULL,
        "attemptData" jsonb NOT NULL,
        "result" boolean NOT NULL,
        "submittedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "puzzleId" integer,
        "userId" integer,
        CONSTRAINT "PK_puzzle_submission_id" PRIMARY KEY ("id")
      );

      CREATE TABLE "puzzle_progress" (
        "id" SERIAL NOT NULL,
        "puzzleType" "public"."puzzle_type_enum" NOT NULL,
        "completedCount" integer NOT NULL DEFAULT 0,
        "total" integer NOT NULL DEFAULT 0,
        "userId" integer,
        CONSTRAINT "PK_puzzle_progress_id" PRIMARY KEY ("id")
      );

      ALTER TABLE "puzzle_submission"
        ADD CONSTRAINT "FK_submission_puzzle" FOREIGN KEY ("puzzleId") REFERENCES "puzzle"("id") ON DELETE CASCADE;

      ALTER TABLE "puzzle_submission"
        ADD CONSTRAINT "FK_submission_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;

      ALTER TABLE "puzzle_progress"
        ADD CONSTRAINT "FK_progress_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;

      ALTER TABLE "user"
        ADD "xp" integer NOT NULL DEFAULT 0,
        ADD "level" integer NOT NULL DEFAULT 1,
        ADD "starknetWallet" character varying(150),
        ADD CONSTRAINT "UQ_user_email" UNIQUE ("email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN "starknetWallet",
      DROP COLUMN "level",
      DROP COLUMN "xp";

      ALTER TABLE "puzzle_progress" DROP CONSTRAINT "FK_progress_user";
      ALTER TABLE "puzzle_submission" DROP CONSTRAINT "FK_submission_user";
      ALTER TABLE "puzzle_submission" DROP CONSTRAINT "FK_submission_puzzle";

      DROP TABLE "puzzle_progress";
      DROP TABLE "puzzle_submission";
      DROP TABLE "puzzle";

      DROP TYPE "public"."puzzle_difficulty_enum";
      DROP TYPE "public"."puzzle_type_enum";
    `);
  }
}
