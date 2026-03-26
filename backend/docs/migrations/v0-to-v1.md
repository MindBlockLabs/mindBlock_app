# Migration Guide: v0 to v1

Version 0 has been removed and now returns `410 Gone`.

## Required action

1. Move all clients to `/api/v1/*`
2. Update any fallback version headers or query parameters to `1`
3. Re-test integrations against the maintained v1 contract
