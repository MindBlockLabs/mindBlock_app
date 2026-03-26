import { registerAs } from '@nestjs/config';

export default registerAs('analytics', () => ({
  // Analytics database configuration (optional)
  url: process.env.ANALYTICS_DB_URL,
  host: process.env.ANALYTICS_DB_HOST || 'localhost',
  port: parseInt(process.env.ANALYTICS_DB_PORT ?? '5433', 10),
  user: process.env.ANALYTICS_DB_USER || 'analytics_user',
  password: process.env.ANALYTICS_DB_PASSWORD || '',
  name: process.env.ANALYTICS_DB_NAME || 'mindblock_analytics',
  synchronize: process.env.ANALYTICS_DB_SYNC === 'true',
  autoLoadEntities: process.env.ANALYTICS_DB_AUTOLOAD === 'true',
  
  // Data retention settings
  dataRetentionDays: parseInt(process.env.ANALYTICS_DATA_RETENTION_DAYS ?? '90', 10),
  
  // Privacy settings
  optOutByDefault: process.env.TRACKING_OPT_OUT_BY_DEFAULT === 'true',
  respectDntHeader: process.env.RESPECT_DNT_HEADER !== 'false',
}));
