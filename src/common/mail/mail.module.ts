import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow<string>('MAIL_HOST'),
          port: configService.getOrThrow<number>('MAIL_PORT'),
          auth: {
            user: configService.getOrThrow<string>('MAIL_USER'),
            pass: configService.getOrThrow<string>('MAIL_PASSWORD')
          }
        },
        defaults: {
          from: `"${configService.getOrThrow<string>('MAIL_FROM_NAME', 'No Reply')}" <${configService.getOrThrow<string>('MAIL_FROM')}>`
        }
      })
    })
  ],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule { }
