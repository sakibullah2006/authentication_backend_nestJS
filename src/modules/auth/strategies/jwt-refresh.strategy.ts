import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../../users/users.service";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

const cookieExtractor = (req: Request): string => {
    return req.cookies?.Refresh;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                cookieExtractor
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
            passReqToCallback: true,
        })
    }

    async validate(req: Request, payload: any) {
        const jti = payload.jti;
        // Get user from database
        const user = await this.usersService.getUser({ _id: payload.sub });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const refresh_token = req.cookies.Refresh;
        if (!refresh_token) throw new ForbiddenException('Refresh token malformed');

        return {
            ...payload,
            refresh_token
        }
    }
}