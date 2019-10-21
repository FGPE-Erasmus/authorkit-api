import { UserContextAccess } from './user-context-access.interface';

export type UserContextAccessEvaluator = () => UserContextAccess | Promise<UserContextAccess>;
