import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { InjectModel } from "@nestjs/mongoose"
import { PassportStrategy } from "@nestjs/passport"
import { Request } from "express"
import { ExtractJwt, Strategy } from "passport-jwt"
import { DeniedToken } from "../../../common/token-denylist/token-denylist.schema"
import { Model, Types } from "mongoose"
import { UserSettings } from "../../users/schema/UserSettings.schema"
import { UsersService } from "../../users/users.service"

// type Payload = {
//     sub: Types.ObjectId;
//     username: string;
//     displayName?: string;
//     email: string;
//     avatarUrl?: string;
//     settings: UserSettings;
//     jti: string
// }

const cookieExtractor = (req: Request): string => {
    return req.cookies?.Authentication;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
        @InjectModel(DeniedToken.name) private deniedTokenModel: Model<DeniedToken>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                cookieExtractor
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret-for-development-only',
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
        // Check if token is denied
        const isDenied = await this.deniedTokenModel.findOne({ jti })
        if (isDenied) {
            throw new UnauthorizedException('Token has been invalidated')
        }

        // console.log('jwt strategy payload: ', payload)
        // console.log('token jti', jti)

        return {
            userId: payload.sub, // Using 'sub' as we updated the JWT payload
            username: payload.username,
            email: payload.email,
            displayName: payload.displayName,
            jti: jti
        };
    }
}