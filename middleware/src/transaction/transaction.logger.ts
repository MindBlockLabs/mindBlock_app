import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TransactionLogger {
  private readonly logger = new Logger('Transaction');

  log(message: string) {
    this.logger.log(message);
  }

  error(message: string, error: any) {
    this.logger.error(`${message}: ${error.message}`, error.stack);
  }
}
