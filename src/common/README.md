# Common Module

## Overview
The Common Module provides shared utilities, interfaces, services, and components that are used throughout the "Who Am I?" game platform. It centralizes cross-cutting concerns and promotes code reuse, consistency, and maintainability across the application.

## Features
- **Pagination**: Standardized pagination implementation for all list endpoints
- **DTOs**: Common data transfer objects used across modules
- **Interfaces**: Shared type definitions and contracts
- **Utilities**: Helper functions for common operations
- **Interceptors**: Cross-cutting request/response processing
- **Filters**: Global exception handling and error formatting
- **Decorators**: Custom decorators for common patterns

## Acceptance Criteria
- Common utilities are properly typed and tested
- Pagination implementation is consistent across all modules
- Shared interfaces are well-documented and properly used
- Error handling is consistent and informative
- Code duplication is minimized across the application

## Technical Implementation

### Architecture
- **Module Structure**: Organized by functionality (interfaces, services, filters, etc.)
- **Service Design**: Stateless, injectable services for shared functionality
- **Interface Design**: Clear, well-typed interfaces for consistent data structures

### Key Components

#### Pagination Service
- Provides standardized pagination for all list endpoints
- Calculates pagination metadata (current page, total pages, etc.)
- Ensures consistent response format across the application

#### Pagination Interface
- Defines the structure for paginated responses
- Includes data array and metadata (currentPage, pagesCount, totalCount, etc.)
- Used consistently across all modules returning collections

#### Exception Filters
- Handles exceptions in a consistent manner
- Formats error responses with appropriate status codes and messages
- Provides detailed error information in development mode

#### Validation Pipes
- Ensures input validation is consistent across the application
- Transforms and validates incoming data based on DTOs
- Provides clear validation error messages

### Integration Points
- **All Modules**: Used throughout the application for shared functionality
- **Main Application**: Configures global filters, pipes, and interceptors
- **API Documentation**: Provides consistent response schemas for Swagger

### Technologies & Packages
- NestJS for framework integration
- Class-validator and class-transformer for validation
- Swagger for API documentation
- TypeScript for strong typing

## Usage Examples

### Using Pagination Service
```typescript
// Server-side example
@Injectable()
export class SomeService {
  constructor(private paginationService: PaginationService) {}

  async getItems(page = 1, limit = 10): Promise<PaginatedResult<Item>> {
    const totalCount = await this.repository.count();
    const items = await this.repository.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return this.paginationService.paginate(items, totalCount, page, limit);
  }
}
```

### Using Pagination Interface in Controller
```typescript
// Server-side example
@Get()
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
async getItems(
  @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
): Promise<PaginatedResult<ItemDto>> {
  return this.itemsService.getItems(page || 1, limit || 10);
}
```

### Using Exception Filters
```typescript
// Server-side example in main.ts
app.useGlobalFilters(new HttpExceptionFilter());
```

## Performance Considerations
- Shared utilities are optimized for performance
- Pagination calculations are efficient even with large datasets
- Common functions avoid unnecessary computations and memory usage

## Maintainability Considerations
- Clear documentation for all shared components
- Consistent naming conventions across the module
- Unit tests for critical shared functionality
- Version compatibility maintained for all shared interfaces
