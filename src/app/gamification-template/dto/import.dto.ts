export class TemplateDto {
    project_id: string;
    template_id: string;
    exercise_ids: string[];
}

export class UploadDto {
    project_id: string;
    gl_id: string;
    gl_name: string;
}

export class ImportDto {
    gl_name: string;
}
