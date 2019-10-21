import { Module, DynamicModule, Global, Abstract, Type } from '@nestjs/common';

import { AccessRulesBuilder } from './access-rules.builder';
import { ACCESS_RULES_BUILDER_TOKEN } from './constants';
import { ACOptions } from './ac-options.interface';

@Global()
@Module({})
export class AccessControlModule {

    /**
     * Register a pre-defined roles
     * @param {AccessRulesBuilder} rules list containing the access grant
     * @param {ACOptions} options  configurable options definitions. See the structure of this object in the examples.
     */
    public static forRoles(rules: AccessRulesBuilder, options?: ACOptions): DynamicModule {

        return {
            module: AccessControlModule,
            controllers: [
            ],
            providers: [
                {
                    provide: ACCESS_RULES_BUILDER_TOKEN,
                    useValue: rules
                }
            ],
            exports: [
                {
                    provide: ACCESS_RULES_BUILDER_TOKEN,
                    useValue: rules
                }
            ]
        };
    }

    public static forRootAsync(options: {
        inject?: Array<Type<any> | string | symbol | Abstract<any> | Function>,
        useFactory: (...args: any) => AccessRulesBuilder | Promise<AccessRulesBuilder>
    }): DynamicModule {

        const provider = {
            provide: ACCESS_RULES_BUILDER_TOKEN,
            useFactory: options.useFactory,
            inject: options.inject || []
        };

        return {
            module: AccessControlModule,
            providers: [
                provider
            ],
            exports: [
                provider
            ]
        };
    }
}
