import { registerAs } from "@nestjs/config"

export default registerAs('appConfig', () => ({
    envirment: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION,
    mailHost: process.env.MAIL_HOST,
    mailPort: process.env.SMTP_PORT || 2525,
    smtpUsername: process.env.SMTP_USERNAME,
    smtpPassword: process.env.SMTP_PASSWORD,
    mailSecure: process.env.MAIL_SECURE === 'true',
}) )