import { sign, verify } from 'jsonwebtoken';

import { config } from '../../../config';
import { DeepPartial } from '../../_helpers/database/deep-partial';
import { UserEntity } from '../../user/entity/user.entity';
import { TokenDto } from '../dto/token.dto';

export async function createAuthToken({ id }: DeepPartial<UserEntity>) {
    const expiresIn = config.auth.access.timeout;
    const refreshTokenExpiresIn = config.auth.refresh.timeout;
    const accessToken = createToken(id, expiresIn, config.auth.access.secret);
    const refreshToken = createToken(id, config.auth.refresh.timeout, config.auth.refresh.secret);
    return {
        expiresIn,
        refreshTokenExpiresIn,
        accessToken,
        refreshToken
    };
}

export function createToken(id: string, expiresIn: number, secret: string) {
    return sign({ id }, secret, {
        expiresIn,
        audience: config.auth.domain,
        issuer: config.uuid
    });
}

export async function verifyToken(token: string, secret: string): Promise<TokenDto> {
    return new Promise((resolve, reject) => {
        verify(token, secret, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            resolve(decoded as TokenDto);
        });
    });
}
