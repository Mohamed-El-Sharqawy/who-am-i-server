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
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { FriendsService } from './friends.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/friends',
})
export class FriendsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FriendsGateway.name);
  private userSockets = new Map<string, string>(); // userId -> socketId
  private socketUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private redisService: RedisService,
    private friendsService: FriendsService,
  ) {
    // Set up interval to check for status updates
    setInterval(() => this.checkStatusUpdates(), 5000); // Check every 5 seconds
  }

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

      // Store socket mapping
      this.userSockets.set(user.id, client.id);
      this.socketUsers.set(client.id, user.id);

      this.logger.log(`User ${user.username} connected to friends gateway`);
      
      // Update user presence status to ONLINE
      await this.updateUserStatus(user.id, 'ONLINE');
      
      // Notify friends about status change
      await this.notifyFriendsAboutStatusChange(user.id, 'ONLINE');

    } catch (error) {
      this.logger.error('Authentication failed:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`User ${client.username} disconnected from friends gateway`);
      
      // Update user presence status to OFFLINE
      await this.updateUserStatus(client.userId, 'OFFLINE');
      
      // Notify friends about status change
      await this.notifyFriendsAboutStatusChange(client.userId, 'OFFLINE');
      
      // Clean up maps
      this.userSockets.delete(client.userId);
      this.socketUsers.delete(client.id);
    }
  }

  @SubscribeMessage('getFriendsList')
  async handleGetFriendsList(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;
    
    try {
      const friends = await this.friendsService.getFriends(client.userId);
      client.emit('friendsList', friends);
    } catch (error) {
      this.logger.error('Error getting friends list:', error);
      client.emit('error', { message: 'Failed to get friends list' });
    }
  }

  @SubscribeMessage('getPendingRequests')
  async handleGetPendingRequests(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;
    
    try {
      const pendingRequests = await this.friendsService.getPendingRequests(client.userId);
      client.emit('pendingRequests', pendingRequests);
    } catch (error) {
      this.logger.error('Error getting pending requests:', error);
      client.emit('error', { message: 'Failed to get pending requests' });
    }
  }

  @SubscribeMessage('sendFriendRequest')
  async handleSendFriendRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { username: string },
  ) {
    if (!client.userId) return;
    
    try {
      const request = await this.friendsService.sendFriendRequest(client.userId, data.username);
      
      // Notify the receiver if they are online
      const receiverSocketId = this.userSockets.get(request.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('newFriendRequest', {
          id: request.id,
          sender: {
            id: client.userId,
            username: client.username,
          },
        });
      }
      
      client.emit('friendRequestSent', { success: true });
    } catch (error) {
      this.logger.error('Error sending friend request:', error);
      client.emit('error', { message: error.message || 'Failed to send friend request' });
    }
  }

  @SubscribeMessage('acceptFriendRequest')
  async handleAcceptFriendRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    if (!client.userId) return;
    
    try {
      const friendship = await this.friendsService.acceptFriendRequest(client.userId, data.requestId);
      
      // Notify the sender if they are online
      const senderSocketId = this.userSockets.get(friendship.senderId);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('friendRequestAccepted', {
          id: friendship.id,
          user: {
            id: client.userId,
            username: client.username,
          },
        });
      }
      
      client.emit('friendRequestAccepted', { success: true });
    } catch (error) {
      this.logger.error('Error accepting friend request:', error);
      client.emit('error', { message: error.message || 'Failed to accept friend request' });
    }
  }

  @SubscribeMessage('rejectFriendRequest')
  async handleRejectFriendRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    if (!client.userId) return;
    
    try {
      await this.friendsService.rejectFriendRequest(client.userId, data.requestId);
      client.emit('friendRequestRejected', { success: true });
    } catch (error) {
      this.logger.error('Error rejecting friend request:', error);
      client.emit('error', { message: error.message || 'Failed to reject friend request' });
    }
  }

  @SubscribeMessage('removeFriend')
  async handleRemoveFriend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { friendId: string },
  ) {
    if (!client.userId) return;
    
    try {
      await this.friendsService.removeFriend(client.userId, data.friendId);
      
      // Notify the removed friend if they are online
      const friendSocketId = this.userSockets.get(data.friendId);
      if (friendSocketId) {
        this.server.to(friendSocketId).emit('friendRemoved', {
          userId: client.userId,
        });
      }
      
      client.emit('friendRemoved', { success: true });
    } catch (error) {
      this.logger.error('Error removing friend:', error);
      client.emit('error', { message: error.message || 'Failed to remove friend' });
    }
  }

  /**
   * Update user status in Redis and database
   */
  private async updateUserStatus(userId: string, status: 'ONLINE' | 'OFFLINE' | 'IN_GAME') {
    try {
      // Update in Redis for quick access
      await this.redisService.setObject(
        `user_presence:${userId}`,
        { status, lastSeen: new Date() },
        60 * 60 * 24 // 24 hours
      );
      
      // Update in database for persistence
      await this.prisma.userPresence.upsert({
        where: { userId },
        update: { status, lastSeen: new Date() },
        create: { userId, status, lastSeen: new Date() },
      });
    } catch (error) {
      this.logger.error(`Error updating user status for ${userId}:`, error);
    }
  }

  /**
   * Notify friends about user status change
   */
  private async notifyFriendsAboutStatusChange(userId: string, status: 'ONLINE' | 'OFFLINE' | 'IN_GAME') {
    try {
      const friends = await this.friendsService.getFriends(userId);
      
      for (const friend of friends.data) {
        const friendSocketId = this.userSockets.get(friend.id);
        if (friendSocketId) {
          this.server.to(friendSocketId).emit('friendStatusChanged', {
            userId,
            status,
            lastSeen: new Date(),
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error notifying friends about status change for ${userId}:`, error);
    }
  }

  /**
   * Set user status to IN_GAME
   * This method can be called from the GameGateway when a user joins a game
   */
  async setUserInGame(userId: string) {
    await this.updateUserStatus(userId, 'IN_GAME');
    await this.notifyFriendsAboutStatusChange(userId, 'IN_GAME');
  }

  /**
   * Set user status back to ONLINE
   * This method can be called from the GameGateway when a user leaves a game
   */
  async setUserOnline(userId: string) {
    await this.updateUserStatus(userId, 'ONLINE');
    await this.notifyFriendsAboutStatusChange(userId, 'ONLINE');
  }

  /**
   * Check for status updates in Redis and notify connected clients
   * This method is called periodically to process status updates
   * that were stored by the FriendsService
   */
  private async checkStatusUpdates() {
    try {
      // Get all connected socket users
      const connectedUsers = Array.from(this.socketUsers.values());
      
      for (const userId of connectedUsers) {
        // Get all status updates for this user
        const keys = await this.redisService.getClient().keys(`status_update:${userId}:*`);
        
        if (keys && keys.length > 0) {
          for (const key of keys) {
            // Get the status update
            const statusUpdate = await this.redisService.getObject(key);
            
            if (statusUpdate) {
              // Get the socket ID for this user
              const socketId = this.userSockets.get(userId);
              
              if (socketId) {
                // Emit the status update to the user
                this.server.to(socketId).emit('friendStatusChanged', statusUpdate);
              }
              
              // Delete the status update from Redis
              await this.redisService.del(key);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking status updates:', error);
    }
  }
}
