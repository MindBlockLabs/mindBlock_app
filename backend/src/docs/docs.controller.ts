import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

type MigrationGuide = {
  from: string;
  to: string;
  summary: string;
  breakingChanges: string[];
  actions: string[];
  docPath: string;
};

const MIGRATION_GUIDES: Record<string, MigrationGuide> = {
  'v0-to-v1': {
    from: 'v0',
    to: 'v1',
    summary:
      'v0 has been removed. Move clients to the maintained v1 route shape immediately.',
    breakingChanges: [
      'Requests to v0 now return 410 Gone.',
      'Clients must switch to /api/v1/* or send X-API-Version: 1.',
    ],
    actions: [
      'Update hard-coded v0 URLs to /api/v1/*.',
      'Retest pagination and response handling against the v1 contract.',
    ],
    docPath: '/backend/docs/migrations/v0-to-v1.md',
  },
  'v1-to-v2': {
    from: 'v1',
    to: 'v2',
    summary:
      'Puzzle responses move to a response envelope and pagination uses pageSize instead of limit.',
    breakingChanges: [
      'GET /puzzles/:id returns { data, version } instead of a raw puzzle object.',
      'GET /puzzles returns meta.pageSize instead of meta.limit.',
      'GET /puzzles/daily-quest returns an envelope instead of a plain array.',
      'v2 rejects legacy limit in favor of pageSize.',
    ],
    actions: [
      'Update clients to request /api/v2/* or send X-API-Version: 2.',
      'Replace limit with pageSize in frontend query builders.',
      'Adjust response mappers to read payloads from data.',
      'Monitor X-API-Deprecation and Sunset headers while v1 traffic drains.',
    ],
    docPath: '/backend/docs/migrations/v1-to-v2.md',
  },
};

@Controller('docs')
export class DocsController {
  @Get()
  getVersionDocsIndex() {
    return {
      latest: '/api/docs/latest',
      versions: {
        v1: '/api/docs/v1',
        v2: '/api/docs/v2',
      },
      migrations: Object.keys(MIGRATION_GUIDES).map(
        (guideId) => `/api/docs/migrations/${guideId}`,
      ),
    };
  }

  @Get('migrations/:guideId')
  getMigrationGuide(@Param('guideId') guideId: string) {
    const guide = MIGRATION_GUIDES[guideId];

    if (!guide) {
      throw new NotFoundException(`Migration guide "${guideId}" was not found.`);
    }

    return guide;
  }
}
