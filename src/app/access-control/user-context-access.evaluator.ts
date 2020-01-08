import { IUserContextAccess } from './user-context-access.interface';

export type UserContextAccessEvaluator = () => IUserContextAccess | Promise<IUserContextAccess>;
