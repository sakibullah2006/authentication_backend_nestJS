import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserSettingsDocument = HydratedDocument<UserSettings>

@Schema()
export class UserSettings {
    @Prop({ required: false })
    recieveNotifications: boolean

    @Prop({ required: false })
    recieveEmails: boolean

    @Prop({ required: false })
    recieveSMS: boolean
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings)