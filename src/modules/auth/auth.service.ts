import { ConflictException, ForbiddenException, Injectable, NotFoundException, Request, Res, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/CreateUser.dto';
import { LoginDto } from './dto/login.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DeniedToken } from '../../common/token-denylist/token-denylist.schema';
import mongoose, { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schema/User.schema';
import { Response, Request as ExpressRequest } from 'express';
import { UserSettings } from '../users/schema/UserSettings.schema';
import { ConfigService } from '@nestjs/config';
import { parseExpirationToMilliseconds } from '../../common/lib/time.utility';

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

    async _getTokens(payload: payload) {
        const jti = `${Date.now()}-${Math.random()}`;

        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(
                { ...payload },
                {
                    jwtid: jti,
                    secret: this.configService.getOrThrow<string>('JWT_SECRET'),
                    expiresIn: this.configService.getOrThrow<string>('JWT_EXPIRATION_TIME')
                }
            ),
            this.jwtService.signAsync(
                { ...payload },
                {
                    secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
                    expiresIn: this.configService.getOrThrow<string>('REFRESH_TOKEN_EXPIRATION_TIME')
                }
            ),
        ]);
        return { access_token, refresh_token };
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.getUserById(userId)
        if (!user || !user.hashedRefreshToken) throw new ForbiddenException('Access Denied');

        const tokensMatch = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
        if (!tokensMatch) throw new ForbiddenException('Access Denied');

        const payload: payload = {
            sub: user._id, // 'sub' is the standard JWT claim for user ID
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl ?? '',
        }

        const { access_token } = await this._getTokens(payload);
        return { access_token };
    }

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

    async login(user: User) {

        // Create a clean payload with only necessary user data
        var payload: payload = {
            sub: user._id, // 'sub' is the standard JWT claim for user ID
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl ?? '',
        };

        const { access_token, refresh_token } = await this._getTokens(payload);
        await this.usersService.updateUser({ _id: user._id }, { $set: { hashedRefreshToken: await bcrypt.hash(refresh_token, 10) } });

        return {
            access_token,
            refresh_token
        };
    }




    async logout(
        userId: string,
        jti: string,
    ) {
        try {
            await Promise.all([
                await this.deniedTokenModel.create({ jti }),
                await this.usersService.updateUser({ _id: userId }, { $set: { hashedRefreshToken: undefined } })
            ])
        } catch (error) {
            return { message: 'Log out failed!' };
        }
        return { message: 'Successfully logged out' };
    }
}   