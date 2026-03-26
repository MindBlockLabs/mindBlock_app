# API Versioning

The backend now supports concurrent API versions for versioned resources.

## Supported selectors

- URL path: `/api/v1/puzzles`, `/api/v2/puzzles`
- Header: `X-API-Version: 1`
- Query parameter: `?api_version=1`

If more than one selector is provided, all explicit values must match. Conflicts return `400 Bad Request`.

## Resolution order

1. URL path version
2. Header version
3. Query parameter version
4. Latest active version when no version is supplied

Current default version: `v2`

## Lifecycle

- `v2`: active
- `v1`: deprecated, sunset scheduled for `2026-06-24T00:00:00.000Z`
- `v0`: removed and returns `410 Gone`

Deprecated responses include:

- `X-API-Deprecation: true`
- `Warning: 299 - "..."`
- `Sunset: <rfc1123 date>` when a sunset date exists

Every versioned response includes:

- `X-API-Version`
- `X-API-Latest-Version`
- `X-API-Version-Status`

## Version differences

### v1 puzzles

- Pagination uses `page` and `limit`
- Item endpoints return the raw puzzle object
- Collection endpoints return `{ data, meta: { page, limit, total } }`

### v2 puzzles

- Pagination uses `page` and `pageSize`
- `pageSize` is capped at 50
- Item endpoints return `{ data, version }`
- Collection endpoints return `{ data, meta: { page, pageSize, total, version, includeCategorySummary } }`

## Auto-generated docs

- Latest: `/api/docs/latest`
- v1: `/api/docs/v1`
- v2: `/api/docs/v2`
