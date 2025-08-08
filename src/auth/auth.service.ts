import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password, avatar } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        avatar,
        role: Role.USER, // Default role is USER
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        score: true,
        level: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    // Cache user session
    await this.redisService.setObject(
      `user_session:${user.id}`,
      { userId: user.id, username: user.username, role: user.role },
      60 * 60 * 24 * 7, // 7 days
    );

    return {
      access_token,
      user: {
        ...user,
        avatar: user.avatar || undefined,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { identifier, password } = loginDto;

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    // Cache user session
    await this.redisService.setObject(
      `user_session:${user.id}`,
      { userId: user.id, username: user.username, role: user.role },
      60 * 60 * 24 * 7, // 7 days
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: {
        ...userWithoutPassword,
        avatar: userWithoutPassword.avatar || undefined,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    // Remove user session from cache
    await this.redisService.del(`user_session:${userId}`);
  }

  async validateUser(userId: string): Promise<any> {
    // Check cache first
    const cachedUser = await this.redisService.getObject(`user_session:${userId}`);
    if (cachedUser) {
      return this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          score: true,
          level: true,
          role: true,
          createdAt: true,
        },
      });
    }

    return null;
  }

  async refreshToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
