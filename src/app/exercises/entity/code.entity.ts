import { ApiModelProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsDefined, IsString, MaxLength, IsEmpty } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity } from './tracked-file.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

export class CodeEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsEmpty({ always: true })
    @Column('varchar', { nullable: false })
    public pathname: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @MaxLength(25, { always: true })
    @Column('varchar', { length: 25, nullable: false })
    @Field()
    public lang: string;
}
