import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../../app.logger';

import { RULE_CMD_CREATE, RULE_CMD_UPDATE, RULE_CMD_DELETE } from './rule.constants';
import { RuleEntity } from './entity/rule.entity';

@Controller()
export class RuleListener {

    private logger = new AppLogger(RuleListener.name);

    constructor() { }

    @MessagePattern({ cmd: RULE_CMD_CREATE })
    public async onRuleCreate(rule: RuleEntity): Promise<void> {
        try {
            this.logger.debug(`[onRuleCreate] Create rule in Github repository`);
            // TODO
            this.logger.debug('[onRuleCreate] Rule created in Github repository');
        } catch (err) {
            this.logger.error(`[onRuleCreate] Rule NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: RULE_CMD_UPDATE })
    public async onRuleUpdate(rule: RuleEntity): Promise<void> {
        try {
            this.logger.debug(`[onRuleUpdate] Update rule in Github repository`);
            // TODO
            this.logger.debug('[onRuleUpdate] Rule updated in Github repository');
        } catch (err) {
            this.logger.error(`[onRuleUpdate] Rule NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: RULE_CMD_DELETE })
    public async onRuleDelete(rule: RuleEntity): Promise<void> {
        try {
            this.logger.debug(`[onRuleDelete] Delete rule in Github repository`);
            // TODO
            this.logger.debug('[onRuleDelete] Rule deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onRuleDelete] Rule NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}

