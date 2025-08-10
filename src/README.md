# Who Am I? Game Platform

## Overview
The "Who Am I?" game platform is a modern, feature-rich multiplayer guessing game where players try to guess the identity of a character assigned to them by asking yes/no questions. This NestJS-based backend provides a comprehensive API for user management, game mechanics, social features, and content management.

## Core Modules

### 1. [Auth Module](./auth/README.md)
Authentication and authorization system with JWT support, role-based access control, and secure user management.

### 2. [Game Module](./game/README.md)
Core gameplay engine managing game sessions, turn-based mechanics, card distribution, and scoring.

### 3. [Rooms Module](./rooms/README.md)
Room management system for creating, joining, and managing game rooms with real-time updates.

### 4. [Friends Module](./friends/README.md)
Social features including friend requests, status tracking, and real-time presence management.

### 5. [Cards Module](./cards/README.md)
Card management system for the characters and personalities used in the game.

### 6. [Categories Module](./categories/README.md)
Category management for organizing cards into thematic groups.

## Infrastructure Modules

### 1. [Database Module](./database/README.md)
Prisma ORM integration for database access, migrations, and data management.

### 2. [Cache Module](./cache/README.md)
Redis-based caching system for performance optimization and real-time features.

### 3. [Common Module](./common/README.md)
Shared utilities, interfaces, and services used across the application.

### 4. [Config Module](./config/README.md)
Environment-specific configuration management with validation.

### 5. [Cloudinary Module](./cloudinary/README.md)
Cloud-based media management for storing and serving images.

### 6. [Uploads Module](./uploads/README.md)
File upload handling with validation and processing.

### 7. [Admin Module](./admin/README.md)
Administrative features for platform management and monitoring.

## Technical Architecture

### API Design
- RESTful API design with standardized endpoints
- Comprehensive Swagger documentation
- Consistent error handling and response formats
- Pagination support for all collection endpoints

### Security
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting and protection against common attacks

### Performance
- Redis caching for frequently accessed data
- Optimized database queries with Prisma
- Efficient WebSocket communication for real-time features
- CDN integration for media delivery

### Scalability
- Modular architecture for easy scaling
- Stateless design for horizontal scaling
- Efficient resource utilization
- Caching strategies to reduce database load

## Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL
- Redis
- Cloudinary account (for media storage)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npx prisma migrate dev`
5. Start the development server: `npm run start:dev`

### Development
- Run tests: `npm test`
- Generate API documentation: `npm run swagger`
- Format code: `npm run format`
- Lint code: `npm run lint`

## API Documentation
Once the server is running, access the Swagger documentation at:
`http://localhost:3000/api/docs`

## Deployment
The application is designed for easy deployment to various environments:
- Docker containers for consistent deployment
- Environment-specific configuration
- Health check endpoints for monitoring
- Graceful shutdown handling

## Contributing
Please refer to the contribution guidelines in the repository root for information on contributing to this project.
