## ADDED Requirements

### Requirement: Admin login issues JWT on valid credentials
**`POST /api/admin/login`** with `{ username, password }` SHALL return `{ ok: true, token }` on success or `401` on failure. Passwords SHALL be bcrypt-hashed in `admins` table.

#### Scenario: Successful login
- **WHEN** admin submits valid username and password
- **THEN** response includes JWT token with 8-hour expiry

#### Scenario: Failed login (E2E-D-05)
- **WHEN** admin submits wrong password
- **THEN** response is `401` with message "Wrong username or password."; no token issued; form field values preserved

### Requirement: JWT protects all admin routes
All `/api/admin/*` routes except login SHALL require `Authorization: Bearer <token>`. Missing or expired token SHALL return `403` with "Session expired — please log in again."

Frontend SHALL store JWT in `sessionStorage` (`mashood_admin_token`) — survives refresh in same tab; cleared on logout.

#### Scenario: Protected route without token
- **WHEN** `GET /api/admin/products` is called without Authorization header
- **THEN** response is `403`

#### Scenario: Expired token
- **WHEN** admin uses an expired JWT
- **THEN** API returns `403` and admin UI shows session expired message

### Requirement: Login rate limiting
Failed login attempts SHALL be rate-limited to 5 attempts per 15 minutes per IP.

#### Scenario: Brute force throttling
- **WHEN** same IP submits 6 failed logins within 15 minutes
- **THEN** further attempts are rejected until window expires

### Requirement: Admin login UI states
Login form SHALL show loading state "Checking…" during submission. Passwords and tokens SHALL never appear in logs.

#### Scenario: Login loading state
- **WHEN** admin submits login form
- **THEN** button shows "Checking…" until response returns
