import { Post, HttpCode, HttpStatus, UseInterceptors, Controller, ClassSerializerInterceptor, UseGuards, UploadedFile } from '@nestjs/common';
import { ApiResponse, ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrudController, Override, ParsedBody, ParsedRequest, CrudRequest, Crud } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { AppLogger } from '../app.logger';
import { RequestContext } from '../_helpers';
import { UseRoles, CrudOperationEnum, ResourcePossession, UseContextAccessEvaluator, AccessControlRequestInterceptor, ACGuard } from '../access-control';
import { evaluateUserContextAccess } from '../project/security/project-context-access.evaluator';
import { ExerciseEntity, ExerciseDynamicCorrectorEntity } from './entity';
import { ExerciseService } from './exercise.service';
import { ExerciseCommand } from './exercise.command';

@Controller('exercises')
@ApiUseTags('exercises')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), ACGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: ExerciseEntity
    },
    routes: {
        getManyBase: {
            interceptors: [],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.LIST,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        getOneBase: {
            interceptors: [],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.READ,
                    possession: ResourcePossession.OWN
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        updateOneBase: {
            interceptors: [AccessControlRequestInterceptor],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.UPDATE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        replaceOneBase: {
            interceptors: [AccessControlRequestInterceptor],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.UPDATE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        deleteOneBase: {
            interceptors: [],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.DELETE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ],
            returnDeleted: true
        }
    }
})
export class ExerciseController implements CrudController<ExerciseEntity> {

    private logger = new AppLogger(ExerciseController.name);

    constructor(
        readonly service: ExerciseService,
        readonly exerciseCmd: ExerciseCommand
    ) { }

    get base(): CrudController<ExerciseEntity> {
        return this;
    }

    @Post('import')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'NO CONTENT' })
    public async import(): Promise<void> {
        this.logger.silly(`[importExercises] execute `);
        return this.exerciseCmd.create(20);
    }

    @Override()
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(AccessControlRequestInterceptor)
    createOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: ExerciseEntity
    ) {
        if (!dto.owner_id) {
            dto.owner_id = RequestContext.currentUser().id;
        }
        return this.base.createOneBase(req, dto);
    }

    @Post('dynamic-corrector')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    async uploadDynamicCorrector(@UploadedFile() file, dto: ExerciseDynamicCorrectorEntity): Promise<ExerciseDynamicCorrectorEntity> {
        return undefined;
    }
}
