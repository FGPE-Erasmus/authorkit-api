import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { GitService } from '../git/git.service';

import { PERMISSION_CMD_SET, PERMISSION_CMD_REVOKE } from './permission.constants';
import { PermissionEntity } from './entity/permission.entity';
import { UserEntity } from '../user/entity/user.entity';

@Controller()
export class PermissionListener {
    private logger = new AppLogger(PermissionListener.name);

    constructor(protected readonly gitService: GitService) {}

    @MessagePattern({ cmd: PERMISSION_CMD_SET })
    public async onPermissionSet(
        user: UserEntity,
        permission: PermissionEntity
    ): Promise<void> {
        try {
            this.logger.debug(
                `[onPermissionUpdate] Update project in Github repository`
            );
            // await this.gitService.(project);
            this.logger.debug(
                '[onPermissionUpdate] Project updated in Github repository'
            );
        } catch (err) {
            this.logger.error(
                `[onPermissionUpdate] Project NOT updated in Github repository, because ${err.message}`,
                err.stack
            );
        }
    }

    @MessagePattern({ cmd: PERMISSION_CMD_REVOKE })
    public async onPermissionRevoke(
        user: UserEntity,
        permission: PermissionEntity
    ): Promise<void> {
        try {
            this.logger.debug(
                `[onPermissionRevoke] Revoke permission in Github repository`
            );
            // await this.gitService.deleteProjectRepository(project);
            this.logger.debug(
                '[onPermissionRevoke] Revoke permission in Github repository'
            );
        } catch (err) {
            this.logger.error(
                `[onPermissionRevoke] Permission NOT revoked in Github repository, because ${err.message}`,
                err.stack
            );
        }
    }
}
