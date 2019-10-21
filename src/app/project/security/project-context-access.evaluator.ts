import { RequestContext } from '../../_helpers';
import { UserContextAccessEvaluator } from '../../access-control/user-context-access.evaluator';
import { UserContextAccess } from '../../access-control/user-context-access.interface';

export const evaluateUserContextAccess: UserContextAccessEvaluator =
    async function (): Promise<UserContextAccess> {
        const req = RequestContext.currentRequest();
        const user = req['user'];
        if (!user || !user.permissions) {
            return {
                role: [],
                owner: false
            };
        }
        let owner = false;
        const project = req['project'];
        if (project) {
            owner = project.owner_id === user.id;
        }
        const permissions = await user.permissions;
        const permission = permissions.find((perm) => perm.project_id === project.id);
        if (!permission) {
            return {
                role: [],
                owner
            };
        }
        return {
            role: permission.role,
            owner
        };
    };
