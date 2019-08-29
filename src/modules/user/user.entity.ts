import { Exclude } from 'class-transformer';
import {
    IsDate,
    IsEmail,
    MaxLength,
    MinLength,
    Length,
    IsOptional,
    IsPhoneNumber,
    IsUrl,
    IsEnum,
    IsNotEmpty,
    IsArray,
    IsString,
    IsAlphanumeric,
    IsBoolean,
    Validate,
} from 'class-validator';
import { Entity, Column, CreateDateColumn, UpdateDateColumn, ObjectIdColumn, BeforeInsert } from 'typeorm';
import { PasswordTransformer } from './password.transformer';
import { UsernameValidator } from 'common/validators/username.validator';
import { generateToken } from 'common/utils/token.util';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
}

@Entity({
    name: 'users',
})
export class User {
    @ObjectIdColumn()
    _id: number;

    @Column({ length: 100 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    firstname: string;

    @Column({ length: 100 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    lastname: string;

    @Column({ length: 150, nullable: true })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    institution: string;

    @Column({ length: 30, nullable: true })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    country: string;

    @Column({ length: 40, nullable: true })
    @IsOptional()
    @IsString()
    @IsPhoneNumber('ZZ')
    phone: string;

    @Column({ default: '' })
    @IsOptional()
    @IsUrl()
    avatar: string;

    @Column({ nullable: true })
    @IsOptional()
    @IsDate()
    birthday: Date;

    @Column({ length: 20, unique: true })
    @IsNotEmpty()
    @IsString()
    @Length(4, 20)
    @Validate(UsernameValidator)
    username: string;

    @Column({ length: 255, unique: true })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    @IsEmail()
    email: string;

    @Column({
        name: 'password',
        length: 255,
        transformer: new PasswordTransformer(),
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    @Exclude()
    password: string;

    @Column({ default: [UserRole.USER] })
    @IsArray()
    @IsEnum(UserRole, { each: true })
    roles: UserRole[];

    @Column({ default: false })
    @IsBoolean()
    activated: boolean;

    @Column({ nullable: true })
    @IsString()
    @IsAlphanumeric()
    activationToken: string;

    @Column({ nullable: true })
    @IsString()
    @IsAlphanumeric()
    resetToken: string;

    @Column({ nullable: true })
    @IsDate()
    resetTokenDate: Date;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @BeforeInsert()
    async beforeInsertActions() {
        if (!this.roles || this.roles.length === 0) {
            this.roles = [UserRole.USER];
        }
        this.activated = false;
        this.activationToken = await generateToken();
    }
}

export class UserFillableFields {
    _id: any;
    firstname: string;
    lastname: string;
    institution: string;
    country: string;
    phone: string;
    avatar: string;
    birthday: Date;
    username: string;
    email: string;
    password: string;
}
