# Game Module

## Overview
The Game Module is the core gameplay engine for the "Who Am I?" game platform. It manages game sessions, rules enforcement, turn management, scoring, and real-time interactions between players. This module orchestrates the entire gameplay experience from start to finish.

## Features
- **Game Session Management**: Create, join, and manage game sessions
- **Turn-Based Gameplay**: Manage player turns and game flow
- **Card Selection & Distribution**: Select and distribute cards to players
- **Guessing Mechanics**: Process and validate player guesses
- **Scoring System**: Calculate and update player scores
- **Real-time Updates**: Provide real-time game state updates to players
- **Game History**: Track and store game results and statistics

## Acceptance Criteria
- Game sessions can be created and joined by players
- Cards are properly selected and distributed based on game settings
- Turn management correctly alternates between players
- Guessing mechanics accurately validate player inputs
- Scoring system correctly awards points based on game rules
- Real-time updates are delivered to all players in a game session
- Game results are properly recorded and statistics updated
- Game state is preserved in case of disconnections

## Technical Implementation

### Architecture
- **Gateway**: WebSocket gateway for real-time game communication
- **Service**: Contains game business logic and state management
- **Events**: Define game events for real-time updates
- **Handlers**: Process incoming game commands from players

### Game State Management
- **Game Session**: Represents an active game between players
  - Fields: `id`, `roomId`, `players`, `currentTurn`, `cards`, `status`, `startedAt`, `endedAt`
  - Status values: `WAITING`, `PLAYING`, `COMPLETED`, `ABANDONED`

### Caching Strategy
- Redis is used to cache:
  - Active game sessions for quick access
  - Player states within games
  - Game events for real-time updates
- Game state is persisted to database at critical points

### Integration Points
- **Rooms Module**: Integrates with rooms for game session creation
- **Cards Module**: Sources cards for gameplay
- **Users Module**: Updates user statistics based on game results
- **Friends Module**: Updates friend status during gameplay
- **Socket Gateway**: Manages real-time communication
- **Redis Service**: Handles game state caching

### Technologies & Packages
- NestJS for API framework
- Socket.IO for real-time communication
- Redis for game state management
- Prisma ORM for database operations
- RxJS for reactive event handling

## Game Flow

### Game Initialization
1. Player creates or joins a room
2. When room is full, game is initialized
3. Cards are selected and distributed
4. Initial player turn is determined

### Turn Execution
1. Active player receives turn notification
2. Player asks a question or makes a guess
3. System validates the input
4. Other player responds or system validates guess
5. Turn results are processed and broadcast
6. Turn advances to next player

### Game Completion
1. Player makes correct final guess or turns are exhausted
2. Final scores are calculated
3. Game results are recorded
4. Player statistics are updated
5. Players are returned to room state

## Usage Examples

### Handling Player Connection
```typescript
// Server-side example
@WebSocketGateway()
export class GameGateway {
  @SubscribeMessage('joinGame')
  handleJoinGame(client: Socket, payload: { gameId: string }): void {
    // Process player joining game
  }
}
```

### Processing a Player Guess
```typescript
// Server-side example
async processGuess(gameId: string, playerId: string, guess: string): Promise<GuessResult> {
  const game = await this.getGameSession(gameId);
  // Validate guess against card
  // Update game state
  // Return result
}
```

## Performance Considerations
- Game state is primarily managed in Redis for low-latency access
- WebSocket connections use heartbeats to detect disconnections
- Long-running games are periodically persisted to database
- Event-driven architecture minimizes blocking operations

## Security Considerations
- Players can only interact with games they are participating in
- Input validation prevents game state manipulation
- Rate limiting prevents spam actions
- Game actions are authenticated via socket authentication
- Sensitive game data (like opponent's card) is properly hidden
