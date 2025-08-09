import { ConflictException, Injectable, NotFoundException, Request, Res, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/CreateUser.dto';
import { LoginDto } from './dto/login.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DeniedToken } from '../../common/token-denylist/token-denylist.schema';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schema/User.schema';
import { Response, Request as ExpressRequest } from 'express';
import { UserSettings } from '../users/schema/UserSettings.schema';
import { ConfigService } from '@nestjs/config';

type payload = {
    sub: Types.ObjectId;
    username: string;
    displayName?: string;
    email: string;
    avatarUrl?: string;
    jti?: string;
    settings?: UserSettings;
}

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectModel(DeniedToken.name) private deniedTokenModel: Model<DeniedToken>
    ) { }

    async signUp(createUserDto: CreateUserDto) {
        const existingUser = await this.usersService.getUser({ username: createUserDto.username });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.usersService.createUser({
            ...createUserDto,
            password: hashedPassword,
        });
        // Avoid returning the password
        const { password, __v, ...result } = user.toObject();
        return result;
    }

    async validateUser({ username, password }: LoginDto) {
        const user = await this.usersService.getUser({ username: username });
        if (user && await bcrypt.compare(password, user.password)) {
            // Convert to plain object and remove sensitive data
            const { password: userPassword, ...result } = user;
            return result;
        }
        return null;
    }

async login(user: User, response?: Response) {
        const jti = `${Date.now()}-${Math.random()}`;

        // Create a clean payload with only necessary user data
        var payload: payload = {
            sub: user._id, // 'sub' is the standard JWT claim for user ID
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl ?? '',
        };

        // console.log(user)
        const isEncrypted = this.configService.get<string>('NODE_ENV') === 'dev' ? false : true
        const expiryTime = this.configService.get<string>('JWT_EXPIRATION_TIME') || '3600s'

        // Parse expiration time to milliseconds for cookie
        const expirySeconds = parseInt(expiryTime.replace(/[^0-9]/g, '')); // Remove non-numeric characters
        const expiryMilliseconds = expirySeconds * 1000;



        const access_token = this.jwtService.sign(payload, { jwtid: jti })

        // Set cookie if response object is provided
        if (response) {
            response.cookie('Authentication', access_token, {
                path: '/',
                httpOnly: true,
                secure: isEncrypted,
                expires: new Date(Date.now() + expiryMilliseconds)
            });
        }

        return {
            access_token
        };
    }


    async logout(
        jti: string,
    ) {
        const result = await this.deniedTokenModel.create({ jti });

        console.log("from logout service, follow deniedTokenlist added \njti:", jti)

        if (!result) {
            return { message: 'Log out failed!' };
        }
        // console.log("logout service - jti:", jti)
        return { message: 'Successfully logged out' };
    }
}