import { Injectable, NestMiddleware, Inject } from '@nestjs/common';

import { ProjectService } from './project.service';

@Injectable()
export class ProjectMiddleware implements NestMiddleware {

    constructor(protected readonly projectService: ProjectService) {
    }

    async use(req: any, res: any, next: () => void): Promise<void> {
        let project_id = req.params.id || req.body.id;
        if (!project_id) { // case nested resource
            project_id = req.params.project_id || req.query.project_id || req.body.project_id;
            if (!project_id) {
                return next();
            }
        }
        req.project = await this.projectService.findOne(project_id);
        next();
    }
}
