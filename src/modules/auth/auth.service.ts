import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/CreateUser.dto';
import { LoginDto } from './dto/login.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DeniedToken } from '../../common/token-denylist/token-denylist.schema';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schema/User.schema';

type payload = {}

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        @InjectModel(DeniedToken.name) private deniedTokenModel: Model<DeniedToken>
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
        };
        const jti = `${Date.now()}-${Math.random()}`;
        return {
            access_token: this.jwtService.sign(payload, { jwtid: jti }),
        };
    }

    async logout(jti: string) {
        const result = await this.deniedTokenModel.create({ jti });
        if (!result) {
            return { message: 'Log out failed!' };
        }
        // console.log("logout service - jti:", jti)
        return { message: 'Successfully logged out' };
    }
}