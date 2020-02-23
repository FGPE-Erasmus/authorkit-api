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
    ForbiddenException,
    Get
} from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiImplicitBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { User } from '../_helpers/decorators/user.decorator';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { ExerciseService } from '../exercises/exercise.service';

import {
    TEST_SYNC_QUEUE,
    TEST_SYNC_CREATE,
    TEST_SYNC_UPDATE,
    TEST_SYNC_DELETE
} from './test.constants';
import { TestEntity } from './entity/test.entity';
import { TestService } from './test.service';

@Controller('tests')
@ApiUseTags('tests')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class TestController {

    constructor(
        protected readonly service: TestService,
        @InjectQueue(TEST_SYNC_QUEUE) private readonly testSyncQueue: Queue,
        readonly exerciseService: ExerciseService
    ) {}

    @Get('/:id/input/contents')
    async readInput(
        @User() user: any,
        @Param('id') id: string
    ): Promise<string> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.service.getInputContents(user, id);
    }

    @Get('/:id/output/contents')
    async readOutput(
        @User() user: any,
        @Param('id') id: string
    ): Promise<string> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.service.getOutputContents(user, id);
    }

    @Post()
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'input', maxCount: 1 },
        { name: 'output', maxCount: 1 }
    ]))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'input', required: true })
    @ApiImplicitFile({ name: 'output', required: true })
    @ApiImplicitBody({ name: 'test', type: TestEntity })
    async createTest(
        @User() user: any,
        @UploadedFiles() files,
        @Body() dto: TestEntity
    ): Promise<TestEntity> {
        const accessLevel = await this.exerciseService.getAccessLevel(dto.exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        const test = await this.service.createTest(dto, files.input[0], files.output[0]);
        this.testSyncQueue.add(TEST_SYNC_CREATE, {
            user, test, input: files.input[0], output: files.output[0]
        });
        return test;
    }

    @Patch('/:id')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'input', maxCount: 1 },
        { name: 'output', maxCount: 1 }
    ]))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'input', required: true })
    @ApiImplicitFile({ name: 'output', required: true })
    @ApiImplicitBody({ name: 'test', type: TestEntity })
    async updateTest(
        @User() user: any,
        @Param('id') id: string,
        @UploadedFiles() files,
        @Body() dto: TestEntity
    ): Promise<TestEntity> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        const test = await this.service.updateTest(id, dto, files.input[0], files.output[0]);
        this.testSyncQueue.add(TEST_SYNC_UPDATE, {
            user, test, input: files.input[0], output: files.output[0]
        });
        return test;
    }

    @Delete('/:id')
    async deleteTest(
        @User() user: any,
        @Param('id') id: string
    ): Promise<TestEntity> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        const test = await this.service.deleteTest(id);
        this.testSyncQueue.add(TEST_SYNC_DELETE, { user, test });
        return test;
    }
}
