# Categories Module

## Overview
The Categories Module manages the classification system for cards in the "Who Am I?" game. It provides functionality for creating, retrieving, and managing categories that organize cards into thematic groups, enhancing game organization and enabling targeted gameplay experiences.

## Features
- **Category Management**: Create, update, retrieve, and delete categories
- **Card Association**: View cards associated with specific categories
- **Pagination**: All list endpoints support standardized pagination
- **Admin Controls**: Special endpoints for administrators to manage categories

## Acceptance Criteria
- Categories can be created with name, description, and optional icon
- Categories can be retrieved individually or in paginated lists
- Cards can be filtered by category
- Administrators can manage all categories
- Regular users can only view categories
- All GET endpoints return paginated results with consistent metadata

## Technical Implementation

### Architecture
- **Controller**: Handles HTTP requests, validates input, and returns appropriate responses
- **Service**: Contains business logic and database operations
- **DTOs**: Define data transfer objects for request/response validation
- **Entities**: Define the category data structure

### Database Schema
- **Category Entity**: Represents a card category
  - Fields: `id`, `name`, `description`, `iconUrl`, `createdAt`, `updatedAt`
  - Relations: One-to-many with Card

### Caching Strategy
- Redis is used to cache:
  - Category lists with pagination parameters
  - Individual category details
  - Category-card associations
- Cache invalidation occurs on category creation, update, or deletion

### Integration Points
- **Cards Module**: Provides categorization for cards
- **Redis Service**: Manages caching of category data
- **Common Module**: Utilizes pagination service for standardized list responses
- **Cloudinary Module**: Manages category icon uploads and storage

### Technologies & Packages
- NestJS for API framework
- Prisma ORM for database operations
- Redis for caching
- Cloudinary for icon storage
- Swagger for API documentation

## Usage Examples

### Creating a Category (Admin only)
```typescript
// Client-side example
const response = await api.post('/categories', {
  name: 'Scientists',
  description: 'Famous scientists throughout history',
  iconUrl: 'https://example.com/scientist-icon.png'
});
```

### Getting Categories with Pagination
```typescript
// Client-side example
const response = await api.get('/categories?page=1&limit=10');
// Returns: { data: [...], currentPage: 1, pagesCount: 2, totalCount: 15, limit: 10, hasNext: true, hasPrev: false }
```

### Getting Cards by Category
```typescript
// Client-side example
const response = await api.get('/categories/science-category-id/cards?page=1&limit=20');
```

## Performance Considerations
- Category lists are cached with pagination parameters to reduce database load
- Icons are stored and served via Cloudinary CDN for optimal performance
- Database indexes on frequently queried fields (name)

## Security Considerations
- Category creation and management endpoints are protected with admin role authorization
- Input validation ensures data integrity
- Rate limiting is applied to high-traffic endpoints
