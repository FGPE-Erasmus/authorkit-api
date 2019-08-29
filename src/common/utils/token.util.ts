import { randomBytes } from 'crypto';

export function generateToken({ type = 'hex', byteLength = 48 } = {}): Promise<string> {
    return new Promise((resolve, reject) => {
        randomBytes(byteLength, (err, buffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(buffer.toString(type));
            }
        });
    });
}
