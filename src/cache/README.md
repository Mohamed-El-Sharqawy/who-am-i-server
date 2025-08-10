# Cache Module

## Overview
The Cache Module provides a centralized caching infrastructure for the "Who Am I?" game platform. It implements efficient data caching strategies using Redis to improve application performance, reduce database load, and enhance user experience through faster response times.

## Features
- **Redis Integration**: Seamless integration with Redis for high-performance caching
- **Generic Caching Interface**: Type-safe methods for storing and retrieving various data types
- **TTL Management**: Configurable time-to-live for cached items
- **Object Serialization**: Automatic serialization/deserialization of complex objects
- **Cache Invalidation**: Strategies for invalidating and refreshing cached data
- **Presence Tracking**: Real-time user presence and status tracking

## Acceptance Criteria
- Cache operations are type-safe and handle serialization automatically
- Cache hits significantly improve response times for frequent operations
- Cache invalidation occurs appropriately when underlying data changes
- Redis connection is properly managed and resilient to failures
- Presence data accurately reflects user online status
- Cache configuration is environment-aware (development vs. production)

## Technical Implementation

### Architecture
- **Redis Service**: Core service providing Redis client and caching operations
- **Cache Interceptors**: Optional interceptors for automatic controller-level caching
- **Cache Decorators**: Method decorators for simplified cache integration

### Key Features
- **String Operations**: Set/get string values with optional expiration
- **Object Operations**: Set/get serialized objects with type safety
- **List Operations**: Manage Redis lists for ordered data collections
- **Hash Operations**: Store and retrieve field-value pairs
- **Pub/Sub**: Publish and subscribe to channels for real-time events
- **Presence Tracking**: Track user online status and activity

### Integration Points
- **All Modules**: Used throughout the application for performance optimization
- **Config Module**: Sources Redis connection configuration
- **Friends Module**: Leverages presence tracking for online status
- **Game Module**: Uses pub/sub for real-time game events
- **Rooms Module**: Caches room data for quick access

### Technologies & Packages
- NestJS for API framework
- Redis for caching and pub/sub
- IORedis client for Redis operations
- JSON serialization for complex objects

## Usage Examples

### Caching an Object
```typescript
// Server-side example
await this.redisService.setObject(
  'user:profile:123',
  userProfile,
  3600 // TTL in seconds (1 hour)
);

// Later, retrieve the object
const cachedProfile = await this.redisService.getObject<UserProfile>('user:profile:123');
if (cachedProfile) {
  return cachedProfile;
}
```

### Implementing Cache-Aside Pattern
```typescript
// Server-side example
async getUserProfile(userId: string): Promise<UserProfile> {
  const cacheKey = `user:profile:${userId}`;
  
  // Try to get from cache first
  const cachedProfile = await this.redisService.getObject<UserProfile>(cacheKey);
  if (cachedProfile) {
    return cachedProfile;
  }
  
  // If not in cache, get from database
  const profile = await this.userRepository.findOne(userId);
  
  // Store in cache for future requests
  await this.redisService.setObject(cacheKey, profile, 3600);
  
  return profile;
}
```

### Tracking User Presence
```typescript
// Server-side example
// When user connects
await this.redisService.setObject(
  `user_presence:${userId}`,
  { status: 'ONLINE', lastSeen: new Date() },
  null // No expiration, will be explicitly removed on disconnect
);

// When checking if user is online
const presence = await this.redisService.getObject(`user_presence:${userId}`);
const isOnline = presence && presence.status === 'ONLINE';
```

## Performance Considerations
- Cache keys are structured hierarchically for efficient management
- TTL values are tuned based on data volatility and access patterns
- Memory usage is monitored to prevent Redis overload
- Batch operations are used when appropriate to reduce network overhead

## Security Considerations
- No sensitive data is stored in cache without encryption
- Redis instance is properly secured with authentication
- Cache poisoning prevention through input validation
- Cache keys include appropriate namespacing to prevent collisions
