import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Crud, CrudController } from '@nestjsx/crud';

import { AppLogger } from '../../app.logger';
import { ACGuard, UseRoles, CrudOperationEnum, ResourcePossession, UseContextAccessEvaluator } from '../../access-control';
import { evaluateUserContextAccess } from '../../project/security/project-context-access.evaluator';
import { TestSetService } from './testset.service';
import { ExerciseTestSetEntity } from '../entity';

@Controller('exercises/:exercise_id/testsets')
@ApiUseTags('exercises/:exercise_id/testsets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), ACGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: ExerciseTestSetEntity
    },
    params: {
        exercise_id: {
          field: 'exercise_id',
          type: 'uuid'
        },
        id: {
          field: 'id',
          type: 'uuid',
          primary: true
        }
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
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        createOneBase: {
            interceptors: [],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.PATCH,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        updateOneBase: {
            interceptors: [],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.PATCH,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        replaceOneBase: {
            interceptors: [],
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
export class TestSetController implements CrudController<ExerciseTestSetEntity> {

    private logger = new AppLogger(TestSetController.name);

    constructor(
        readonly service: TestSetService
    ) {}

    get base(): CrudController<ExerciseTestSetEntity> {
        return this;
    }
}
