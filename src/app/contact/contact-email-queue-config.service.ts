import { Injectable } from '@nestjs/common';
import { BullModuleOptions, BullOptionsFactory } from '@nestjs/bull';

import { config } from '../../config';

@Injectable()
export class ContactEmailQueueConfigService implements BullOptionsFactory {
    createBullOptions(): BullModuleOptions {
        return {
            redis: {
                host: config.queueing.host,
                port: config.queueing.port
            },
            defaultJobOptions: {
                attempts: 20,
                backoff: {
                    type: 'exponential',
                    delay: 5000
                },
                removeOnComplete: true
            }
        };
    }
}
