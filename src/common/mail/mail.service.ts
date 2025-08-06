import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '../../modules/users/schema/User.schema';

@Injectable()
export class MailService {
    constructor(
        private mailerService: MailerService
    ) { }

    async sendTestEmail() {
        await this.mailerService.sendMail({
            to: 'sakibullah582@gmail.com',
            subject: 'Test Mail From AuthTastic',
            text: '\n\nHi there, just checking if the mail service is working. \n thank you for checking the mail'
        })
    }

    async sendPasswordResetOTP(user: User, otp: string) {
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Your Password Reset OTP',
            text: `Hi ${user.email},\n\nYour One-Time Password (OTP) for resetting your password is: ${otp}\n\nThis OTP is valid for 10 minutes.\n`,
        })
    }

    async sendLoginOTP(user: User, otp: string) {
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Your Login OTP',
            text: `Hi ${user.email},\n\nYour One-Time Password (OTP) for logging in is: ${otp}\n\nThis OTP is valid for 5 minutes.\n`,
        });
    }
}
