# Who Am I - Game API

A comprehensive NestJS backend API for the "Who Am I" guessing game with real-time multiplayer support.

## Features

- **Authentication System**: JWT-based authentication with registration and login
- **Categories Management**: Organize cards by genres (actors, sports players, singers, etc.)
- **Smart Card System**: Random card retrieval with difficulty levels and hints
- **Room Management**: Create and join game rooms (2 players per room)
- **Real-time Gameplay**: WebSocket-powered live game sessions
- **Redis Caching**: High-performance caching for better user experience
- **Comprehensive API Documentation**: Auto-generated Swagger documentation
- **Database Management**: Prisma ORM with PostgreSQL (Neon) support

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Cache**: Redis (Upstash)
- **Authentication**: JWT + Passport
- **Real-time**: Socket.IO
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator + class-transformer

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd who-am-i
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URL="your-neon-postgresql-connection-string"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"
   
   # Redis
   REDIS_URL="your-upstash-redis-connection-string"
   
   # App
   PORT=3000
   NODE_ENV="development"
   CORS_ORIGIN="http://localhost:3000"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Seed the database with sample data
   npx prisma db seed
   ```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at:
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api/docs
- **WebSocket**: ws://localhost:3000/game

## API Documentation

### Authentication Endpoints
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/profile` - Get current user profile
- `POST /auth/refresh` - Refresh JWT token

### Categories Endpoints
- `GET /categories` - Get all categories
- `GET /categories/active` - Get active categories
- `GET /categories/:id` - Get category by ID
- `GET /categories/:id/stats` - Get category statistics
- `POST /categories` - Create new category (Admin)
- `PATCH /categories/:id` - Update category (Admin)
- `DELETE /categories/:id` - Delete category (Admin)

### Cards Endpoints
- `GET /cards` - Get all cards (paginated)
- `GET /cards/random` - **Get random cards for gameplay**
- `GET /cards/category/:categoryId` - Get cards by category
- `GET /cards/:id` - Get card by ID
- `POST /cards` - Create new card (Admin)
- `PATCH /cards/:id` - Update card (Admin)
- `DELETE /cards/:id` - Delete card (Admin)

### Rooms Endpoints
- `GET /rooms` - Get all rooms (paginated)
- `GET /rooms/available` - Get available rooms
- `GET /rooms/my-rooms` - Get current user's rooms
- `GET /rooms/:id` - Get room by ID
- `POST /rooms` - Create new room
- `POST /rooms/:id/join` - Join a room
- `POST /rooms/:id/start` - Start game (creator only)
- `DELETE /rooms/:id/leave` - Leave room

### Health Endpoints
- `GET /` - Health check
- `GET /status` - API status and statistics

## WebSocket Events

### Client to Server
- `joinRoom` - Join a game room
- `leaveRoom` - Leave a game room
- `startGame` - Start the game (room creator)
- `makeGuess` - Make a guess for the current card
- `requestHint` - Request a hint for the current card

### Server to Client
- `userJoined` - User joined the room
- `userLeft` - User left the room
- `gameStarted` - Game has started
- `newRound` - New round started
- `correctGuess` - Correct guess made
- `incorrectGuess` - Incorrect guess made
- `roundTimeout` - Round time expired
- `gameEnded` - Game finished
- `hintReceived` - Hint for current card
- `error` - Error message

## Game Flow

1. **User Registration/Login**: Players create accounts or log in
2. **Room Creation**: A player creates a game room with custom settings
3. **Room Joining**: Another player joins the room (2 players max)
4. **Game Start**: Room creator starts the game
5. **Gameplay**: Players take turns guessing cards with hints and time limits
6. **Scoring**: Points awarded for correct guesses
7. **Game End**: Final scores and winner announcement

## Key Features Implementation

### Random Card Retrieval
```typescript
// Get 5 random cards from specific categories with difficulty filter
GET /cards/random?count=5&categoryIds[]=category1&categoryIds[]=category2&minDifficulty=1&maxDifficulty=3
```

### Real-time Game Communication
```typescript
// WebSocket connection with JWT authentication
const socket = io('/game', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Caching Strategy
- **Categories**: 15-minute cache
- **Cards**: 10-minute cache
- **Random Cards**: 2-minute cache (for variety)
- **Rooms**: 5-minute cache
- **User Sessions**: 7-day cache

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Database Schema

### Core Models
- **User**: Player accounts with scores and levels
- **Category**: Game categories (actors, sports, etc.)
- **Card**: Individual game cards with hints and difficulty
- **Room**: Game rooms for 2 players
- **Game**: Game sessions with rounds and results
- **GameCard**: Cards used in specific games
- **GameResult**: Player results and scores

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
REDIS_URL="your-production-redis-url"
JWT_SECRET="your-production-jwt-secret"
CORS_ORIGIN="your-frontend-domain"
```

### Docker Support
```dockerfile
# Dockerfile included for containerized deployment
docker build -t who-am-i-api .
docker run -p 3000:3000 who-am-i-api
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Database powered by [Prisma](https://prisma.io/)
- Real-time communication via [Socket.IO](https://socket.io/)
- Documentation with [Swagger](https://swagger.io/)

---

**Demo User**: `demo@whoami.com` / `demo123`

For more information, visit the [API Documentation](http://localhost:3000/api/docs) when running locally.
