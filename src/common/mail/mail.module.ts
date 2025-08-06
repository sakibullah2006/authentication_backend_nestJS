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
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD')
          }
        },
        defaults: {
          from: `"${configService.get<string>('MAIL_FROM_NAME', 'No Reply')}" <${configService.get<string>('MAIL_FROM')}>`
        }
      })
    })
  ],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule { }
