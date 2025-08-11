import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class DeniedToken {
    @Prop({ required: true, unique: true })
    jti: string
}

export const DeniedTokenSchema = SchemaFactory.createForClass(DeniedToken);

// TTL index matching the JWT expiration time (e.g., 1 hour)
DeniedTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: parseInt(process.env.JWT_EXPIRATION_TIME || '3600') });