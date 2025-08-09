import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { UserSettings } from "./UserSettings.schema";

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
    @Prop({ type: SchemaTypes.ObjectId, auto: true })
    _id: Types.ObjectId

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

    @Prop({ type: String, required: false })
    hashedRefreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);