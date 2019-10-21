import { RequestContext } from '../../_helpers';
import { UserContextAccessEvaluator, UserContextAccess } from '../../access-control';

export const evaluateUserContextAccess: UserContextAccessEvaluator =
    async function (): Promise<UserContextAccess> {
        const req = RequestContext.currentRequest();
        const user = req['user'];
        let user_id = req.params.id || req.body.id;
        if (!user_id) { // case nested resource
            user_id = req.params.user_id || req.query.user_id || req.body.user_id;
            if (!user_id) {
                return {
                    role: [],
                    owner: false
                };
            }
        }
        return {
            role: [],
            owner: user.id.toString() === user_id
        };
    };
