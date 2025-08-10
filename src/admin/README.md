# Admin Module

## Overview
The Admin Module provides administrative capabilities for the "Who Am I?" game platform. It enables system administrators to manage users, monitor system performance, configure game settings, and perform other administrative tasks necessary for platform maintenance and operation.

## Features
- **User Management**: View, edit, and manage user accounts
- **Role Management**: Promote or demote users to different roles
- **Dashboard**: View system statistics and performance metrics
- **Content Management**: Manage game content like cards and categories
- **System Configuration**: Configure global system settings
- **Pagination**: All list endpoints support standardized pagination

## Acceptance Criteria
- Administrators can view a paginated list of all users
- Administrators can promote regular users to admin role
- Administrators can demote admins to regular user role
- Dashboard provides key system metrics and statistics
- All administrative operations are properly secured
- All GET endpoints return paginated results with consistent metadata
- Administrative actions are properly logged for audit purposes

## Technical Implementation

### Architecture
- **Controller**: Handles HTTP requests, validates input, and returns appropriate responses
- **Service**: Contains business logic and database operations
- **Guards**: Ensure only administrators can access admin endpoints
- **DTOs**: Define data transfer objects for request/response validation

### Security Model
- **Role-Based Access Control**: All endpoints restricted to users with ADMIN role
- **Action Logging**: Administrative actions are logged for audit purposes
- **Input Validation**: Strict validation of all administrative inputs

### Integration Points
- **Auth Module**: Leverages role-based guards for access control
- **Users Module**: Manages user data and roles
- **Common Module**: Utilizes pagination service for standardized list responses
- **Logging Service**: Records administrative actions

### Technologies & Packages
- NestJS for API framework
- Prisma ORM for database operations
- JWT for authentication
- Swagger for API documentation

## Usage Examples

### Getting All Users with Pagination
```typescript
// Client-side example (admin only)
const response = await api.get('/admin/users?page=1&limit=20');
// Returns: { data: [...], currentPage: 1, pagesCount: 10, totalCount: 200, limit: 20, hasNext: true, hasPrev: false }
```

### Promoting a User to Admin
```typescript
// Client-side example (admin only)
const response = await api.post('/admin/users/promote', { userId: 'user-id-to-promote' });
```

### Demoting an Admin to User
```typescript
// Client-side example (admin only)
const response = await api.post('/admin/users/demote', { userId: 'user-id-to-demote' });
```

## Performance Considerations
- User lists are cached with pagination parameters to reduce database load
- Dashboard metrics are cached with appropriate TTL
- Heavy administrative operations are performed asynchronously when possible

## Security Considerations
- All endpoints are protected with both JWT authentication and admin role verification
- Sensitive operations require confirmation
- Rate limiting is applied to prevent abuse
- IP-based access restrictions can be configured for additional security
