import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { mail } from '../_helpers/mail';
import { createToken } from '../auth/jwt';


import {
    USER_EMAIL_QUEUE,
    USER_EMAIL_REGISTER,
    USER_EMAIL_REGISTER_VERIFY,
    USER_EMAIL_PASSWORD_NEW,
    USER_EMAIL_PASSWORD_RESET
} from './user.constants';

@Processor(USER_EMAIL_QUEUE)
export class UserEmailProcessor {

    private logger = new AppLogger(UserEmailProcessor.name);

    constructor(
    ) { }

    @Process(USER_EMAIL_REGISTER)
    public async onUserEmailRegister(job: Job) {
        this.logger.debug('[onUserEmailRegister] Send verification email');
        const { user } = job.data;
        const token = createToken(user.id.toString(), config.auth.verify.timeout, config.auth.verify.secret);
        await mail(
            'email-verification',
            user.email,
            {
                app_name: config.name,
                app_host: config.host,
                app_port: config.port,
                ui_base_url: config.ui_base_url,
                firstname: user.first_name,
                lastname: user.last_name,
                token
            }
        );
        this.logger.debug('[onUserEmailRegister] Verification email sent');
    }

    @Process(USER_EMAIL_REGISTER_VERIFY)
    public async onUserEmailRegisterVerify(job: Job) {
        this.logger.debug('[onUserEmailRegisterVerify] Send welcome email');
        const { user } = job.data;
        await mail(
            'welcome',
            user.email,
            {
                app_name: config.name,
                app_host: config.host,
                app_port: config.port,
                ui_base_url: config.ui_base_url,
                firstname: user.first_name,
                lastname: user.last_name
            }
        );
        this.logger.debug('[onUserEmailRegisterVerify] Welcome email sent');
    }

    @Process(USER_EMAIL_PASSWORD_RESET)
    public async onUserEmailPasswordReset(job: Job) {
        this.logger.debug('[onUserEmailPasswordReset] Send password reset instruction email');
        const { user } = job.data;
        const token = createToken(user.id.toString(), config.auth.password_reset.timeout, config.auth.password_reset.secret);
        await mail(
            'reset-password',
            user.email,
            {
                app_name: config.name,
                app_host: config.host,
                app_port: config.port,
                ui_base_url: config.ui_base_url,
                firstname: user.first_name,
                lastname: user.last_name,
                token
            }
        );
        this.logger.debug('[onUserEmailPasswordReset] Password reset email sent');
    }

    @Process(USER_EMAIL_PASSWORD_NEW)
    public async onUserEmailPasswordNew(job: Job) {
        this.logger.debug('[onUserEmailPasswordNew] Send password new email for user ${user.email}');
        const { user } = job.data;
        await mail(
            'new-password',
            user.email,
            {
                app_name: config.name,
                app_host: config.host,
                app_port: config.port,
                ui_base_url: config.ui_base_url,
                firstname: user.first_name,
                lastname: user.last_name
            }
        );
        this.logger.debug('[onUserEmailPasswordNew] Password new email sent');
    }
}
