import { Injectable, NestMiddleware } from '@nestjs/common';

import { ProjectService } from './project.service';

/**
 * Middleware finds the project and adds it to the request.
 */
@Injectable()
export class ProjectContextMiddleware implements NestMiddleware {

    constructor(private readonly projectService: ProjectService) {}

    async use(req: any, res: any, next: () => void): Promise<void> {
        const project_id = req.params.id || req.query.id || req.body.id;
        if (!project_id) {
            return next();
        }
        req.project = await this.projectService.findOne(project_id);
        next();
    }
}
