import { Injectable, NestMiddleware, Inject } from '@nestjs/common';

import { ProjectService } from '../../project/project.service';
import { ExerciseService } from '../exercise.service';

/**
 * Middleware finds the related project and adds it to the request.
 */
@Injectable()
export class TestSetContextMiddleware implements NestMiddleware {

    constructor(
        protected readonly exerciseService: ExerciseService,
        protected readonly projectService: ProjectService) {
    }

    async use(req: any, res: any, next: () => void): Promise<void> {
        const exercise_id = req.params.exercise_id || req.query.exercise_id || req.body.exercise_id;
        if (exercise_id) {
            const exercise = await this.exerciseService.findOne(exercise_id, {
                select: ['id', 'project_id']
            });
            if (exercise) {
                req.project = await this.projectService.findOne({
                    where: { id: exercise.project_id }
                });
                return next();
            }
        }
        const project_id = req.params.project_id || req.query.project_id || req.body.project_id;
        if (!project_id) { // project id not filled
            return next();
        }
        req.project = await this.projectService.findOne(project_id);
        next();
    }
}
