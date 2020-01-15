import {
    Controller,
    UseGuards,
    UseInterceptors,
    ClassSerializerInterceptor,
    Post,
    Param,
    Body,
    Delete,
    UploadedFiles,
    Patch,
    ForbiddenException
} from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiImplicitBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { User } from '../../_helpers/decorators/user.decorator';
import { AccessLevel } from '../../permissions/entity/access-level.enum';
import { ExerciseTestEntity } from '../entity/exercise-test.entity';
import { ExerciseService } from '../exercise.service';
import { TestService } from './test.service';

@Controller('exercises/:id/tests')
@ApiUseTags('exercises/:id/tests')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class TestController {

    constructor(
        protected readonly service: TestService,
        readonly exerciseService: ExerciseService
    ) {}

    @Post()
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'input', maxCount: 1 },
        { name: 'output', maxCount: 1 }
    ]))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'input', required: true })
    @ApiImplicitFile({ name: 'output', required: true })
    @ApiImplicitBody({ name: 'test', type: ExerciseTestEntity })
    async createTest(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFiles() files,
        @Body() dto: ExerciseTestEntity
    ): Promise<ExerciseTestEntity> {
        const accessLevel = await this.exerciseService.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createTest(exercise_id, dto, files.input[0], files.output[0]);
    }

    @Patch('/:test_id')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'input', maxCount: 1 },
        { name: 'output', maxCount: 1 }
    ]))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'input', required: true })
    @ApiImplicitFile({ name: 'output', required: true })
    @ApiImplicitBody({ name: 'test', type: ExerciseTestEntity })
    async updateTest(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('test_id') test_id: string,
        @UploadedFiles() files,
        @Body() dto: ExerciseTestEntity
    ): Promise<ExerciseTestEntity> {
        const accessLevel = await this.exerciseService.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateTest(exercise_id, test_id, dto, files.input[0], files.output[0]);
    }

    @Delete('/:test_id')
    async deleteTest(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('test_id') test_id: string
    ): Promise<ExerciseTestEntity> {
        const accessLevel = await this.exerciseService.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteTest(test_id);
    }
}
