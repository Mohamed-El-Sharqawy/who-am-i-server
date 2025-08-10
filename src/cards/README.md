# Cards Module

## Overview
The Cards Module manages the game cards system, providing functionality for creating, retrieving, and managing cards used in the "Who Am I?" game. Cards contain characters, personalities, or entities that players need to guess during gameplay.

## Features
- **Card Management**: Create, update, retrieve, and delete cards
- **Category Association**: Associate cards with specific categories
- **Pagination**: All list endpoints support standardized pagination
- **Card Search**: Search cards by name or description
- **Admin Controls**: Special endpoints for administrators to manage cards

## Acceptance Criteria
- Cards can be created with name, description, and category
- Cards can be retrieved individually or in paginated lists
- Cards can be filtered by category
- Cards can be searched by name or description
- Administrators can manage all cards
- Regular users can only view cards
- All GET endpoints return paginated results with consistent metadata

## Technical Implementation

### Architecture
- **Controller**: Handles HTTP requests, validates input, and returns appropriate responses
- **Service**: Contains business logic and database operations
- **DTOs**: Define data transfer objects for request/response validation
- **Entities**: Define the card data structure

### Database Schema
- **Card Entity**: Represents a game card
  - Fields: `id`, `name`, `description`, `imageUrl`, `categoryId`, `difficulty`, `createdAt`, `updatedAt`
  - Relations: Many-to-one with Category

### Caching Strategy
- Redis is used to cache:
  - Card lists with pagination parameters
  - Individual card details
  - Category-filtered card lists
- Cache invalidation occurs on card creation, update, or deletion

### Integration Points
- **Categories Module**: Depends on categories for card classification
- **Game Module**: Provides cards for gameplay
- **Redis Service**: Manages caching of card data
- **Common Module**: Utilizes pagination service for standardized list responses
- **Cloudinary Module**: Manages card image uploads and storage

### Technologies & Packages
- NestJS for API framework
- Prisma ORM for database operations
- Redis for caching
- Cloudinary for image storage
- Swagger for API documentation

## Usage Examples

### Creating a Card (Admin only)
```typescript
// Client-side example
const response = await api.post('/cards', {
  name: 'Albert Einstein',
  description: 'Famous physicist known for the theory of relativity',
  categoryId: 'science-category-id',
  difficulty: 'MEDIUM',
  imageUrl: 'https://example.com/einstein.jpg'
});
```

### Getting Cards with Pagination
```typescript
// Client-side example
const response = await api.get('/cards?page=1&limit=20&categoryId=science-category-id');
// Returns: { data: [...], currentPage: 1, pagesCount: 5, totalCount: 100, limit: 20, hasNext: true, hasPrev: false }
```

### Searching Cards
```typescript
// Client-side example
const response = await api.get('/cards/search?query=einstein');
```

## Performance Considerations
- Card lists are cached with pagination parameters to reduce database load
- Images are stored and served via Cloudinary CDN for optimal performance
- Database indexes on frequently queried fields (name, categoryId)

## Security Considerations
- Card creation and management endpoints are protected with admin role authorization
- Input validation ensures data integrity
- Rate limiting is applied to search endpoints to prevent abuse
