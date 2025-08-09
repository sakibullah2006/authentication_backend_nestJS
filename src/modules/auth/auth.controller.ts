import { Body, Controller, Get, Post, Request, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/CreateUser.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from './decorators/decorator.currentUser';
import { Response } from 'express';
import { User } from '../users/schema/User.schema';
import { ConfigService } from '@nestjs/config';
import { parseExpirationToMilliseconds } from '../../common/lib/time.utility';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) { }


    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto) {
        return this.authService.signUp(createUserDto);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@
        Body() loginDto: LoginDto,
        @CurrentUser() user: User,
        @Res({ passthrough: true }) response: Response
    ) {
        const { access_token, refresh_token } = await this.authService.login(user)
        const isEncrypted = this.configService.getOrThrow<string>('NODE_ENV') === 'dev' ? false : true

        const accessTokenExpiryMilliseconds = parseExpirationToMilliseconds(this.configService.getOrThrow<string>('JWT_EXPIRATION_TIME'));
        const refreshTokenExpiryMilliseconds = parseExpirationToMilliseconds(this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'));


        response.cookie('Authentication', access_token, {
            path: '/',
            httpOnly: true,
            secure: isEncrypted,
            expires: new Date(Date.now() + accessTokenExpiryMilliseconds),
            maxAge: accessTokenExpiryMilliseconds
        });

        response.cookie('Refresh', refresh_token, {
            path: '/',
            httpOnly: true,
            secure: isEncrypted,
            expires: new Date(Date.now() + refreshTokenExpiryMilliseconds),
            maxAge: refreshTokenExpiryMilliseconds
        });

        return { access_token }
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(
        @Request() req,
        @Res({ passthrough: true }) response: Response
    ) {


        response.clearCookie('Authentication');
        response.clearCookie('Refresh');

        return this.authService.logout(req.user.sub, req.user.jti);
    }

    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    async refreshToken(
        @Request() req,
        @Res({ passthrough: true }) response: Response
    ) {
        const { access_token } = await this.authService.refreshTokens(req.user.sub, req.user.refresh_token)

        const isEncrypted = this.configService.get<string>('NODE_ENV') === 'dev' ? false : true
        const accessTokenExpiryMilliseconds = parseExpirationToMilliseconds(this.configService.getOrThrow<string>('JWT_EXPIRATION_TIME'));


        response.cookie('Authentication', access_token, {
            path: '/',
            httpOnly: true,
            secure: isEncrypted,
            expires: new Date(Date.now() + accessTokenExpiryMilliseconds),
            maxAge: accessTokenExpiryMilliseconds
        });

        return { access_token, message: 'Tokens refreshed successfully' }
    }


    // TODO: Delete this route before production
    @UseGuards(JwtAuthGuard)
    @Get('testjwtguard')
    testJwtProtectedRoute(
        @Request() req,
        @Res({ passthrough: true }) response: Response
    ) {
        if (req.user) return { message: "Entry Granted by route" }
    }
}
