import {
    Controller,
    Post,
    UseGuards,
    ClassSerializerInterceptor,
    UseInterceptors
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CrudController, Crud } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUseTags } from '@nestjs/swagger';

import { config } from '../../config';
import { mail } from '../_helpers/mail';
import { AppLogger } from '../app.logger';
import { createToken } from '../auth/jwt';
import { UserEntity } from './entity';
import { UserCommand } from './user.command';
import {
    USER_CMD_PASSWORD_NEW,
    USER_CMD_PASSWORD_RESET,
    USER_CMD_REGISTER,
    USER_CMD_REGISTER_VERIFY
} from './user.constants';
import { UserService } from './user.service';
import {
    UseRoles,
    CrudOperationEnum,
    ResourcePossession,
    UseContextAccessEvaluator,
    ACGuard,
    AccessControlRequestInterceptor
} from '../access-control';
import { evaluateUserContextAccess } from './security/user-context-access.evaluator';

@Controller('users')
@ApiUseTags('users')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: UserEntity
    },
    routes: {
        getManyBase: {
            interceptors: [],
            decorators: [
                UseGuards(AuthGuard('jwt'), ACGuard),
                UseRoles({
                    resource: 'user',
                    action: CrudOperationEnum.LIST,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        getOneBase: {
            interceptors: [],
            decorators: [
                UseGuards(AuthGuard('jwt'), ACGuard),
                UseRoles({
                    resource: 'user',
                    action: CrudOperationEnum.READ,
                    possession: ResourcePossession.OWN
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        createOneBase: {
            interceptors: [AccessControlRequestInterceptor],
            decorators: [
                UseGuards(AuthGuard('jwt'), ACGuard),
                UseRoles({
                    resource: 'user',
                    action: CrudOperationEnum.CREATE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        updateOneBase: {
            interceptors: [AccessControlRequestInterceptor],
            decorators: [
                UseGuards(AuthGuard('jwt'), ACGuard),
                UseRoles({
                    resource: 'user',
                    action: CrudOperationEnum.UPDATE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        replaceOneBase: {
            interceptors: [AccessControlRequestInterceptor],
            decorators: [
                UseGuards(AuthGuard('jwt'), ACGuard),
                UseRoles({
                    resource: 'user',
                    action: CrudOperationEnum.UPDATE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        deleteOneBase: {
            interceptors: [],
            decorators: [
                UseGuards(AuthGuard('jwt'), ACGuard),
                UseRoles({
                    resource: 'user',
                    action: CrudOperationEnum.DELETE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ],
            returnDeleted: true
        }
    }
})
export class UserController implements CrudController<UserEntity> {

    private logger = new AppLogger(UserController.name);

    constructor(
        readonly service: UserService,
        private userCmd: UserCommand
    ) { }

    get base(): CrudController<UserEntity> {
        return this;
    }

    @Post('import')
    @UseGuards(AuthGuard('jwt'), ACGuard)
    @UseRoles({
        resource: 'user',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY
    })
    public async importUsers(): Promise<any> {
        return this.userCmd.create(20);
    }

    @MessagePattern({ cmd: USER_CMD_REGISTER })
    public async onUserRegister(user: UserEntity): Promise<void> {
        try {
            this.logger.debug(`[onUserRegister] Send verification email for user ${user.email}`);
            const token = createToken(user.id.toString(), config.auth.verify.timeout, config.auth.verify.secret);
            await mail(
                'email-verification',
                user.email,
                {
                    app_name: config.name,
                    app_host: config.host,
                    app_port: config.port,
                    firstname: user.first_name,
                    lastname: user.last_name,
                    token
                }
            );
            this.logger.debug('[onUserRegister] Verification email sent');
        } catch (err) {
            this.logger.error(`[onUserRegister] Verification email not sent, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: USER_CMD_REGISTER_VERIFY })
    public async onUserRegisterVerify(user: UserEntity): Promise<void> {
        try {
            this.logger.debug(`[onUserRegisterVerify] Send welcome email for user ${user.email}`);
            await mail(
                'welcome',
                user.email,
                {
                    app_name: config.name,
                    app_host: config.host,
                    app_port: config.port,
                    firstname: user.first_name,
                    lastname: user.last_name
                }
            );
            this.logger.debug('[onUserRegisterVerify] Welcome email sent');
        } catch (err) {
            this.logger.error(`[onUserRegisterVerify] Mail not sent, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: USER_CMD_PASSWORD_RESET })
    public async onUserPasswordReset(user: UserEntity): Promise<void> {
        try {
            this.logger.debug(`[onUserRegister] Send password reset instruction email for user ${user.email}`);
            const token = createToken(user.id.toString(), config.auth.password_reset.timeout, config.auth.password_reset.secret);
            await mail(
                'reset-password',
                user.email,
                {
                    app_name: config.name,
                    app_host: config.host,
                    app_port: config.port,
                    firstname: user.first_name,
                    lastname: user.last_name,
                    token
                }
            );
            this.logger.debug('[onUserRegister] Password reset email sent');
        } catch (err) {
            this.logger.error(`[onUserRegister] Mail not sent, because ${JSON.stringify(err.message)}`, err.stack);
        }
    }

    @MessagePattern({ cmd: USER_CMD_PASSWORD_NEW })
    public async onUserPasswordNew(user: UserEntity): Promise<void> {
        try {
            this.logger.debug(`[onUserRegister] Send password new email for user ${user.email}`);
            await mail(
                'new-password',
                user.email,
                {
                    app_name: config.name,
                    app_host: config.host,
                    app_port: config.port,
                    firstname: user.first_name,
                    lastname: user.last_name
                }
            );
            this.logger.debug('[onUserRegister] Password new email sent');
        } catch (err) {
            this.logger.error(`[onUserRegister] Mail not sent, because ${err.message}`, err.stack);
        }
    }
}
