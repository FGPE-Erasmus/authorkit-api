import { LoggerService } from '@nestjs/common';
import { DateTime } from 'luxon';
import { createLogger, transports, Logger as WsLogger, format } from 'winston';

import { config } from '../config';

const { combine, timestamp, label, printf } = format;

// tslint:disable-next-line: no-shadowed-variable
const humanReadableFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}] ${label} - ${message}`;
});

export class AppLogger implements LoggerService {
    private logger: WsLogger;

    constructor(lbl?: string) {
        this.logger = createLogger({
            format: combine(
                label({ label: lbl }),
                timestamp(),
                humanReadableFormat
            ),
            transports: [
                new (transports.Console)({
                    level: config.logger.level,
                    handleExceptions: true
                })
            ],
            exitOnError: false
        });
    }

    error(message: string, trace: string) {
        this.logger.error(message, trace);
    }

    warn(message: string) {
        this.logger.warn(message);
    }

    log(message: string) {
        this.logger.info(message);
    }

    verbose(message: string) {
        this.logger.verbose(message);
    }

    debug(message: string) {
        this.logger.debug(message);
    }

    silly(message: string) {
        this.logger.silly(message);
    }
}
