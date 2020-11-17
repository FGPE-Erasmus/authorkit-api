import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { ContactController } from './contact.controller';
import { ContactEmailQueueConfigService } from './contact-email-queue-config.service';
import { CONTACT_EMAIL_QUEUE } from './contact.constants';
import { ContactService } from './contact.service';
import { ContactEmailProcessor } from './contact-email.processor';

@Module({
    controllers: [ContactController],
    providers: [
        ContactService,
        ContactEmailQueueConfigService,
        ContactEmailProcessor
    ],
    imports: [
        BullModule.registerQueueAsync({
            name: CONTACT_EMAIL_QUEUE,
            useClass: ContactEmailQueueConfigService
        })
    ],
    exports: [ContactService, ContactEmailQueueConfigService]
})
export class ContactModule {
}
