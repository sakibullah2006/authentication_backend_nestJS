import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/User.schema';
import mongoose, { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UserSettings } from './schema/UserSettings.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(UserSettings.name) private userSettingsModel: Model<UserSettings>,
    ) { }

    async getUsers(query: FilterQuery<User>) {
        const users = await this.userModel.find().exec();
        return users ? users.map(user => user.toObject()) : null;
    }

    async getUserById(id: string) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new NotFoundException('User not Found',);
            }

            const user = await this.userModel.findById(id).populate('settings');
            if (!user) {
                throw new NotFoundException('User not found');
            }

            return user;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error retrieving user');
        }
    }

    async createUser({ settings, ...createUserDto }: CreateUserDto) {
        try {
            if (settings) {
                const newUserSettings = new this.userSettingsModel(settings)
                const savedUserSettings = await newUserSettings.save()
                const newUser = new this.userModel({
                    ...createUserDto,
                    settings: savedUserSettings._id
                });
                return await newUser.save();

            }
            const newUser = new this.userModel(createUserDto)
            return await newUser.save();
        } catch (error) {
            // Handle duplicate key error (unique constraint violation)
            if (error.code === 11000) {
                const duplicateField = Object.keys(error.keyPattern)[0];
                throw new ConflictException(`User with this ${duplicateField} already exists`);
            }

            // Handle Mongoose validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map((err: any) => err.message);
                throw new BadRequestException(`Validation failed: ${validationErrors.join(', ')}`);
            }

            // Handle other errors
            throw new BadRequestException('Error creating user');
        }
    }

    async getUser(query: FilterQuery<User>): Promise<User | null> {
        const user = await this.userModel.findOne(query).populate('settings').exec();
        return user ? user.toObject() : null;
    }

    async updateUser(query: FilterQuery<User>, data: UpdateQuery<User>) {
        return await this.userModel.updateOne(query, data).exec()
    }

}



