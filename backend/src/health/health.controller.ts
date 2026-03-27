import { 
  Controller, 
  Get, 
  HttpCode, 
  HttpStatus, 
  Headers,
  ForbiddenException
} from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthCheckResult } from './health.interfaces';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getBasicHealth(): Promise<HealthCheckResult> {
    // Check if app is shutting down
    if (this.healthService.isAppShuttingDown()) {
      throw new ForbiddenException('Application is shutting down');
    }
    
    return this.healthService.getBasicHealth();
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  async getLivenessHealth(): Promise<HealthCheckResult> {
    // Kubernetes liveness probe - check if process is alive
    if (this.healthService.isAppShuttingDown()) {
      throw new ForbiddenException('Application is shutting down');
    }
    
    return this.healthService.getLivenessHealth();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async getReadinessHealth(): Promise<HealthCheckResult> {
    // Kubernetes readiness probe - check if ready to serve traffic
    if (this.healthService.isAppShuttingDown()) {
      throw new ForbiddenException('Application is shutting down');
    }
    
    const health = await this.healthService.getReadinessHealth();
    
    // Return appropriate HTTP status based on health
    if (health.status === 'unhealthy') {
      throw new ForbiddenException('Service not ready');
    }
    
    return health;
  }

  @Get('detailed')
  @HttpCode(HttpStatus.OK)
  async getDetailedHealth(@Headers('x-admin-key') adminKey?: string): Promise<HealthCheckResult> {
    // Admin-only detailed health check
    const requiredAdminKey = process.env.ADMIN_HEALTH_KEY || 'admin-key';
    
    if (adminKey !== requiredAdminKey) {
      throw new ForbiddenException('Admin access required');
    }
    
    if (this.healthService.isAppShuttingDown()) {
      throw new ForbiddenException('Application is shutting down');
    }
    
    return this.healthService.getDetailedHealth();
  }
}
