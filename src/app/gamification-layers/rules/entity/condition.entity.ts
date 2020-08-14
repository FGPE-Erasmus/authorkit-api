import { ApiProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import { IsOptional, IsDefined, IsNotEmpty, IsString, MaxLength, IsEnum, IsNumber } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ConditionCompFunction } from './condition-comp-function.enum';
import { ConditionSubject } from './condition-subject.enum';

const { CREATE, UPDATE } = CrudValidationGroups;

export class ConditionEntity {

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { always: true })
    @Column('integer', { nullable: false, default: 0 })
    public order: number;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsEnum(ConditionSubject, { always: true })
    @Column({
        type: 'enum',
        enum: ConditionSubject
    })
    public left_entity: ConditionSubject;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNotEmpty({ always: true })
    @IsString({ always: true })
    @MaxLength(150, { always: true })
    @Column('varchar', { length: 150, nullable: false })
    public left_property: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsEnum(ConditionCompFunction, { always: true })
    @Column({
        type: 'enum',
        enum: ConditionCompFunction
    })
    public comparing_function: ConditionCompFunction;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsEnum(ConditionSubject, { always: true })
    @Column({
        type: 'enum',
        enum: ConditionSubject
    })
    public right_entity: ConditionSubject;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(150, { always: true })
    @Column('varchar', { length: 150 })
    public right_property: string;
}
