# Analytics Deployment Checklist

## Pre-Deployment

### Environment Configuration
- [ ] Add analytics environment variables to production `.env`
- [ ] Set up separate analytics database (recommended)
- [ ] Configure database credentials securely
- [ ] Set `ANALYTICS_DB_SYNC=false` in production
- [ ] Verify `ANALYTICS_DATA_RETENTION_DAYS=90`

### Database Setup
- [ ] Create analytics database:
  ```sql
  CREATE DATABASE mindblock_analytics;
  ```
- [ ] Create database user:
  ```sql
  CREATE USER analytics_user WITH PASSWORD 'secure_password';
  GRANT ALL PRIVILEGES ON DATABASE mindblock_analytics TO analytics_user;
  ```
- [ ] Run migration script:
  ```bash
  psql -U analytics_user -d mindblock_analytics -f backend/scripts/create-analytics-tables.sql
  ```

### Dependencies
- [ ] Install `@nestjs/schedule`:
  ```bash
  npm install @nestjs/schedule
  ```
- [ ] Verify all TypeScript dependencies resolved
- [ ] Run `npm install` on production server

---

## Deployment Steps

### Step 1: Deploy Code
- [ ] Commit all analytics files
- [ ] Push to staging branch
- [ ] Run tests in staging environment
- [ ] Monitor for errors

### Step 2: Database Migration
- [ ] Execute SQL migration in production
- [ ] Verify tables created successfully
- [ ] Check indexes exist
- [ ] Test database connection

### Step 3: Environment Variables
- [ ] Set production env vars:
  ```bash
  ANALYTICS_DB_URL=postgresql://...
  ANALYTICS_DB_AUTOLOAD=true
  ANALYTICS_DB_SYNC=false
  ANALYTICS_DATA_RETENTION_DAYS=90
  RESPECT_DNT_HEADER=true
  ```

### Step 4: Restart Application
- [ ] Restart backend service
- [ ] Check startup logs for:
  - "Analytics database connection initialized"
  - No TypeORM errors
  - All modules loaded successfully

---

## Post-Deployment Verification

### Basic Functionality Tests

#### 1. Check Tracking is Working
```bash
# Make a test request
curl http://your-api.com/api/puzzles

# Wait 5 seconds, then check activities
curl http://your-api.com/analytics/activities?limit=5
```
Expected: Should see recent activity records

#### 2. Test Metrics API
```bash
# Get DAU
curl http://your-api.com/analytics/metrics/dau

# Get session duration
curl http://your-api.com/analytics/metrics/session-duration
```
Expected: Should return JSON with metrics

#### 3. Verify Swagger Docs
```
Visit: http://your-api.com/docs
Search for: "Analytics" section
```
Expected: 9 analytics endpoints documented

### Performance Checks

#### Response Time Impact
- [ ] Measure average request latency (should be <2ms increase)
- [ ] Check p95 latency (should be <10ms increase)
- [ ] Monitor database query times

#### Database Performance
- [ ] Check analytics DB CPU usage
- [ ] Monitor connection pool
- [ ] Verify indexes are being used

### Privacy Compliance Checks

#### Data Anonymization
- [ ] Query recent activities:
  ```sql
  SELECT "anonymizedIp" FROM user_activities LIMIT 10;
  ```
  Expected: IPs should end with 'xxx' (e.g., 192.168.1.xxx)

#### Metadata Sanitization
- [ ] Check metadata doesn't contain PII:
  ```sql
  SELECT metadata FROM user_activities WHERE metadata IS NOT NULL LIMIT 5;
  ```
  Expected: No email, password, phone fields

#### Opt-Out Mechanism
- [ ] Test opt-out functionality (if API endpoint implemented)
- [ ] Verify DNT header respected when set

---

## Monitoring Setup

### Logs to Monitor

#### Application Logs
Watch for these log messages:
- ✅ "Analytics database connection initialized"
- ✅ "Daily metrics calculated for {date}"
- ⚠️ "Activity tracking error: {message}"
- ⚠️ "Failed to record activity: {message}"
- ℹ️ "Deleted {count} expired activities"

