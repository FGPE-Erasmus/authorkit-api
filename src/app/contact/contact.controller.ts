import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { AppLogger } from '../app.logger';
import { User } from '../_helpers/decorators';
import { MessageDto } from './dto/message.dto';
import { ContactService } from './contact.service';


@Controller('contact')
@ApiTags('contact')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class ContactController {

    private logger = new AppLogger(ContactController.name);

    constructor(
        readonly service: ContactService
    ) {
    }

    @Post('send-message')
    async sendMessage(
        @User() user: any,
        @Body() dto: MessageDto
    ) {
        return this.service.sendMessage(user, dto);
    }
}
