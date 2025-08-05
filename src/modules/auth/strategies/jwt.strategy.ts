import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret-for-development-only',
        })
    }

    async validate(payload: any) {
        return {
            userId: payload.sub, // Using 'sub' as we updated the JWT payload
            username: payload.username,
            email: payload.email,
            displayName: payload.displayName
        };
    }
}