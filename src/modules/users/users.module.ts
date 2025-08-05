import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserSchema } from './schema/User.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSettings, UserSettingsSchema } from './schema/UserSettings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema
      },
      {
        name: UserSettings.name,
        schema: UserSettingsSchema
      }
    ])
  ],
  providers: [UsersService],
  controllers: [],
  exports: [UsersService]
})
export class UsersModule { }
