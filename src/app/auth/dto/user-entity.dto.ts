import { ApiModelProperty } from '@nestjs/swagger';
import { config } from '../../../config';

export class UserEntityDto {

    @ApiModelProperty()
    public first_name: string;

    @ApiModelProperty()
    public last_name: string;

    @ApiModelProperty({
        required: false
    })
    public institution?: string;

    @ApiModelProperty({
        required: false
    })
    public country?: string;

    @ApiModelProperty()
    public email: string;

    @ApiModelProperty({
        minLength: config.validator.password.min_length
    })
    public password: string;

    @ApiModelProperty({
        required: false
    })
    public phone_num?: string;

    @ApiModelProperty({
        required: false
    })
    public profile_img?: string;
}
