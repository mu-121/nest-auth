import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserSchema } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from './email.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private emailService: EmailService,
    private redisService: RedisService,
  ) {}

  async register(body: RegisterDto) {
    // 1️⃣ Check if email already exists
    const existingUser = await this.userModel.findOne({ email: body.email });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // 2️⃣ Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // 3️⃣ Generate API Key and Secret
    const apiKey = crypto.randomBytes(16).toString('hex');
    const apiSecret = crypto.randomBytes(32).toString('hex');

    // 4️⃣ Generate Verification Code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 5️⃣ Create the new user
    const user = await this.userModel.create({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      apiKey,
      apiSecret,
      verificationCode,
      isVerified: false,
    });

    // 6️⃣ Send Verification Email
    await this.emailService.sendVerificationCode(user.email, verificationCode);

    return {
      message: 'User registered successfully. Please check your email for the verification code.',
      email: user.email,
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    return { message: 'Email verified successfully', apiKey: user.apiKey, apiSecret: user.apiSecret };
  }

  async resendVerificationCode(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    await user.save();

    await this.emailService.sendVerificationCode(user.email, verificationCode);

    return { message: 'Verification code resent successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    await user.save();

    await this.emailService.sendVerificationCode(user.email, resetCode);

    return { message: 'Password reset code sent to your email.' };
  }

  async verifyResetCode(email: string, code: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    return { message: 'Reset code verified successfully' };
  }

  async resetPassword(body: any) {
    const { email, code, newPassword, confirmPassword } = body;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordCode = null;
    await user.save();

    return { message: 'Password updated successfully' };
  }

  // 🔹 LOGIN API
  async login(body: LoginDto) {
    const user = await this.userModel.findOne({ email: body.email });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email before logging in');
    }

    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        apiKey: user.apiKey,
        apiSecret: user.apiSecret,
      },
    };
  }

  async getUsers() {
    // 1️⃣ Try to get users from Redis first
    const cachedUsers = await this.redisService.client.get('all_users');
    if (cachedUsers) {
      this.logger.log('Fetching users from Redis cache');
      return JSON.parse(cachedUsers);
    }

    // 2️⃣ If not in cache, fetch from MongoDB
    this.logger.log('Fetching users from Database');
    const users = await this.userModel.find();

    if (users.length === 0) {
      throw new UnauthorizedException('No users found');
    }

    // 3️⃣ Store result in Redis for future requests (cache for 1 hour)
    await this.redisService.client.set('all_users', JSON.stringify(users), { EX: 3600 });

    return users;
  }

}