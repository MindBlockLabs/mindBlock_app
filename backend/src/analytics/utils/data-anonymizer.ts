import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class DataAnonymizer {
  /**
   * Anonymize IP address by removing last octet (IPv4) or interface ID (IPv6)
   */
  anonymizeIpAddress(ip: string): string {
    if (!ip) return '';

    // Handle IPv4
    if (ip.includes(':') === false) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        parts[3] = 'xxx';
        return parts.join('.');
      }
    }

    // Handle IPv6 - remove interface identifier (last 64 bits)
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        // Keep first 4 segments, replace rest with 'xxxx'
        const anonymized = parts.slice(0, 4).concat(['xxxx', 'xxxx', 'xxxx', 'xxxx']);
        return anonymized.join(':');
      }
    }

    return ip;
  }

  /**
   * Sanitize metadata to remove PII
   */
  sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    if (!metadata) return {};

    const sanitized: Record<string, any> = {};
    const piiFields = ['email', 'password', 'phone', 'address', 'ssn', 'creditCard', 'fullName'];

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      
      // Skip PII fields
      if (piiFields.some(field => lowerKey.includes(field))) {
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? this.sanitizeMetadata(item)
            : item
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash user ID for anonymous tracking
   */
  hashUserId(userId: string, salt?: string): string {
    const saltToUse = salt || process.env.ANALYTICS_SALT || 'default-salt';
    return crypto
      .createHmac('sha256', saltToUse)
      .update(userId)
      .digest('hex');
  }

  /**
   * Parse user agent to extract browser, OS, and device type
   */
  parseUserAgent(userAgent: string): {
    browser?: string;
    os?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  } {
    if (!userAgent) {
      return { deviceType: 'unknown' };
    }

    const ua = userAgent.toLowerCase();
    
    // Detect device type
    let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
    
    if (/mobile/i.test(ua)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      deviceType = 'tablet';
    } else if (/windows|macintosh|linux/i.test(ua)) {
      deviceType = 'desktop';
    }

    // Detect browser
    let browser: string | undefined;
    if (/chrome/i.test(ua) && !/edg/i.test(ua)) {
      browser = 'Chrome';
    } else if (/firefox/i.test(ua)) {
      browser = 'Firefox';
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
      browser = 'Safari';
    } else if (/edg/i.test(ua)) {
      browser = 'Edge';
    } else if (/msie|trident/i.test(ua)) {
      browser = 'Internet Explorer';
    } else if (/opera|opr/i.test(ua)) {
      browser = 'Opera';
    }

    // Detect OS
    let os: string | undefined;
    if (/windows/i.test(ua)) {
      os = 'Windows';
    } else if (/mac os x/i.test(ua)) {
      os = 'macOS';
    } else if (/android/i.test(ua)) {
      os = 'Android';
    } else if (/iphone|ipad/i.test(ua)) {
      os = 'iOS';
    } else if (/linux/i.test(ua)) {
      os = 'Linux';
    } else if (/cros/i.test(ua)) {
      os = 'Chrome OS';
    }

    return { browser, os, deviceType };
  }
}
