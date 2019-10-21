import { SetMetadata } from '@nestjs/common';

import { UserContextAccessEvaluator } from '../user-context-access.evaluator';

/**
 * Define an evaluator to get the user access in the context of
 * the request.
 */
export const UseContextAccessEvaluator =
    (accessEvaluator: UserContextAccessEvaluator) => SetMetadata('access-evaluator', accessEvaluator);
