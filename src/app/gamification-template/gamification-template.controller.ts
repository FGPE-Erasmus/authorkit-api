import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('gamification-template')
@Controller('gamification-template')
export class GamificationTemplateController {
    constructor() {}

    @Get('test')
    async get() {
        return {
            status: 'OK'
        };
    }
}

