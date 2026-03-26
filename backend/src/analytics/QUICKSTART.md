# Analytics Quick Start Guide

## Setup (5 minutes)

### 1. Add Environment Variables

Copy these to your `.env` file:

```bash
# Quick setup - uses same DB as main app
ANALYTICS_DB_AUTOLOAD=true
ANALYTICS_DB_SYNC=true
ANALYTICS_DATA_RETENTION_DAYS=90
RESPECT_DNT_HEADER=true
```

### 2. Install Dependencies (if needed)

```bash
npm install @nestjs/schedule
```

### 3. Run Database Sync

```bash
npm run start:dev
# TypeORM will auto-create tables on first run
```

That's it! Analytics is now tracking all user activity automatically.

---

## Viewing Analytics Data

### Test It Out

1. Make some requests to your API
2. Query the analytics:

```bash
# Get recent activities
curl http://localhost:3000/analytics/activities?limit=10

# Get today's DAU
curl http://localhost:3000/analytics/metrics/dau

# Get feature usage
curl "http://localhost:3000/analytics/metrics/feature-usage?startDate=$(date -d '7 days ago' +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)"
```

### Swagger UI

Visit `http://localhost:3000/docs` and look for the **Analytics** section.

---

## Common Tasks

### Check if Tracking is Working

```typescript
// In any service, inject and query:
import { ActivityService } from './analytics/providers/activity.service';

constructor(private activityService: ActivityService) {}

async checkTracking() {
  const recent = await this.activityService.getRecentActivities({ limit: 5 });
  console.log('Recent activities:', recent);
}
```

### Manually Track an Event

```typescript
await this.activityService.recordActivity({
  userId: 'user-123',
  sessionId: 'session-456',
  eventType: 'other',
  eventCategory: 'custom_action',
  duration: 50,
  metadata: { action: 'button_clicked' },
  isAnonymous: false,
  consentStatus: 'opted-in',
});
```

### Check User Opt-Out Status

```typescript
const isOptedOut = await this.privacyService.isOptedOut('user-id');
if (!isOptedOut) {
  // Track activity
}
```

---

## Troubleshooting

### No Activities Showing Up?

1. Check logs for "Analytics database connection initialized"
2. Verify `.env` has `ANALYTICS_DB_AUTOLOAD=true`
3. Check database tables were created:
   ```sql
   \dt public.*analytics*
   ```

### Getting Errors?

1. Check backend logs: `npm run start:dev`
2. Look for "Activity tracking error" messages
3. Ensure all environment variables are set

### Want to Disable Temporarily?

Set in `.env`:
```bash
ANALYTICS_DB_AUTOLOAD=false
```

Restart server. No code changes needed.

---

## Performance Tips

### For Production

1. **Use separate database:**
   ```bash
   ANALYTICS_DB_URL=postgresql://user:pass@host:5432/analytics_db
   ```

2. **Enable Redis caching** (already configured)

3. **Tune retention:**
   ```bash
   ANALYTICS_DATA_RETENTION_DAYS=30  # Shorter period
   ```

### Monitor These Metrics

- Request latency (should be <2ms impact)
- Database write failures
- Cache hit rate

---

## Privacy Compliance

### User Requests Data Deletion

```typescript
// Delete all activities for a user
await this.activityService.deleteUserActivities('user-id');
```

### User Wants to Opt Out

```typescript
await this.privacyService.setOptOut('user-id', true);
```

### Export User Data

```typescript
const activities = await this.activityService.getUserActivities('user-id', 1000);
```

---

## Next Steps

1. **Review Full Documentation**: See `README.md` in analytics folder
2. **Add Custom Events**: Track domain-specific actions
3. **Build Dashboard**: Use analytics API endpoints
4. **Set Up Alerts**: Monitor failed writes, high latency

---

**Questions?** Check the full README or ask the team!
