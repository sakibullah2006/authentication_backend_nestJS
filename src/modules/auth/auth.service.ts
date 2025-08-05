import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../users/schema/User.schema';
import { CreateUserDto } from '../users/dto/CreateUser.dto';
import { LoginDto } from './dto/login.dto';

type payload = {}

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async signUp(createUserDto: CreateUserDto) {
        const existingUser = await this.usersService.findOneByUsername(createUserDto.username);
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.usersService.createUser({
            ...createUserDto,
            password: hashedPassword,
        });
        // Avoid returning the password
        const { password, ...result } = user.toObject();
        return result;
    }

    async validateUser({ username, password }: LoginDto) {
        const user = await this.usersService.findOneByUsername(username);
        if (user && await bcrypt.compare(password, user.password)) {
            // Convert to plain object and remove sensitive data
            const userObj = (user as any).toObject();
            const { password: userPassword, __v, ...result } = userObj;
            return result;
        }
        return null;
    }

    async login(user: any) {
        // Create a clean payload with only necessary user data
        const payload = {
            sub: user._id.toString(), // 'sub' is the standard JWT claim for user ID
            username: user.username,
            email: user.email,
            displayName: user.displayName || null
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}