#### Database Logs
Monitor:
- Connection count
- Query execution times
- Deadlock detection
- Disk usage growth

### Alerts to Configure

#### Critical Alerts
- [ ] Analytics DB connection failures
- [ ] Activity write failure rate > 5%
- [ ] Daily cleanup job failures
- [ ] Response latency increase > 50ms

#### Warning Alerts
- [ ] High database CPU (>80%)
- [ ] Low disk space on analytics DB
- [ ] Cache miss rate > 20%
- [ ] Unusual traffic spikes

### Dashboards to Build

#### Real-time Dashboard
Metrics to display:
- Active users (last 5 min)
- Requests per second
- Average response time
- Error rate

#### Daily Analytics Dashboard
Metrics to display:
- DAU trend (7-day view)
- WAU trend (4-week view)
- Average session duration
- Top features by usage
- Platform distribution
- Device distribution

---

## Rollback Plan

### If Issues Occur

#### Option 1: Disable Tracking Temporarily
```bash
# In .env file
ANALYTICS_DB_AUTOLOAD=false
```
Then restart service.

#### Option 2: Reduce Logging Volume
```bash
# Track only critical events
# Modify middleware to filter by event type
```

#### Option 3: Full Rollback
1. Revert code to previous version
2. Keep analytics DB (data will be preserved)
3. Resume normal operations

### Data Preservation
- Analytics data is retained even if disabled
- Can re-enable at any time
- Historical data remains queryable

---

## Success Criteria

### Week 1 Metrics
- [ ] Zero tracking-related errors
- [ ] <2ms average latency impact
- [ ] All 9 API endpoints responding
- [ ] Daily cleanup job runs successfully
- [ ] Metrics calculation completes without errors

### Month 1 Metrics
- [ ] 99.9% tracking accuracy
- [ ] <1% write failure rate
- [ ] Positive team feedback
- [ ] Privacy compliance verified
- [ ] Dashboard built and in use

---

## Team Communication

### Notify Stakeholders

#### Product Team
Subject: Analytics Tracking Now Available

"We've implemented comprehensive user activity tracking with privacy-compliant analytics. You can now access:
- Daily/Weekly active users
- Feature usage statistics  
- Session duration metrics
- Platform/device breakdowns

API docs: http://your-api.com/docs"

#### Engineering Team
Subject: New Analytics Middleware Deployed

"The analytics middleware is now live. Key points:
- Automatic tracking (no code changes needed)
- <2ms performance impact
- GDPR/CCPA compliant
- 9 new REST endpoints
- Full documentation in backend/src/analytics/

Questions? Check QUICKSTART.md or README.md"

#### Legal/Compliance Team
Subject: Privacy-Compliant Analytics Implemented

"We've deployed a new analytics system with:
- IP anonymization
- No PII storage
- Do-Not-Track support
- 90-day auto-deletion
- Opt-out capability

Ready for compliance review."

---

## Optional Enhancements (Future)

### Phase 2 Features
- [ ] Real-time WebSocket dashboard
- [ ] Custom event tracking API
- [ ] User segmentation
- [ ] Funnel analysis
- [ ] Retention cohorts
- [ ] A/B testing support
- [ ] Export functionality (CSV/PDF)
- [ ] Scheduled email reports

### Advanced Monitoring
- [ ] Anomaly detection
- [ ] Predictive analytics
- [ ] User journey mapping
- [ ] Conversion tracking

---

## Support Contacts

### Technical Issues
- Review: `backend/src/analytics/README.md`
- Quick reference: `backend/src/analytics/QUICKSTART.md`
- Implementation details: Check source code comments

### Escalation Path
1. Check logs and documentation
2. Test in staging environment
3. Consult team chat/channel
4. Create GitHub issue with details

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Version**: 1.0.0  
**Status**: ☐ Pending ☐ In Progress ☐ Complete ☐ Rolled Back

---

## Sign-Off

- [ ] Engineering Lead Approval
- [ ] Product Owner Notification
- [ ] Compliance Team Review (if required)
- [ ] Monitoring Dashboards Configured
- [ ] On-Call Team Briefed

**Ready for Production**: ☐ Yes ☐ No  
**Date Approved**: _______________
