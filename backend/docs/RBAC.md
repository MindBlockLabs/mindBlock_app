# Role-Based Access Control

The backend uses a route decorator plus guard for role-based access control.

## Supported roles

- `USER`
- `MODERATOR`
- `ADMIN`

Canonical enum: `backend/src/users/enums/userRole.enum.ts`

## Hierarchy

- `ADMIN` inherits `MODERATOR` and `USER` permissions
- `MODERATOR` inherits `USER` permissions
- `USER` only has `USER` permissions

## Basic usage

```ts
@Roles(userRole.ADMIN)
@Post()
createPuzzle() {}
```

This returns `403 Forbidden` with:

```txt
Access denied. Required role: ADMIN
```

## Multiple roles (OR logic)

```ts
@Roles(userRole.ADMIN, userRole.MODERATOR)
@Get()
findAllUsers() {}
```

Any listed role is enough.

## Ownership-aware access

```ts
@Roles({ roles: [userRole.ADMIN], ownership: { param: 'id' } })
@Patch(':id')
updateUser() {}
```

This allows either:

- an `ADMIN`
- the authenticated user whose `userId` matches `req.params.id`

## Notes

- RBAC runs after authentication middleware and expects `request.user.userRole`
- Missing role information in the auth context is treated as a server error
- Denied access attempts are logged for audit/security review
