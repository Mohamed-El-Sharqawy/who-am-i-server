import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post()
  async sendFriendRequest(@Request() req, @Body() sendFriendRequestDto: SendFriendRequestDto) {
    return this.friendsService.sendFriendRequest(req.user.id, sendFriendRequestDto.username);
  }

  @Post(':requestId/accept')
  async acceptFriendRequest(@Request() req, @Param('requestId') requestId: string) {
    return this.friendsService.acceptFriendRequest(req.user.id, requestId);
  }

  @Post(':requestId/reject')
  async rejectFriendRequest(@Request() req, @Param('requestId') requestId: string) {
    return this.friendsService.rejectFriendRequest(req.user.id, requestId);
  }

  @Delete(':friendId')
  async removeFriend(@Request() req, @Param('friendId') friendId: string) {
    return this.friendsService.removeFriend(req.user.id, friendId);
  }

  @Post('block')
  async blockUser(@Request() req, @Body() body: { username: string }) {
    return this.friendsService.blockUser(req.user.id, body.username);
  }

  @Post('unblock')
  async unblockUser(@Request() req, @Body() body: { username: string }) {
    return this.friendsService.unblockUser(req.user.id, body.username);
  }

  @Get()
  async getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.id);
  }

  @Get('pending')
  async getPendingRequests(@Request() req) {
    return this.friendsService.getPendingRequests(req.user.id);
  }

  @Get('blocked')
  async getBlockedUsers(@Request() req) {
    return this.friendsService.getBlockedUsers(req.user.id);
  }
}
