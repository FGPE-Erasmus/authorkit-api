import { Args, Mutation, Parent, Query, ResolveProperty, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { UserService } from './user.service';
import { DeleteUserDto, UpdateUserDto } from './dto';
import { UseGuards } from '@nestjs/common';
import { GraphqlGuard } from '../_helpers/graphql';
import { UserEntity } from './entity';
import { User as CurrentUser } from '../_helpers/graphql/user.decorator';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Resolver('User')
@UseGuards(GraphqlGuard)
export class UserResolver {
    private pubSub = new PubSub();

    constructor(@InjectRepository(UserEntity) protected readonly repository: Repository<UserEntity>) {
    }

    @Query('me')
    async getMe(@CurrentUser() user: UserEntity): Promise<UserEntity> {
        return user;
    }

    @Mutation('deleteUser')
    async delete(@Args('deleteUserInput') args: DeleteUserDto): Promise<UserEntity> {
        const deletedUser = await this.repository.findOne(args.id);
        await this.repository.delete(args.id);
        await this.pubSub.publish('userDeleted', { userDeleted: deletedUser });
        return deletedUser;
    }

    @Mutation('updateUser')
    async update(@CurrentUser() user: UserEntity, @Args('updateUserInput') args: UpdateUserDto): Promise<UserEntity> {
        await this.repository.update(user.id.toString(), args);
        const updatedUser = await this.repository.findOne(user.id);
        await this.pubSub.publish('userUpdated', { userUpdated: updatedUser });
        return updatedUser;
    }

    @Subscription('userCreated')
    userCreated() {
        return {
            subscribe: () => this.pubSub.asyncIterator('userCreated')
        };
    }

    @Subscription('userDeleted')
    userDeleted() {
        return {
            subscribe: () => this.pubSub.asyncIterator('userDeleted')
        };
    }
}
