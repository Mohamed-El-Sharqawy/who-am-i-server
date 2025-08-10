import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  /**
   * Send a friend request to another user
   */
  async sendFriendRequest(senderId: string, receiverUsername: string) {
    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { username: receiverUsername },
      select: { id: true, username: true },
    });

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Prevent sending friend request to self
    if (senderId === receiver.id) {
      throw new ForbiddenException('Cannot send friend request to yourself');
    }

    // Check if friend request already exists
    const existingRequest = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        throw new ConflictException('Friend request already sent');
      } else if (existingRequest.status === 'ACCEPTED') {
        throw new ConflictException('Already friends with this user');
      } else if (existingRequest.status === 'BLOCKED') {
        throw new ForbiddenException('Cannot send friend request to this user');
      }
    }

    // Create friend request
    const friendRequest = await this.prisma.friend.create({
      data: {
        senderId,
        receiverId: receiver.id,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return friendRequest;
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(userId: string, requestId: string) {
    const friendRequest = await this.prisma.friend.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendRequest.receiverId !== userId) {
      throw new ForbiddenException('Cannot accept a friend request that was not sent to you');
    }

    if (friendRequest.status !== 'PENDING') {
      throw new ConflictException('Friend request is not pending');
    }

    const updatedFriendship = await this.prisma.friend.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return updatedFriendship;
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(userId: string, requestId: string) {
    const friendRequest = await this.prisma.friend.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendRequest.receiverId !== userId) {
      throw new ForbiddenException('Cannot reject a friend request that was not sent to you');
    }

    if (friendRequest.status !== 'PENDING') {
      throw new ConflictException('Friend request is not pending');
    }

    await this.prisma.friend.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return { success: true };
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
        status: 'ACCEPTED',
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.prisma.friend.delete({
      where: { id: friendship.id },
    });

    return { success: true };
  }

  /**
   * Block a user
   */
  async blockUser(userId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if there's an existing relationship
    const existingRelationship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: userId },
        ],
      },
    });

    if (existingRelationship) {
      // Update existing relationship to blocked
      await this.prisma.friend.update({
        where: { id: existingRelationship.id },
        data: { 
          status: 'BLOCKED',
          // Ensure the blocker is always the sender
          senderId: userId,
          receiverId: targetUser.id,
        },
      });
    } else {
      // Create new blocked relationship
      await this.prisma.friend.create({
        data: {
          senderId: userId,
          receiverId: targetUser.id,
          status: 'BLOCKED',
        },
      });
    }

    return { success: true };
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const blockedRelationship = await this.prisma.friend.findFirst({
      where: {
        senderId: userId,
        receiverId: targetUser.id,
        status: 'BLOCKED',
      },
    });

    if (!blockedRelationship) {
      throw new NotFoundException('User is not blocked');
    }

    await this.prisma.friend.delete({
      where: { id: blockedRelationship.id },
    });

    return { success: true };
  }

  /**
   * Get all friends of a user
   */
  async getFriends(userId: string) {
    const friends = await this.prisma.friend.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
        status: 'ACCEPTED',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Transform the data to return a clean list of friends
    return friends.map(friendship => {
      const friend = friendship.senderId === userId 
        ? friendship.receiver 
        : friendship.sender;
      
      // Get online status from Redis
      const onlineStatus = this.redisService.getObject(`user_presence:${friend.id}`);
      
      return {
        ...friend,
        friendshipId: friendship.id,
        status: onlineStatus || { status: 'OFFLINE' },
      };
    });
  }

  /**
   * Get pending friend requests for a user
   */
  async getPendingRequests(userId: string) {
    const pendingRequests = await this.prisma.friend.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return pendingRequests;
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string) {
    const blockedUsers = await this.prisma.friend.findMany({
      where: {
        senderId: userId,
        status: 'BLOCKED',
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return blockedUsers.map(block => block.receiver);
  }

  /**
   * Check if a user is blocked by another user
   */
  async isBlocked(userId: string, targetId: string) {
    const blocked = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetId, status: 'BLOCKED' },
          { senderId: targetId, receiverId: userId, status: 'BLOCKED' },
        ],
      },
    });

    return !!blocked;
  }
  
  /**
   * Set user status to IN_GAME
   */
  async setUserInGame(userId: string) {
    try {
      // Update in Redis for quick access
      await this.redisService.setObject(
        `user_presence:${userId}`,
        { status: 'IN_GAME', lastSeen: new Date() },
        60 * 60 * 24 // 24 hours
      );
      
      // Update in database for persistence
      await this.prisma.userPresence.upsert({
        where: { userId },
        update: { status: 'IN_GAME', lastSeen: new Date() },
        create: { userId, status: 'IN_GAME', lastSeen: new Date() },
      });
      
      // Notify friends about status change
      await this.notifyFriendsAboutStatusChange(userId, 'IN_GAME');
    } catch (error) {
      this.logger.error(`Error updating user status for ${userId}:`, error);
    }
  }
  
  /**
   * Set user status back to ONLINE
   */
  async setUserOnline(userId: string) {
    try {
      // Update in Redis for quick access
      await this.redisService.setObject(
        `user_presence:${userId}`,
        { status: 'ONLINE', lastSeen: new Date() },
        60 * 60 * 24 // 24 hours
      );
      
      // Update in database for persistence
      await this.prisma.userPresence.upsert({
        where: { userId },
        update: { status: 'ONLINE', lastSeen: new Date() },
        create: { userId, status: 'ONLINE', lastSeen: new Date() },
      });
      
      // Notify friends about status change
      await this.notifyFriendsAboutStatusChange(userId, 'ONLINE');
    } catch (error) {
      this.logger.error(`Error updating user status for ${userId}:`, error);
    }
  }
  
  /**
   * Notify friends about user status change
   */
  private async notifyFriendsAboutStatusChange(userId: string, status: 'ONLINE' | 'OFFLINE' | 'IN_GAME') {
    try {
      const friends = await this.getFriends(userId);
      
      // For each friend, check if they have an active socket connection
      for (const friend of friends) {
        try {
          // Get the friend's socket ID from Redis
          const connection = await this.redisService.getObject(`user_socket:${friend.id}`);
          
          if (connection && typeof connection === 'object' && 'socketId' in connection) {
            // Emit event to the friend's socket
            // Note: We don't have direct access to the socket server here
            // This will be handled by the gateway that has access to the server
            this.logger.debug(`Notifying friend ${friend.id} about status change for ${userId} to ${status}`);
            
            // Store the status update in Redis for the gateway to pick up
            await this.redisService.setObject(
              `status_update:${friend.id}:${userId}`,
              {
                userId,
                status,
                lastSeen: new Date(),
              },
              60 // expire in 60 seconds if not picked up
            );
          }
        } catch (err) {
          this.logger.error(`Error notifying friend ${friend.id} about status change:`, err);
        }
      }
    } catch (error) {
      this.logger.error(`Error notifying friends about status change for ${userId}:`, error);
    }
  }
}
