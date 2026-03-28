import { DataSource, QueryRunner } from 'typeorm';

export class TransactionManager {
  private queryRunner: QueryRunner;

  constructor(private readonly dataSource: DataSource) {
    this.queryRunner = this.dataSource.createQueryRunner();
  }

  async startTransaction(isolation: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' = 'READ COMMITTED') {
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction(isolation);
  }

  async commitTransaction() {
    await this.queryRunner.commitTransaction();
    await this.queryRunner.release();
  }

  async rollbackTransaction() {
    await this.queryRunner.rollbackTransaction();
    await this.queryRunner.release();
  }

  async createSavepoint(name: string) {
    await this.queryRunner.query(`SAVEPOINT ${name}`);
  }

  async rollbackToSavepoint(name: string) {
    await this.queryRunner.query(`ROLLBACK TO SAVEPOINT ${name}`);
  }

  getManager() {
    return this.queryRunner.manager;
  }
}
