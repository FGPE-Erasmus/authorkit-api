import { ApiModelProperty } from '@nestjs/swagger';
import {
    IsNotEmpty, Validate, IsString, IsAlphanumeric, Length,
} from 'class-validator';

import { PasswordValidator } from '../../../common/validators/password.validator';

export class ResetPasswordPayload {

    @ApiModelProperty({
        required: true,
        description: 'Token sent by email after password reset request.',
    })
    @IsNotEmpty()
    @IsString()
    @IsAlphanumeric()
    readonly resetToken: string;

    @ApiModelProperty({
        required: true,
        description: 'The new password for the account.',
    })
    @IsNotEmpty()
    @IsString()
    @Length(6, 100)
    @Validate(PasswordValidator)
    readonly password: string;
}
