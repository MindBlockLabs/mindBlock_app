import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AnalyticsController } from '../src/analytics/controllers/analytics.controller';
import { TrackEventProvider } from '../src/analytics/providers/track-event.provider';
import { GetOnboardingFunnelProvider } from '../src/analytics/providers/get-onboarding-funnel.provider';
import { GetRetentionCurveProvider } from '../src/analytics/providers/get-retention-curve.provider';
import { AnalyticsAdminGuard } from '../src/analytics/guards/analytics-admin.guard';
import { AnalyticsMetricResult } from '../src/analytics/dtos/analytics-metric-result.dto';

describe('GET /analytics/users/retention (e2e)', () => {
  let app: INestApplication<App>;

  const mockGetRetentionCurveProvider = { getRetentionCurve: jest.fn() };

  const fakeResult: AnalyticsMetricResult = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    granularity: 'day',
    data: [
      {
        cohortDate: '2024-01-15',
        cohortSize: 100,
        day1RetentionPct: 70,
        day7RetentionPct: 50,
        day30RetentionPct: 30,
      },
    ],
    total: 1,
  };

  // Real auth (JwtAuthMiddleware + AnalyticsAdminGuard checking req.user.userRole)
  // is exercised by unit tests on those pieces individually. Here we stand up
  // just the analytics controller and override the guard with a lightweight
  // stand-in driven by a test-only header, so this spec can focus on what it
  // owns: routing, DTO validation, and response shape.
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: TrackEventProvider, useValue: {} },
        { provide: GetOnboardingFunnelProvider, useValue: {} },
        {
          provide: GetRetentionCurveProvider,
          useValue: mockGetRetentionCurveProvider,
        },
      ],
    })
      .overrideGuard(AnalyticsAdminGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          return req.headers['x-test-role'] === 'admin';
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    // Mirrors the global pipe registered in main.ts, since this test app is
    // built from a minimal module rather than the full bootstrap path.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with the documented response shape for an admin caller', async () => {
    mockGetRetentionCurveProvider.getRetentionCurve.mockResolvedValue(
      fakeResult,
    );

    const res = await request(app.getHttpServer())
      .get('/analytics/users/retention')
      .set('x-test-role', 'admin')
      .query({
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-31T00:00:00.000Z',
        granularity: 'day',
      })
      .expect(200);

    expect(res.body).toEqual(fakeResult);
    expect(mockGetRetentionCurveProvider.getRetentionCurve).toHaveBeenCalledTimes(
      1,
    );
  });

  it('returns 403 for a caller without the admin role', async () => {
    await request(app.getHttpServer())
      .get('/analytics/users/retention')
      .query({
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-31T00:00:00.000Z',
      })
      .expect(403);

    expect(mockGetRetentionCurveProvider.getRetentionCurve).not.toHaveBeenCalled();
  });

  it('returns 400 with a clear validation message for an invalid granularity', async () => {
    const res = await request(app.getHttpServer())
      .get('/analytics/users/retention')
      .set('x-test-role', 'admin')
      .query({ granularity: 'century' })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('granularity')]),
    );
    expect(mockGetRetentionCurveProvider.getRetentionCurve).not.toHaveBeenCalled();
  });

  it('returns 400 when start is after end', async () => {
    const res = await request(app.getHttpServer())
      .get('/analytics/users/retention')
      .set('x-test-role', 'admin')
      .query({
        start: '2024-02-01T00:00:00.000Z',
        end: '2024-01-01T00:00:00.000Z',
      })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'start date must be before or equal to end date',
        ),
      ]),
    );
    expect(mockGetRetentionCurveProvider.getRetentionCurve).not.toHaveBeenCalled();
  });

  it('returns 400 for an unrecognized query param', async () => {
    await request(app.getHttpServer())
      .get('/analytics/users/retention')
      .set('x-test-role', 'admin')
      .query({ unknownParam: 'nope' })
      .expect(400);

    expect(mockGetRetentionCurveProvider.getRetentionCurve).not.toHaveBeenCalled();
  });
});
