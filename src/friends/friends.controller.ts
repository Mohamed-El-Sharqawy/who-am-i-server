import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiTags('friends')
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
  @ApiOperation({ summary: 'Get all friends' })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of friends' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getFriends(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<any>> {
    return this.friendsService.getFriends(req.user.id, page ? +page : 1, limit ? +limit : 10);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending friend requests' })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of pending friend requests' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getPendingRequests(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<any>> {
    return this.friendsService.getPendingRequests(req.user.id, page ? +page : 1, limit ? +limit : 10);
  }

  @Get('blocked')
  @ApiOperation({ summary: 'Get blocked users' })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of blocked users' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getBlockedUsers(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<any>> {
    return this.friendsService.getBlockedUsers(req.user.id, page ? +page : 1, limit ? +limit : 10);
  }
}
