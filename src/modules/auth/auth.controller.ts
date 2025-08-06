import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/CreateUser.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from '../../common/guards/local-auth.guards';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guards';

@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService,
    ) { }


    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto) {
        return this.authService.signUp(createUserDto);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Body() loginDto: LoginDto, @Request() req) {
        return this.authService.login(req.user)
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@Request() req) {
        return this.authService.logout(req.user.jti);
    }
}
