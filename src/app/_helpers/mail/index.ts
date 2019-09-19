import { createTransport, SendMailOptions, SentMessageInfo } from 'nodemailer';
import * as Email from 'email-templates';
import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';

import { config } from '../../../config';
import Mail = require('nodemailer/lib/mailer');

export async function mail(template: string, recipient: string, data: any): Promise<SentMessageInfo> {
    const transporter = createTransport({
        host: config.mail.host,
        port: config.mail.port,
        secure: config.mail.secure,
        auth: {
            user: config.mail.user,
            pass: config.mail.password
        }
    });

    const message = renderTemplate(template, data);

    return transporter.sendMail({
        from: config.mail.from,
        to: recipient,
        ...message
    });
}

export function renderTemplate(path: string, data: any): RenderedMessage {

    const email = new Email({
        /* message: {
            from: config.mail.from
        },
        send: true,
        transport: {
            host: config.mail.host,
            port: config.mail.port,
            ssl: config.mail.ssl,
            tls: config.mail.tls,
            auth: {
                user: config.mail.user,
                pass: config.mail.password
            }
        }, */
        htmlToText: false,
        views: { root: config.mail.templatesDir },
        juice: true,
        juiceResources: {
            preserveImportant: true,
            webResources: {
                relativeTo: config.mail.templatesDir,
                images: true
            }
        },
        i18n: {}
    });

    /* const loader = new TwingLoaderFilesystem(config.assetsPath);
    const twing = new TwingEnvironment(loader);
    return twing.render(path, data); */
    return email.renderAll(path, {
        ...data,
        __: function (key: string) {
            return '-- ' + key + '(' + data.locale + ') --';
        }
    });
}

export class RenderedMessage {
    subject: string;
    text: string;
    html: string;
}
