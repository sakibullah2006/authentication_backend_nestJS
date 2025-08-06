import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Otp, OtpType } from './schemas/otp.schema';
import mongoose, { Model } from 'mongoose';
import { UserDocument } from '../users/schema/User.schema';
import * as bcrypt from 'bcrypt'


@Injectable()
export class OtpService {
    constructor(
        @InjectModel(Otp.name) private otpModel: Model<Otp>
    ) { }

    // create otp
    async createOtp(user: UserDocument, type: OtpType): Promise<string> {
        // generate otp 
        const otpValue = Math.floor(100000 * Math.random() * 900000).toString()
        const hashedOtp = await bcrypt.hash(otpValue, 10)
        // generate expiry time
        const expiryMinutes = type === OtpType.PASSWORD_RESET ? 10 : 5;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)

        // delete previous otp
        await this.otpModel.deleteMany({ userId: user._id, type: type })

        // create otp
        await this.otpModel.create({
            userId: user._id,
            otp: hashedOtp,
            type,
            expiresAt,
        });

        return otpValue
    }

    // validate otp
    async findAndValidateOtp(userId: string, otp: string, type: OtpType): Promise<Otp | null> {
        const findOtp = await this.otpModel.findOne({ userId: userId, type })

        if (!findOtp || findOtp?.expiresAt < new Date()) return null;

        const isMatch = await bcrypt.compare(otp, findOtp.otp)
        return isMatch ? findOtp : null;

    }

    // delete otp
    async deleteOtp(otpId: string): Promise<void> {
        if (mongoose.Types.ObjectId.isValid(otpId))
            await this.otpModel.findByIdAndDelete(otpId)
    }
}
