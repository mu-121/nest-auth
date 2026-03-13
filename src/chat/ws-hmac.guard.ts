import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User } from '../auth/schemas/user.schema';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsHmacGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const headers = client.handshake.headers;
    const query = client.handshake.query;

    const apiKey = headers['x-api-key'] || query['x-api-key'];
    const timestamp = headers['x-timestamp'] || query['x-timestamp'];
    const signature = headers['x-signature'] || query['x-signature'];

    if (!apiKey || !timestamp || !signature) {
      throw new WsException('Missing HMAC credentials');
    }

    // 1️⃣ Validate Timestamp (within 5 minutes)
    const now = Date.now();
    const requestTime = new Date(timestamp).getTime();
    if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
      throw new WsException('Request expired or invalid timestamp');
    }

    // 2️⃣ Fetch User
    const user = await this.userModel.findOne({ apiKey });
    if (!user) {
      throw new WsException('Invalid API Key');
    }

    // 3️⃣ Verify Signature
    // For WS handshake, we might not have a full URL/Method in the same way as HTTP
    // but we can use a convention or just signature over the timestamp
    const message = `${timestamp}`; 
    const computedSignature = crypto
      .createHmac('sha256', user.apiSecret)
      .update(message)
      .digest('hex');

    if (computedSignature !== signature) {
      throw new WsException('Invalid HMAC signature');
    }

    // Attach user to client for further use
    client.user = user;

    return true;
  }
}
