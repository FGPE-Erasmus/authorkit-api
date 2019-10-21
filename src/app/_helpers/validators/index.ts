import { validate, ValidatorOptions } from 'class-validator';
import { HttpException, HttpStatus } from '@nestjs/common';

import { config } from '../../../config';
import { ExtendedEntity } from '..';

export * from './conditionals.validator';
export * from './not-sibling-of.validator';
export * from './password.validator';
export * from './github-reponame.validator';
export * from './github-username.validator';

export async function validateEntity<T extends ExtendedEntity>(entity: T, options?: ValidatorOptions) {
    const errors = await validate(entity, { ...config.validator.options, ...options } as ValidatorOptions);
    if (errors.length) {
        throw new HttpException({
            message: errors,
            error: 'Validation'
        }, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
