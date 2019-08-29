import * as path from 'path';
import { readdirSync } from 'fs';

import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import * as Email from 'email-templates';

import { ConfigService } from 'modules/config';

const templatesDir = path.join(__dirname, '../../emails');

@Injectable()
export class MailService {

    transporter: Email;

    constructor(
        private readonly configService: ConfigService,
        /* private readonly i18n: I18nService, */
    ) {
        // create email transporter
        this.transporter = new Email({
            message: {
                from: this.configService.get('MAIL_SENDER'),
            },
            send: true,
            transport: {
                host: this.configService.get('MAIL_HOST'),
                port: this.configService.get('MAIL_PORT'),
                ssl: this.configService.get('MAIL_SSL'),
                tls: this.configService.get('MAIL_TLS'),
                auth: {
                    user: this.configService.get('MAIL_USER'),
                    pass: this.configService.get('MAIL_PASSWORD'),
                },
            },
            htmlToText: false,
            views: { root: templatesDir },
            juice: true,
            juiceResources: {
                preserveImportant: true,
                webResources: {
                    relativeTo: templatesDir,
                    images: true,
                },
            },
            i18n: {},
        });
    }

    async sendEmail(template: string, recipient: string, values: object): Promise<boolean> {

        return this.transporter.send({
            template,
            message: {
                to: recipient,
            },
            locals: values,
        });
    }
}
