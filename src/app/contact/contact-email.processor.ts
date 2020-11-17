import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { mail } from '../_helpers/mail';


import {
    CONTACT_EMAIL_QUEUE,
    CONTACT_EMAIL_SEND
} from './contact.constants';

@Processor(CONTACT_EMAIL_QUEUE)
export class ContactEmailProcessor {

    private logger = new AppLogger(ContactEmailProcessor.name);

    constructor(
    ) {}

    @Process(CONTACT_EMAIL_SEND)
    public async onContactEmailSend(job: Job) {
        this.logger.debug('[onContactEmailSend] Send contact email');
        const { user, email } = job.data;
        await mail(
            'contact',
            'jakub.swacha@usz.edu.pl',
            {
                app_name: config.name,
                app_host: config.host,
                app_port: config.port,
                ui_base_url: config.ui_base_url,
                user,
                email
            }
        );
        this.logger.debug('[onContactEmailSend] Contact email sent');
    }
}
