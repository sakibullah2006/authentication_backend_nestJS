import { Body, Controller, Get, Post, Request, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/CreateUser.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from '../../common/guards/local-auth.guards';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guards';
import { CurrentUser } from './decorators/decorator.currentUser';
import { Response } from 'express';
import { User } from '../users/schema/User.schema';
import { ConfigService } from '@nestjs/config';

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
        return this.authService.login(user, response)
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(
        @Request() req,
        @Res({ passthrough: true }) response: Response
    ) {
        // console.log("from logout controller", req.user)
        const isEncrypted = this.configService.get<string>('NODE_ENV') === 'dev' ? false : true

        response.clearCookie('Authentication', {
            httpOnly: true,
            path: '/',
            secure: isEncrypted
        });
        return this.authService.logout(req.user.jti);
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
