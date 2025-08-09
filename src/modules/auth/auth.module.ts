import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenDenylistModule } from '../../common/token-denylist/token-denylist.module';
import { MailModule } from '../../common/mail/mail.module';
import { OtpModule } from '../otp/otp.module';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRATION_TIME');

        return {
          secret: secret || 'fallback-secret-for-development-only',
          signOptions: {
            expiresIn: expiresIn || '3600',
            jwtid: `${new Date().getTime()}`
          }
        };
      },
      inject: [ConfigService]
    }),
    TokenDenylistModule,
    MailModule,
    OtpModule
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy]
})
export class AuthModule { }
