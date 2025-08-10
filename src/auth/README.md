# Authentication Module

## Overview
The Authentication Module provides comprehensive user authentication and authorization functionality for the "Who Am I?" game platform. It handles user registration, login, token management, role-based access control, and security features to protect application resources.

## Features
- **User Authentication**: Registration, login, and token-based session management
- **OAuth Integration**: Support for social login providers (Google, Facebook, etc.)
- **Role-Based Access Control**: Granular permission system based on user roles
- **JWT Management**: Secure token generation, validation, and refresh mechanisms
- **Password Management**: Secure password hashing, reset, and recovery flows
- **Security Guards**: Protection for API endpoints based on authentication status and roles

## Acceptance Criteria
- Users can register with email/password or social providers
- Users can log in and receive valid JWT tokens
- Tokens are properly validated on protected endpoints
- Role-based access control restricts unauthorized operations
- Password reset and recovery flows work securely
- JWT refresh mechanism extends sessions without requiring re-login
- All authentication operations are properly secured and logged

## Technical Implementation

### Architecture
- **Controllers**: Handle authentication requests and responses
- **Services**: Implement authentication business logic
- **Guards**: Protect routes based on authentication status and roles
- **Strategies**: Implement various authentication strategies (JWT, OAuth)
- **Decorators**: Provide custom decorators for role-based access control

### Security Features
- **JWT Tokens**: Secure, short-lived access tokens with refresh capability
- **Password Hashing**: Bcrypt hashing with appropriate salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Cross-Site Request Forgery prevention
- **HTTP-Only Cookies**: Secure cookie handling for refresh tokens

### Integration Points
- **User Module**: Depends on user data for authentication
- **Redis Service**: Manages token blacklisting and rate limiting
- **Email Service**: Sends verification and password reset emails
- **OAuth Providers**: Integrates with external authentication providers

### Technologies & Packages
- NestJS for API framework
- Passport.js for authentication strategies
- JWT for token-based authentication
- Bcrypt for password hashing
- Redis for token management and rate limiting

## Usage Examples

### User Registration
```typescript
// Client-side example
const response = await api.post('/auth/register', {
  email: 'user@example.com',
  password: 'securePassword123',
  username: 'gamemaster'
});
```

### User Login
```typescript
// Client-side example
const response = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'securePassword123'
});
// Returns: { accessToken: '...', refreshToken: '...', user: {...} }
```

### Token Refresh
```typescript
// Client-side example
const response = await api.post('/auth/refresh', {
  refreshToken: 'current-refresh-token'
});
// Returns: { accessToken: '...', refreshToken: '...' }
```

### Protecting Routes with Guards
```typescript
// Server-side example
@Get('protected-resource')
@UseGuards(JwtAuthGuard)
getProtectedResource() {
  // Only accessible to authenticated users
}

@Get('admin-resource')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
getAdminResource() {
  // Only accessible to users with ADMIN role
}
```

## Performance Considerations
- Token validation is optimized to minimize database queries
- Redis caching for blacklisted tokens improves validation speed
- Stateless JWT authentication reduces server-side session storage

## Security Considerations
- Access tokens have short expiration times (15-60 minutes)
- Refresh tokens are stored securely and rotated on use
- Password requirements enforce strong security practices
- Rate limiting prevents brute force attacks
- Sensitive operations require re-authentication
