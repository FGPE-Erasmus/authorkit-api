import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Command, Positional } from 'nestjs-command';
import faker from 'faker';

import { AppLogger } from '../app.logger';
import { UserService } from '../user/user.service';
import { ProjectEntity, ProjectStatus } from './entity';
import { ProjectService } from './project.service';
import { Repository } from 'typeorm';

@Injectable()
export class ProjectCommand {

    private logger = new AppLogger(ProjectCommand.name);

    constructor(
        // @InjectRepository(ProjectEntity) private readonly projectRepository: Repository<ProjectEntity>
    ) {
        faker.locale = 'en_US';
    }

    @Command({ command: 'create:project [amount]', describe: 'create random fake projects' })
    public async create(@Positional({ name: 'amount' }) amount): Promise<void> {
        /* amount = parseInt(amount || 50, 10);
        this.logger.debug(`[create] execute for amount ${amount}!`);

        this.logger.debug(`[create] fetch faked users`);
        const users = await this.userService.findAll({ where: { provider: { eq: 'faker' } } });
        const usersIds = users.map(user => user.id.toString());

        this.logger.debug(`[create] delete from project everything whose owner has "faker" provider`);
        await this.projectRepository.remove({ owner: { $in: usersIds } });

        const projects: ProjectEntity[] = [];
        for (let i = 0; i < amount; i++) {
            const project: ProjectEntity = {
                name: faker.random.words(2),
                description: faker.lorem.paragraph(faker.random.number({ max: 3, min: 1 })),
                owner: faker.random.arrayElement(usersIds),
                is_public: faker.random.boolean(),
                status: faker.random.arrayElement(Object.getOwnPropertyNames(ProjectStatus)),
                repo_owner: faker.internet.userName(faker.name.firstName(), faker.name.lastName()),
                repo_name: faker.random.alphaNumeric()
            } as any;
            projects.push(project);
        }

        this.logger.debug(`[create] create ${amount} random projects with owner from a "faker" provider`);

        const savedProjects = await this.projectService.createMany(null, projects);

        this.logger.debug(`[create] done!`); */
    }
}
