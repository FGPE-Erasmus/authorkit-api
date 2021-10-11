import { UserDto } from './dto/user.dto';
import { Role } from '../../common/enums/role.enum';
import { Roles } from './decorators/roles.decorator';
import { UserService } from './user.service';
import { Get, Controller, Param } from '@nestjs/common';

@Controller('keycloak/users')
export class UserController {
    constructor(protected readonly userService: UserService) {}

    @Roles(Role.TEACHER)
    @Get()
    async users(): Promise<UserDto[]> {
        return this.userService.getUsers();
    }

    @Roles(Role.TEACHER)
    @Get('role/:role')
    async usersByRole(@Param('role') role: Role): Promise<UserDto[]> {
        return this.userService.getUsersByRole(role);
    }

    @Roles(Role.TEACHER)
    @Get(':id')
    async user(@Param('id') userId: string): Promise<UserDto> {
        return this.userService.getUser(userId);
    }
}
