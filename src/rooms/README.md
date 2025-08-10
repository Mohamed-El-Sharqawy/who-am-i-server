# Rooms Module

## Overview
The Rooms Module provides a comprehensive system for creating, managing, and participating in game rooms. It enables users to create rooms, join existing rooms, manage room settings, and track room status throughout the game lifecycle.

## Features
- **Room Creation**: Users can create custom game rooms with specific settings
- **Room Discovery**: Browse available rooms with pagination support
- **Room Joining**: Join existing rooms with appropriate validation
- **Room Management**: Update room settings, kick players, and manage game state
- **Real-time Updates**: Track room status changes in real-time
- **Pagination**: All list endpoints support standardized pagination

## Acceptance Criteria
- Users can create rooms with custom settings
- Users can browse available rooms with pagination
- Users can join rooms if they meet requirements
- Room creators can manage room settings and participants
- Room state transitions are properly handled (waiting → playing → completed)
- All room operations are properly secured with authentication
- All GET endpoints return paginated results with consistent metadata

## Technical Implementation

### Architecture
- **Controller**: Handles HTTP requests, validates input, and returns appropriate responses
- **Service**: Contains business logic, database operations, and event handling
- **DTOs**: Define data transfer objects for request/response validation
- **Gateway**: Manages real-time communication for room events

### Database Schema
- **Room Entity**: Represents a game room
  - Fields: `id`, `name`, `creatorId`, `guestId`, `status`, `maxPlayers`, `isActive`, `createdAt`, `updatedAt`
  - Status values: `WAITING`, `PLAYING`, `COMPLETED`

### Caching Strategy
- Redis is used to cache:
  - Available rooms list with pagination parameters
  - User's rooms list with pagination parameters
  - Room details for frequently accessed rooms
  - Room events for real-time updates
- Cache invalidation occurs on room status changes

### Integration Points
- **User Module**: Depends on user data for room creation and joining
- **Game Module**: Integrates with game logic for gameplay
- **Socket Gateway**: Emits events for real-time room updates
- **Redis Service**: Manages caching and room state
- **Common Module**: Utilizes pagination service for standardized list responses

### Technologies & Packages
- NestJS for API framework
- Prisma ORM for database operations
- Redis for caching and room state management
- Socket.IO for real-time updates
- Swagger for API documentation

## Usage Examples

### Creating a Room
```typescript
// Client-side example
const response = await api.post('/rooms', {
  name: 'Fun Game Room',
  maxPlayers: 2,
  isPrivate: false
});
```

### Getting Available Rooms with Pagination
```typescript
// Client-side example
const response = await api.get('/rooms/available?page=1&limit=10');
// Returns: { data: [...], currentPage: 1, pagesCount: 5, totalCount: 42, limit: 10, hasNext: true, hasPrev: false }
```

### Joining a Room
```typescript
// Client-side example
const response = await api.post('/rooms/123/join', { password: 'optional-password' });
```

## Performance Considerations
- Room lists are cached with pagination parameters to reduce database load
- Room status updates use Redis pub/sub for efficient real-time notifications
- Inactive rooms are automatically cleaned up to maintain database performance

## Security Considerations
- Room creation and management endpoints are protected with JWT authentication
- Room joining may require password validation for private rooms
- Only room creators can modify room settings
- Rate limiting is applied to room creation to prevent abuse
