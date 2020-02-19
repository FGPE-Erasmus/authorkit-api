import { ApiModelProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import { IsEmpty } from 'class-validator';

import { TrackedFileEntity } from './tracked-file.entity';
import { Field } from 'type-graphql';

export class ResourceEntity extends TrackedFileEntity {

    @Column('simple-json', { nullable: true })
    @Field(() => TrackedFileEntity)
    public file: TrackedFileEntity;

    @ApiModelProperty()
    @IsEmpty({ always: true })
    @Column('varchar', { nullable: false })
    public pathname: string;
}
