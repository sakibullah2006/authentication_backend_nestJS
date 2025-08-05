import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { UserSettings } from "./UserSettings.schema";

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
    @Prop({ required: true, unique: true })
    username: string

    @Prop({ required: false })
    displayName?: string

    @Prop({ required: true, unique: true })
    email: string

    @Prop({ required: true })
    password: string

    @Prop({ required: false })
    avatarUrl?: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserSettings' })
    settings: UserSettings;
}

export const UserSchema = SchemaFactory.createForClass(User);