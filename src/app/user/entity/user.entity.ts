import { ApiModelProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MinLength, Validate, ValidateIf } from 'class-validator';
import { DateTime } from 'luxon';
import { ExtendedEntity, passwordHash, PasswordValidator } from '../../_helpers';
import { IsUserAlreadyExist } from '../user.validator';
import { config } from '../../../config';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity()
export class UserEntity extends ExtendedEntity {

    @ApiModelProperty()
    @ObjectIdColumn()
    public id: string;

    @ApiModelProperty()
    @IsString()
    @Column()
    public first_name: string;

    @ApiModelProperty()
    @IsString()
    @Column()
    public last_name: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @Column()
    public institution: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @Column()
    public country: string;

    @ApiModelProperty()
    @IsEmail()
    @ValidateIf(o => !o.id)
    @Validate(IsUserAlreadyExist, {
        message: 'User already exists'
    })
    @Column()
    public email: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @Column()
    public phone_num: string;

    @ApiModelProperty()
    @IsOptional()
    @IsUrl()
    @Column()
    public profile_img: string;

    @ApiModelProperty()
    @IsOptional()
    @MinLength(config.validator.password.min_length)
    @Validate(PasswordValidator)
    @Column()
    public password: string;

    @ApiModelProperty()
    @Column()
    public is_verified = false;

    @ApiModelProperty()
    @IsOptional()
    @Column()
    public provider: string;

    @ApiModelProperty()
    @IsOptional()
    @Column()
    public socialId: string;

    @ApiModelProperty()
    @IsOptional()
    @Column()
    public phone_token: string;

    @Column()
    public online_at: DateTime;

    hashPassword() {
        this.password = passwordHash(this.password);
    }
}
