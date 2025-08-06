// src/modules/otp/entities/otp.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schema/User.schema';

// For better type-safety, we define an enum for OTP types
export enum OtpType {
    PASSWORD_RESET = 'PASSWORD_RESET',
    LOGIN = 'LOGIN',
}

@Schema()
export class Otp {
    @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
    userId: User;

    @Prop({ required: true })
    otp: string; // This will be the hashed OTP

    @Prop({ required: true, enum: OtpType })
    type: OtpType;

    @Prop({ required: true })
    expiresAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Create a TTL (Time-To-Live) index on the 'expiresAt' field.
// MongoDB will automatically delete documents from this collection when the
// 'expiresAt' time is reached. This is perfect for auto-cleanup.
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });