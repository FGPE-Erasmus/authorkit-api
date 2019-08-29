import { ApiModelProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    ValidateIf,
    Validate,
    IsString,
    Length,
    MaxLength,
} from 'class-validator';

import { incompatibleSiblingsNotPresent } from 'common/validators/conditionals.validator';
import { NotSiblingOf } from 'common/validators/not-sibling-of.validator';
import { UsernameValidator } from 'common/validators/username.validator';
import { PasswordValidator } from 'common/validators/password.validator';

export class LoginPayload {

    @ApiModelProperty({
        description: 'Username of the user signing in (email must not be set if this property is set)',
    })
    @NotSiblingOf(['email'])
    @ValidateIf(incompatibleSiblingsNotPresent(['email']))
    @IsNotEmpty()
    @IsString()
    @Length(4, 20)
    @Validate(UsernameValidator)
    readonly username: string;

    @ApiModelProperty({
        description: 'Email of the user signing in (username must not be set if this property is set)',
    })
    @NotSiblingOf(['username'])
    @ValidateIf(incompatibleSiblingsNotPresent(['username']))
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    @IsEmail()
    readonly email: string;

    @ApiModelProperty({
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    @Length(6, 100)
    @Validate(PasswordValidator)
    readonly password: string;
}
