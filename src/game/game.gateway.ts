import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CardsService } from '../cards/cards.service';
import { FriendsService } from '../friends/friends.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  currentRoomId?: string;
}

interface GameState {
  roomId: string;
  currentRound: number;
  maxRounds: number;
  timePerRound: number;
  currentCard?: any;
  roundStartTime?: number;
  scores: Record<string, number>;
  isActive: boolean;
  currentGuesser?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private gameStates = new Map<string, GameState>();
  private roomTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private redisService: RedisService,
    private cardsService: CardsService,
    private friendsService: FriendsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.username = user.username;

      this.logger.log(`User ${user.username} connected`);
      
      // Cache user connection
      await this.redisService.setObject(`game_connection:${user.id}`, {
        socketId: client.id,
        username: user.username,
        connectedAt: new Date(),
      }, 60 * 60); // 1 hour

    } catch (error) {
      this.logger.error('Authentication failed:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`User ${client.username} disconnected`);
      
      // Remove from cache
      await this.redisService.del(`game_connection:${client.userId}`);
      
      // Leave current room if any
      if (client.currentRoomId) {
        await this.handleLeaveRoom(client);
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const { roomId } = data;

      // Verify room exists and user has access
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: {
          creator: { select: { id: true, username: true } },
          guest: { select: { id: true, username: true } },
        },
      });

      if (!room) {
        client.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.creatorId !== client.userId && room.guestId !== client.userId) {
        client.emit('error', { message: 'Access denied' });
        return;
      }

      // Leave previous room if any
      if (client.currentRoomId) {
        client.leave(client.currentRoomId);
      }

      // Join new room
      client.join(roomId);
      client.currentRoomId = roomId;

      // Notify room members
      this.server.to(roomId).emit('userJoined', {
        userId: client.userId,
        username: client.username,
      });
      
      // Update user status to IN_GAME
      if (client.userId) {
        await this.friendsService.setUserInGame(client.userId);
      }

      // Send current game state if exists
      const gameState = this.gameStates.get(roomId);
      if (gameState) {
        client.emit('gameState', gameState);
      }

      client.emit('joinedRoom', { roomId, room });

    } catch (error) {
      this.logger.error('Error joining room:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;

    const roomId = client.currentRoomId;
    if (!roomId) return;

    // Leave room
    client.leave(roomId);
    client.currentRoomId = undefined;

    // Notify room members
    this.server.to(roomId).emit('userLeft', {
      userId: client.userId,
      username: client.username,
    });
    
    // Update user status back to ONLINE
    if (client.userId) {
      await this.friendsService.setUserOnline(client.userId);
    }

    client.emit('leftRoom', { roomId });
  }

  @SubscribeMessage('startGame')
  async handleStartGame(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const { roomId } = data;

      // Verify user is room creator
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: {
          creator: { select: { id: true, username: true } },
          guest: { select: { id: true, username: true } },
        },
      });

      if (!room || room.creatorId !== client.userId) {
        client.emit('error', { message: 'Only room creator can start the game' });
        return;
      }

      if (!room.guest) {
        client.emit('error', { message: 'Need 2 players to start the game' });
        return;
      }

      // Create game in database
      const game = await this.prisma.game.create({
        data: {
          roomId,
          maxRounds: (room.settings as any)?.maxRounds || 5,
          timePerRound: (room.settings as any)?.timePerRound || 60,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Initialize game state
      const gameState: GameState = {
        roomId,
        currentRound: 1,
        maxRounds: game.maxRounds,
        timePerRound: game.timePerRound,
        scores: {
          [room.creatorId]: 0,
          [room.guestId!]: 0,
        },
        isActive: true,
        currentGuesser: room.creatorId, // Creator starts as guesser
      };

      this.gameStates.set(roomId, gameState);

      // Update room status
      await this.prisma.room.update({
        where: { id: roomId },
        data: { status: 'PLAYING' },
      });

      // Start first round
      await this.startNewRound(roomId, game.id);

      // Notify all players
      this.server.to(roomId).emit('gameStarted', {
        gameId: game.id,
        gameState,
      });

    } catch (error) {
      this.logger.error('Error starting game:', error);
      client.emit('error', { message: 'Failed to start game' });
    }
  }

  @SubscribeMessage('makeGuess')
  async handleMakeGuess(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; guess: string },
  ) {
    try {
      const { roomId, guess } = data;
      const gameState = this.gameStates.get(roomId);

      if (!gameState || !gameState.isActive) {
        client.emit('error', { message: 'No active game' });
        return;
      }

      if (gameState.currentGuesser !== client.userId) {
        client.emit('error', { message: 'Not your turn to guess' });
        return;
      }

      if (!gameState.currentCard) {
        client.emit('error', { message: 'No card to guess' });
        return;
      }

      // Check if guess is correct (case-insensitive)
      const isCorrect = gameState.currentCard.name.toLowerCase() === guess.toLowerCase();

      if (isCorrect) {
        // Award points
        if (client.userId) {
          gameState.scores[client.userId] += 10;
        }

        // Update game card as guessed
        await this.prisma.gameCard.updateMany({
          where: {
            gameId: gameState.roomId,
            round: gameState.currentRound,
          },
          data: {
            isGuessed: true,
            guessedBy: client.userId,
          },
        });

        // Notify all players
        this.server.to(roomId).emit('correctGuess', {
          guesser: client.username,
          card: gameState.currentCard,
          scores: gameState.scores,
        });

        // Move to next round or end game
        if (gameState.currentRound >= gameState.maxRounds) {
          await this.endGame(roomId);
        } else {
          setTimeout(() => this.startNewRound(roomId), 3000); // 3 second delay
        }
      } else {
        // Notify incorrect guess
        this.server.to(roomId).emit('incorrectGuess', {
          guesser: client.username,
          guess,
        });
      }

    } catch (error) {
      this.logger.error('Error making guess:', error);
      client.emit('error', { message: 'Failed to make guess' });
    }
  }

  @SubscribeMessage('requestHint')
  async handleRequestHint(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const gameState = this.gameStates.get(roomId);

    if (!gameState || !gameState.currentCard) {
      client.emit('error', { message: 'No active card' });
      return;
    }

    if (gameState.currentGuesser !== client.userId) {
      client.emit('error', { message: 'Not your turn' });
      return;
    }

    // Send a random hint
    const hints = gameState.currentCard.hints;
    const randomHint = hints[Math.floor(Math.random() * hints.length)];

    client.emit('hintReceived', { hint: randomHint });
  }

  private async startNewRound(roomId: string, gameId?: string) {
    try {
      const gameState = this.gameStates.get(roomId);
      if (!gameState) return;

      // Clear previous timer
      if (this.roomTimers.has(roomId)) {
        clearTimeout(this.roomTimers.get(roomId));
      }

      // Get room settings
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room) return;

      const settings = room.settings as any;

      // Get random card
      const cards = await this.cardsService.getRandomCards({
        count: 1,
        categoryIds: settings?.categoryIds,
        minDifficulty: settings?.difficulty?.min,
        maxDifficulty: settings?.difficulty?.max,
      });

      if (cards.length === 0) {
        this.server.to(roomId).emit('error', { message: 'No cards available' });
        return;
      }

      const card = cards[0];
      gameState.currentCard = card;
      gameState.roundStartTime = Date.now();

      // Switch guesser (alternate between players)
      const room_data = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: { creatorId: true, guestId: true },
      });

      if (room_data && room_data.guestId) {
        gameState.currentGuesser = gameState.currentGuesser === room_data.creatorId 
          ? room_data.guestId 
          : room_data.creatorId;
      }

      // Save game card to database
      if (gameId) {
        await this.prisma.gameCard.create({
          data: {
            gameId,
            cardId: card.id,
            round: gameState.currentRound,
          },
        });
      }

      // Notify all players about new round
      this.server.to(roomId).emit('newRound', {
        round: gameState.currentRound,
        card: {
          id: card.id,
          name: card.name, // Only send to non-guesser
          imageUrl: card.imageUrl,
          difficulty: card.difficulty,
          category: card.category,
        },
        currentGuesser: gameState.currentGuesser,
        timeLimit: gameState.timePerRound,
      });

      // Set round timer
      const timer = setTimeout(() => {
        this.handleRoundTimeout(roomId);
      }, gameState.timePerRound * 1000);

      this.roomTimers.set(roomId, timer);

    } catch (error) {
      this.logger.error('Error starting new round:', error);
    }
  }

  private async handleRoundTimeout(roomId: string) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState) return;

    // Notify timeout
    this.server.to(roomId).emit('roundTimeout', {
      round: gameState.currentRound,
      correctAnswer: gameState.currentCard?.name,
    });

    // Move to next round or end game
    gameState.currentRound++;
    
    if (gameState.currentRound > gameState.maxRounds) {
      await this.endGame(roomId);
    } else {
      setTimeout(() => this.startNewRound(roomId), 3000); // 3 second delay
    }
  }

  private async endGame(roomId: string) {
    try {
      const gameState = this.gameStates.get(roomId);
      if (!gameState) return;

      gameState.isActive = false;

      // Clear timer
      if (this.roomTimers.has(roomId)) {
        clearTimeout(this.roomTimers.get(roomId));
        this.roomTimers.delete(roomId);
      }

      // Update game in database
      const game = await this.prisma.game.findFirst({
        where: { roomId },
        orderBy: { createdAt: 'desc' },
      });

      if (game) {
        await this.prisma.game.update({
          where: { id: game.id },
          data: {
            status: 'FINISHED',
            endedAt: new Date(),
          },
        });

        // Save game results
        const playerIds = Object.keys(gameState.scores);
        const sortedPlayers = playerIds.sort((a, b) => gameState.scores[b] - gameState.scores[a]);

        for (let i = 0; i < sortedPlayers.length; i++) {
          const playerId = sortedPlayers[i];
          await this.prisma.gameResult.create({
            data: {
              gameId: game.id,
              userId: playerId,
              score: gameState.scores[playerId],
              position: i + 1,
              correctGuesses: Math.floor(gameState.scores[playerId] / 10), // 10 points per correct guess
              totalRounds: gameState.maxRounds,
            },
          });
        }
      }

      // Update room status
      await this.prisma.room.update({
        where: { id: roomId },
        data: { status: 'FINISHED' },
      });

      // Notify all players
      this.server.to(roomId).emit('gameEnded', {
        finalScores: gameState.scores,
        winner: Object.keys(gameState.scores).reduce((a, b) => 
          gameState.scores[a] > gameState.scores[b] ? a : b
        ),
      });

      // Clean up
      this.gameStates.delete(roomId);

    } catch (error) {
      this.logger.error('Error ending game:', error);
    }
  }
}
