import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { InjectModel } from "@nestjs/mongoose"
import { PassportStrategy } from "@nestjs/passport"
import { request } from "express"
import { ExtractJwt, Strategy } from "passport-jwt"
import { DeniedToken } from "../../../common/token-denylist/token-denylist.schema"
import { Model } from "mongoose"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectModel(DeniedToken.name) private deniedTokenModel: Model<DeniedToken>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret-for-development-only',
            passReqToCallback: true,
        })
    }

    async validate(req: any, payload: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const jti = payload.jti;

        const isDenied = await this.deniedTokenModel.findOne({ jti })
        if (isDenied) {
            throw new UnauthorizedException('Token has been invalidated')
        }

        // console.log('jwt stategy invoked \n')
        // console.log('payload: ', payload + '\n')
        // console.log('req: ', req + '\n')

        return {
            userId: payload.sub, // Using 'sub' as we updated the JWT payload
            username: payload.username,
            email: payload.email,
            jti: payload.jti
        };
    }
}