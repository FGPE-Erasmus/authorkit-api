import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithRequest, Profile, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            clientID: '',
            clientSecret: '',
            callbackURL: '',
            passReqToCallback: true,
            scope: ['profile', 'email'],
        } as StrategyOptionsWithRequest);
    }

    async validate(request: any, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) {
        if (!profile) {
            done(new BadRequestException(), null);
        }
        // Get google account information
        const name = profile.displayName;
        const email = profile.emails[0].value;
        // Add your verify logic here...

        // if error, provide an error info
        done(new InternalServerErrorException(), null);
        // if verified, pass user info
        done(undefined, user);
    }
}