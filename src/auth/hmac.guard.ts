import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User } from './schemas/user.schema';

@Injectable()
export class HmacGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    const apiKey = headers['x-api-key'];
    const timestamp = headers['x-timestamp'];
    const signature = headers['x-signature'];

    if (!apiKey || !timestamp || !signature) {
      throw new UnauthorizedException('Missing HMAC headers');
    }

    // 1️⃣ Validate Timestamp (within 5 minutes)
    const now = Date.now();
    const requestTime = new Date(timestamp).getTime();
    if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
      throw new UnauthorizedException('Request expired or invalid timestamp');
    }

    // 2️⃣ Fetch User
    const user = await this.userModel.findOne({ apiKey });
    if (!user) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // 3️⃣ Verify Signature
    const method = request.method;
    const url = request.url;
    const body = request.body && Object.keys(request.body).length > 0
      ? JSON.stringify(request.body)
      : '';

    const message = `${timestamp}${method}${url}${body}`;
    const computedSignature = crypto
      .createHmac('sha256', user.apiSecret)
      .update(message)
      .digest('hex');

    if (computedSignature !== signature) {
      throw new UnauthorizedException('Invalid HMAC signature');
    }

    // Attach user to request for further use
    request.user = user;

    return true;
  }
}
