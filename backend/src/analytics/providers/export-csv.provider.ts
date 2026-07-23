import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { format as formatCsv } from 'fast-csv';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { RetentionCohort } from '../entities/retention-cohort.entity';
import {
  AnalyticsQueryDto,
  ExportMetric,
  ExportFormat,
} from '../dtos/analytics-query.dto';

const ONBOARDING_EVENTS = [
  { name: 'Onboarding Started', eventType: 'onboarding_started' },
  { name: 'Profile Created', eventType: 'profile_created' },
  { name: 'Tutorial Viewed', eventType: 'tutorial_viewed' },
  { name: 'First Puzzle Attempted', eventType: 'first_puzzle_attempted' },
  { name: 'Onboarding Completed', eventType: 'onboarding_completed' },
];

export interface ExportResult {
  contentType: string;
  filename: string;
  body: string;
}

/**
 * Exports a chosen analytics metric (retention curve or onboarding funnel)
 * over a date range, as CSV or JSON.
 *
 * Queries the same underlying tables as GetRetentionCurveProvider /
 * GetOnboardingFunnelProvider directly, rather than depending on those
 * providers, so this stays a self-contained unit with two mockable
 * repositories.
 */
@Injectable()
export class ExportCsvProvider {
  constructor(
    @InjectRepository(RetentionCohort)
    private readonly retentionCohortRepo: Repository<RetentionCohort>,
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepo: Repository<AnalyticsEvent>,
  ) {}

  async export(query: AnalyticsQueryDto): Promise<ExportResult> {
    const { metric, format = ExportFormat.CSV } = query;

    const rows =
      metric === ExportMetric.RETENTION
        ? await this.getRetentionRows(query)
        : await this.getFunnelRows(query);

    const filename = `analytics-export-${metric}.${format}`;

    if (format === ExportFormat.JSON) {
      return {
        contentType: 'application/json',
        filename,
        body: JSON.stringify(rows),
      };
    }

    const body = await this.toCsv(rows, metric);
    return { contentType: 'text/csv', filename, body };
  }

  private async getRetentionRows(
    query: AnalyticsQueryDto,
  ): Promise<Record<string, unknown>[]> {
    const startDate = query.start
      ? query.start.toISOString().split('T')[0]
      : new Date(0).toISOString().split('T')[0];
    const endDate = query.end
      ? query.end.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const cohorts = await this.retentionCohortRepo.find({
      where: { cohortDate: Between(startDate, endDate) as any },
      order: { cohortDate: 'ASC' },
    });

    return cohorts.map((c) => ({
      cohortDate: c.cohortDate,
      cohortSize: c.cohortSize,
      retainedDay1: c.retainedDay1,
      retainedDay7: c.retainedDay7,
      retainedDay30: c.retainedDay30,
    }));
  }

  private async getFunnelRows(
    query: AnalyticsQueryDto,
  ): Promise<Record<string, unknown>[]> {
    const start = query.start || new Date(0);
    const end = query.end || new Date();

    const rows: Record<string, unknown>[] = [];
    for (const stage of ONBOARDING_EVENTS) {
      const count = await this.analyticsEventRepo.count({
        where: { eventType: stage.eventType, timestamp: Between(start, end) },
      });
      rows.push({ stage: stage.name, eventType: stage.eventType, count });
    }
    return rows;
  }

  private static readonly CSV_HEADERS: Record<ExportMetric, string[]> = {
    [ExportMetric.RETENTION]: [
      'cohortDate',
      'cohortSize',
      'retainedDay1',
      'retainedDay7',
      'retainedDay30',
    ],
    [ExportMetric.ONBOARDING_FUNNEL]: ['stage', 'eventType', 'count'],
  };

  private toCsv(
    rows: Record<string, unknown>[],
    metric: ExportMetric,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: string[] = [];
      const headers = ExportCsvProvider.CSV_HEADERS[metric];
      // alwaysWriteHeaders ensures a header-only CSV for empty results,
      // instead of an ambiguous empty body.
      const stream = formatCsv({ headers, alwaysWriteHeaders: true });
      stream.on('data', (chunk) => chunks.push(chunk.toString()));
      stream.on('end', () => resolve(chunks.join('')));
      stream.on('error', reject);

      for (const row of rows) {
        stream.write(row);
      }
      stream.end();
    });
  }
}
