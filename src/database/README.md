# Database Module

## Overview
The Database Module provides a centralized database access layer for the "Who Am I?" game platform. It implements the Prisma ORM integration, manages database connections, migrations, and provides a consistent interface for data access across the application.

## Features
- **Prisma ORM Integration**: Type-safe database access with Prisma
- **Connection Management**: Efficient database connection pooling
- **Migration Support**: Database schema versioning and migrations
- **Seeding**: Database seeding for development and testing
- **Transaction Support**: ACID-compliant transaction management
- **Query Optimization**: Performance-optimized database queries

## Acceptance Criteria
- Database connections are properly managed and resilient
- Schema migrations are versioned and can be applied/rolled back
- Transactions maintain data integrity across operations
- Database operations are type-safe and efficient
- Connection pooling optimizes resource usage
- Seeding provides consistent test data

## Technical Implementation

### Architecture
- **Prisma Service**: Core service providing the Prisma client instance
- **Schema Definition**: Prisma schema defining database models and relations
- **Migration Scripts**: Versioned database schema changes
- **Seed Scripts**: Data seeding for development and testing

### Key Components

#### Prisma Service
- Provides a singleton Prisma client instance
- Manages database connection lifecycle
- Implements connection error handling and retry logic
- Exposes transaction methods for atomic operations

#### Prisma Schema
- Defines database models, fields, and relations
- Configures database indexes and constraints
- Maps database types to TypeScript types
- Defines enum types used throughout the application

### Integration Points
- **All Modules**: Used throughout the application for data access
- **Config Module**: Sources database connection configuration
- **Main Application**: Initializes database connection on startup

### Technologies & Packages
- Prisma ORM for database access
- PostgreSQL as the primary database
- TypeScript for type-safe database operations
- NestJS for dependency injection and lifecycle management

## Usage Examples

### Basic Data Access
```typescript
// Server-side example
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
```

### Using Transactions
```typescript
// Server-side example
async transferPoints(fromUserId: string, toUserId: string, points: number) {
  return this.prisma.$transaction(async (tx) => {
    // Deduct points from sender
    await tx.user.update({
      where: { id: fromUserId },
      data: { score: { decrement: points } },
    });
    
    // Add points to receiver
    await tx.user.update({
      where: { id: toUserId },
      data: { score: { increment: points } },
    });
    
    // Log the transaction
    await tx.pointsTransaction.create({
      data: {
        fromUserId,
        toUserId,
        points,
        createdAt: new Date(),
      },
    });
  });
}
```

### Running Migrations
```bash
# Command line example
npx prisma migrate dev --name add_user_status
```

## Performance Considerations
- Connection pooling is configured for optimal performance
- Indexes are defined on frequently queried fields
- Query complexity is monitored to prevent N+1 problems
- Batch operations are used when appropriate

## Security Considerations
- Database credentials are securely managed via environment variables
- Query parameters are always properly escaped through Prisma
- Database user has minimal required permissions
- Sensitive data fields can be excluded from default selections
