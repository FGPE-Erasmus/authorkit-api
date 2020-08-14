import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus} from '@nestjs/common';
import { Request, Response } from 'express';

import {AppLogger} from '../../app.logger';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private logger = new AppLogger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus ? exception.getStatus() : HttpStatus.BAD_REQUEST;

        this.logger.error(`[${exception.name}] ${exception.message}`, exception.stack);

        response
            .status(status)
            .json({
                statusCode: status,
                ...exception.getResponse() as object,
                timestamp: new Date().toISOString(),
                path: request.url
            });
    }
}
