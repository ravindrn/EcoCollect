# API Conventions

## Base URL

All endpoints are under `/api/v1`.

## Response Envelope

### Success

{ "success": true, "data": { } }

### Failure

{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human-readable message",
    "details": { }
  }
}

## Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Validation error |
| 401 | Missing/invalid token |
| 403 | Authenticated but not authorized |
| 404 | Not found |
| 409 | Conflict (duplicate email) |
| 500 | Internal server error |

## Authentication

- JWT Bearer token: `Authorization: Bearer <token>`.
- Access token contains `sub` (user ID) and `role`.

## Roles

`CITIZEN`, `DRIVER`, `ADMIN`. Enforced on the backend.

## Timestamps

UTC, ISO 8601: `2026-10-13T08:32:11.000Z`.

## Coordinates

- `latitude`, `longitude` — WGS 84 (EPSG:4326)
- PostGIS columns: `geography(Point,4326)`