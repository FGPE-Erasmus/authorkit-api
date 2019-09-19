import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from '../../_helpers/facebook/facebook-token.strategy';
import { config } from '../../../config';
import { FacebookProfile } from '../interfaces/facebook-profile.interface';

@Injectable()
export class FacebookTokenStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            clientID: config.social.facebook.app_id,
            clientSecret: config.social.facebook.app_secret
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: FacebookProfile) {
        return profile;
    }
}
