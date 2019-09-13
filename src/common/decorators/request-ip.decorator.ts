import { createParamDecorator } from '@nestjs/common';

export const RequestIp = createParamDecorator((data, req) => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
});
