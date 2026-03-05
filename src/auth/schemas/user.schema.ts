import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ index: true })
  name: string;

  @Prop({ unique: true, index: true })
  email: string;

  @Prop()
  password: string;

  @Prop({ default: false, index: true })
  isVerified: boolean;

  @Prop({ type: String, default: null })
  verificationCode: string | null;

  @Prop({ type: String, default: null })
  resetPasswordCode: string | null;

  @Prop({ unique: true })
  apiKey: string;

  @Prop()
  apiSecret: string;
}

export const UserSchema = SchemaFactory.createForClass(User);