import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeniedToken, DeniedTokenSchema } from './token-denylist.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: DeniedToken.name, schema: DeniedTokenSchema }])],
    exports: [MongooseModule]
})
export class TokenDenylistModule { }
