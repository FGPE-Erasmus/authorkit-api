import { ApiProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import { IsEmpty } from 'class-validator';

import { TrackedFileEntity } from './tracked-file.entity';

export class ResourceEntity extends TrackedFileEntity {

    @Column('simple-json', { nullable: true })
    public file: TrackedFileEntity;

    @ApiProperty()
    @IsEmpty({ always: true })
    @Column('varchar', { nullable: false })
    public pathname: string;
}
