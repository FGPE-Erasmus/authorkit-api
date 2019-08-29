import { ApiModelProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MaxLength,
    Length,
    Validate,
} from 'class-validator';
import { UsernameValidator } from 'common/validators/username.validator';
import { PasswordValidator } from 'common/validators/password.validator';

export class RegisterPayload {

    @ApiModelProperty({
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    @IsEmail()
    email: string;

    @ApiModelProperty({
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    @Length(4, 20)
    @Validate(UsernameValidator)
    username: string;

    @ApiModelProperty({
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    firstname: string;

    @ApiModelProperty({
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    lastname: string;

    @ApiModelProperty({
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    @Length(6, 100)
    @Validate(PasswordValidator)
    password: string;
}
