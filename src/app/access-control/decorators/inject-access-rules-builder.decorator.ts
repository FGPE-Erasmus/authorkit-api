import { Inject } from '@nestjs/common';
import { ACCESS_RULES_BUILDER_TOKEN } from '../constants';

/**
 *  Get access to the underlying `AccessRulesBuilder` Object
 */
export const InjectAccessRulesBuilder = () => Inject(ACCESS_RULES_BUILDER_TOKEN);
