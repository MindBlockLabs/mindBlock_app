import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}