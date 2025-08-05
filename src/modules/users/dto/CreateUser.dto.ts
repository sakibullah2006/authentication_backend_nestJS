import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, isNotEmpty, IsOptional, IsString, Matches, MinLength, ValidateNested } from 'class-validator';

export class CreateUserSettingsDto {
    @IsOptional()
    @IsBoolean()
    recieveNotifications?: boolean

    @IsBoolean()
    @IsOptional()
    recieveEmails?: boolean

    @IsBoolean()
    @IsOptional()
    recieveSMS?: boolean
}

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-zA-Z_-][a-zA-Z0-9_-]*$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens. Cannot start with a number or contain spaces.' })
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateUserSettingsDto)
    settings?: CreateUserSettingsDto;
}