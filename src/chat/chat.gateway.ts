import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsHmacGuard } from './ws-hmac.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './schemas/message.schema';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async handleConnection(client: any) {
    // Note: Guards don't run on handleConnection automatically in some Nest versions
    // If not using a dedicated auth packet, we might need manual check here or rely on the first message
    console.log(`👤 Client connecting: ${client.id}`);
  }

  handleDisconnect(client: any) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`👤 User ${userId} disconnected`);
        break;
      }
    }
  }

  @UseGuards(WsHmacGuard)
  @SubscribeMessage('identify')
  handleIdentify(@ConnectedSocket() client: any) {
    const userId = client.user._id.toString();
    this.connectedUsers.set(userId, client.id);
    console.log(`🆔 User ${userId} identified with socket ${client.id}`);
    return { status: 'ok', userId };
  }

  @UseGuards(WsHmacGuard)
  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { receiverId: string; content: string },
    @ConnectedSocket() client: any,
  ) {
    const senderId = client.user._id;
    const { receiverId, content } = data;

    // 1️⃣ Save to Database
    const newMessage = await this.messageModel.create({
      senderId,
      receiverId: new Types.ObjectId(receiverId),
      content,
    }) as any;

    // 2️⃣ Check if receiver is online
    const receiverSocketId = this.connectedUsers.get(receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('receive_message', {
        senderId,
        content,
        timestamp: newMessage.createdAt,
      });
    }

    return { status: 'sent', messageId: newMessage._id };
  }

  @UseGuards(WsHmacGuard)
  @SubscribeMessage('get_history')
  async handleGetHistory(
    @MessageBody() data: { otherUserId: string },
    @ConnectedSocket() client: any,
  ) {
    const userId = client.user._id;
    const otherUserId = new Types.ObjectId(data.otherUserId);

    const history = await this.messageModel
      .find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();

    return history;
  }
}
