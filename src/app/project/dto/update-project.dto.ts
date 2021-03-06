
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional, MaxLength, IsEnum, IsBoolean } from 'class-validator';

import { ProjectStatus } from '../entity';

export class UpdateProjectDto {

    @ApiProperty()
    readonly id?: string;

    @ApiProperty()
    @IsString()
    @Length(2, 50)
    readonly name?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @MaxLength(250)
    readonly description?: string;

    @ApiProperty()
    @IsBoolean()
    readonly is_public?: boolean;

    @ApiProperty()
    @IsEnum(ProjectStatus)
    readonly status?: ProjectStatus;
}
