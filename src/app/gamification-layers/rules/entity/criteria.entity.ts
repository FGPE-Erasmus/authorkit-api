import { ApiProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import { IsOptional } from 'class-validator';

import { ConditionEntity } from './condition.entity';


export type Junctor = 'AND' | 'OR';

export class CriteriaEntity {

    @ApiProperty()
    @IsOptional({ always: true })
    @Column('simple-json', { nullable: true })
    public conditions: ConditionEntity[];

    @ApiProperty()
    @IsOptional({ always: true })
    @Column({
        type: 'simple-array',
        enum: ['AND', 'OR'],
        default: []
    })
    public junctors: Junctor[];
}
