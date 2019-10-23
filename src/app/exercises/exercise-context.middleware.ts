import { Injectable, NestMiddleware, Inject } from '@nestjs/common';

import { ProjectService } from '../project/project.service';
import { ExerciseService } from './exercise.service';

/**
 * Middleware finds the related project and adds it to the request.
 */
@Injectable()
export class ExerciseContextMiddleware implements NestMiddleware {

    constructor(
        protected readonly exerciseService: ExerciseService,
        protected readonly projectService: ProjectService) {
    }

    async use(req: any, res: any, next: () => void): Promise<void> {
        // let exercise_id = req.params.id || req.query.id || req.body.id;
        const project_id = req.params.project_id || req.query.project_id || req.body.project_id;
        if (!project_id) { // project id not filled
            return next();
        }
        req.project = await this.projectService.findOne(project_id);
        next();
    }
}
