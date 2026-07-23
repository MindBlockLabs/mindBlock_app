import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `analytics_events` shipped without any index, so every reporting query over it
 * is a sequential scan. These two cover the access patterns the analytics
 * providers actually use:
 *
 *  - IDX_analytics_events_timestamp_userId — range scan over a reporting window
 *    grouped by user (churn risk scoring, future per-user rollups).
 *  - IDX_analytics_events_userId_timestamp — one user's history in time order.
 *
 * Note: these are plain (non-CONCURRENT) index builds because TypeORM runs
 * migrations inside a transaction and CREATE INDEX CONCURRENTLY cannot run
 * there. On a large existing table this takes a write lock for the duration.
 */
export class AddAnalyticsEventIndexes20260722000000 implements MigrationInterface {
  name = 'AddAnalyticsEventIndexes20260722000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'analytics_events'
        ) THEN
          CREATE INDEX IF NOT EXISTS "IDX_analytics_events_timestamp_userId"
            ON "analytics_events" ("timestamp", "userId");

          CREATE INDEX IF NOT EXISTS "IDX_analytics_events_userId_timestamp"
            ON "analytics_events" ("userId", "timestamp");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_analytics_events_userId_timestamp";
      DROP INDEX IF EXISTS "IDX_analytics_events_timestamp_userId";
    `);
  }
}
