import { ApiModelProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyEmailDto {

    @ApiModelProperty()
    @IsString()
    activationToken: string;
}
