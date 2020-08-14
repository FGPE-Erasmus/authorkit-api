import { ApiBody } from '@nestjs/swagger';

export const ApiFile = (opts: { name: string, required: boolean } = { name: 'file', required: false }): MethodDecorator => (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
) => {
    ApiBody({
        schema: {
            type: 'object',
            properties: {
                [opts.name]: {
                    type: 'string',
                    format: 'binary',
                    nullable: !opts.required
                }
            }
        }
    })(target, propertyKey, descriptor);
};
