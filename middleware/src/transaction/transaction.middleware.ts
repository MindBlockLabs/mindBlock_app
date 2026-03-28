import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { TransactionManager } from './transaction.manager';
import { TransactionLogger } from './transaction.logger';

@Injectable()
export class TransactionMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource, private readonly logger: TransactionLogger) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const manager = new TransactionManager(this.dataSource);

    try {
      await manager.startTransaction();

      // Attach transaction manager to request for manual control if needed
      (req as any).transactionManager = manager;

      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          await manager.commitTransaction();
          this.logger.log('Transaction committed successfully');
        } else {
          await manager.rollbackTransaction();
          this.logger.log('Transaction rolled back due to error');
        }
      });

      next();
    } catch (error) {
      await manager.rollbackTransaction();
      this.logger.error('Transaction failed', error);
      next(error);
    }
  }
}
