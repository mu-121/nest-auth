import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationCode(email: string, code: string) {
    const mailOptions = {
      from: `"NestAuth Support" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Email Verification Code',
      text: `Your verification code is: ${code}`,
      html: `<b>Your verification code is: ${code}</b>`,
    };

    try {
      if (!this.configService.get<string>('SMTP_USER')) {
        console.warn('SMTP_USER is not configured. Email not sent, verification code:', code);
        return;
      }
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new InternalServerErrorException('Error sending verification email');
    }
  }
}
