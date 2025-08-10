# Friends Module

## Overview
The Friends Module provides comprehensive friend relationship management functionality with real-time status tracking. It enables users to send, accept, and reject friend requests, manage blocked users, and track online/offline/in-game status of friends.

## Features
- **Friend Request Management**: Send, accept, reject, and cancel friend requests
- **Friend Listing**: Retrieve paginated lists of friends with online status
- **Blocking System**: Block and unblock users with appropriate notifications
- **Real-time Status Tracking**: Monitor online/offline/in-game status of friends
- **Notifications**: Real-time notifications for friend-related events
- **Pagination**: All GET endpoints support standardized pagination

## Acceptance Criteria
- Users can send friend requests to other users
- Users can accept or reject incoming friend requests
- Users can view a paginated list of their friends with status indicators
- Users can block and unblock other users
- Users receive real-time notifications about friend status changes
- All friend-related operations are properly secured with authentication
- All GET endpoints return paginated results with consistent metadata

## Technical Implementation

### Architecture
- **Controller**: Handles HTTP requests, validates input, and returns appropriate responses
- **Service**: Contains business logic, database operations, and event handling
- **DTOs**: Define data transfer objects for request/response validation
- **Events**: Define events for real-time notifications

### Database Schema
- **Friend Entity**: Represents a friend relationship between two users
  - Fields: `id`, `senderId`, `receiverId`, `status`, `createdAt`, `updatedAt`
  - Status values: `PENDING`, `ACCEPTED`, `REJECTED`, `BLOCKED`

### Caching Strategy
- Redis is used to cache:
  - User online status and presence information
  - Friend lists with pagination parameters
  - Status update events for real-time notifications
- Cache invalidation occurs on friend relationship changes

### Integration Points
- **User Module**: Depends on user data for friend relationship management
- **Socket Gateway**: Emits events for real-time status updates
- **Redis Service**: Manages caching and presence data
- **Common Module**: Utilizes pagination service for standardized list responses

### Technologies & Packages
- NestJS for API framework
- Prisma ORM for database operations
- Redis for caching and presence tracking
- Socket.IO for real-time notifications
- Swagger for API documentation

## Usage Examples

### Sending a Friend Request
```typescript
// Client-side example
const response = await api.post('/friends/request', { userId: 'target-user-id' });
```

### Accepting a Friend Request
```typescript
// Client-side example
const response = await api.post('/friends/accept', { requestId: 'friend-request-id' });
```

### Getting Friends List with Pagination
```typescript
// Client-side example
const response = await api.get('/friends?page=1&limit=10');
// Returns: { data: [...], currentPage: 1, pagesCount: 5, totalCount: 42, limit: 10, hasNext: true, hasPrev: false }
```

## Performance Considerations
- Friend lists are cached with pagination parameters to reduce database load
- Status updates use Redis pub/sub for efficient real-time notifications
- Batch operations are used for status updates to multiple friends

## Security Considerations
- All endpoints are protected with JWT authentication
- Users can only manage their own friend relationships
- Blocked users cannot send friend requests or view status
