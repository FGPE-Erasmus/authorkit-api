import { ApiModelProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import { IsEmpty } from 'class-validator';

import { TrackedFileEntity } from './tracked-file.entity';

export class ResourceEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsEmpty({ always: true })
    @Column('varchar', { nullable: false })
    public pathname: string;
}
