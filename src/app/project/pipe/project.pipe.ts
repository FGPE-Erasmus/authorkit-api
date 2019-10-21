import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ProjectService } from '../project.service';
import { ProjectEntity } from '../entity';

@Injectable()
export class ProjectPipe implements PipeTransform<any> {

    constructor(private readonly projectService: ProjectService) {
    }

    async transform(projectId: string, metadata: ArgumentMetadata): Promise<ProjectEntity> {
        return this.projectService.findOne(projectId);
    }
}
