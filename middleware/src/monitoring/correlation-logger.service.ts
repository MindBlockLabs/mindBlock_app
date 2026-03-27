import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { CorrelationIdStorage } from './correlation-id.storage';

@Injectable({ scope: Scope.TRANSIENT })
export class CorrelationLoggerService implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    this.printLog('info', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.printLog('error', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.printLog('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.printLog('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.printLog('verbose', message, context);
  }

  private printLog(level: string, message: any, context?: string, trace?: string) {
    const correlationId = CorrelationIdStorage.getCorrelationId();
    const userId = CorrelationIdStorage.getUserId();
    const logOutput = {
      timestamp: new Date().toISOString(),
      level,
      correlationId: correlationId || 'N/A',
      userId: userId || 'N/A',
      context: context || this.context,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...(trace ? { trace } : {}),
    };

    console.log(JSON.stringify(logOutput));
  }
}
