import { ApiProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import { IsOptional, IsDefined, IsString, MaxLength, IsEmpty } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity } from './tracked-file.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

export class CodeEntity extends TrackedFileEntity {

    @Column('simple-json', { nullable: true })
    public file: TrackedFileEntity;

    @ApiProperty()
    @IsEmpty({ always: true })
    @Column('varchar', { nullable: false })
    public pathname: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @MaxLength(25, { always: true })
    @Column('varchar', { length: 25, nullable: false })
    public lang: string;
}
