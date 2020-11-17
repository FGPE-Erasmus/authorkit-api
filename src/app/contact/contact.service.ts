import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { UserEntity } from '../user/entity';
import { MessageDto } from './dto/message.dto';
import { CONTACT_EMAIL_QUEUE, CONTACT_EMAIL_SEND } from './contact.constants';

@Injectable()
export class ContactService {
    constructor(
        @InjectQueue(CONTACT_EMAIL_QUEUE) protected readonly contactQueue: Queue
    ) {}

    async sendMessage(user: UserEntity, payload: MessageDto): Promise<any> {
        return await this.contactQueue.add(CONTACT_EMAIL_SEND, {
            user,
            email: payload
        });
    }
}
