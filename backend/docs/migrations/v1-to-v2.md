# Migration Guide: v1 to v2

This guide covers the breaking changes between puzzle API v1 and v2.

## Routing

- Preferred: move from `/api/v1/puzzles` to `/api/v2/puzzles`
- Alternative negotiation also works with `X-API-Version: 2` or `?api_version=2`

## Response contract changes

- `GET /puzzles/:id`
  - v1: returns a puzzle object directly
  - v2: returns `{ data: <puzzle>, version: "2" }`

- `GET /puzzles`
  - v1: returns `{ data, meta: { page, limit, total } }`
  - v2: returns `{ data, meta: { page, pageSize, total, version, includeCategorySummary } }`

- `GET /puzzles/daily-quest`
  - v1: returns `Puzzle[]`
  - v2: returns `{ data: Puzzle[], meta: ... }`

## Request contract changes

- Replace `limit` with `pageSize`
- Expect stricter validation in v2:
  - `pageSize` max is `50`
  - unsupported legacy query fields are rejected by the validation pipe

## Suggested frontend rollout

1. Update API client defaults to send `X-API-Version: 2`
2. Adjust response mappers for the new envelope format
3. Replace any `limit` usage with `pageSize`
4. Monitor deprecation headers while v1 traffic drains
5. Remove v1-specific parsing before the sunset date
