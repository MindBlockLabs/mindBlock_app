import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDailyStreakTable1234567890123 implements MigrationInterface {
  name = 'CreateDailyStreakTable1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'daily_streaks',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'last_active_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'streak_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'longest_streak',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create unique index on user_id
    await queryRunner.createIndex(
      'daily_streaks',
      new TableIndex({
        name: 'IDX_DAILY_STREAKS_USER_ID_UNIQUE',
        columnNames: ['user_id'],
        isUnique: true,
      }),
    );

    // Create index on streak_count for leaderboard queries
    await queryRunner.createIndex(
      'daily_streaks',
      new TableIndex({
        name: 'IDX_DAILY_STREAKS_STREAK_COUNT',
        columnNames: ['streak_count'],
      }),
    );

    // Create index on last_active_date for cleanup queries
    await queryRunner.createIndex(
      'daily_streaks',
      new TableIndex({
        name: 'IDX_DAILY_STREAKS_LAST_ACTIVE_DATE',
        columnNames: ['last_active_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('daily_streaks');
  }
}