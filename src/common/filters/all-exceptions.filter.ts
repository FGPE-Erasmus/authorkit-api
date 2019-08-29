import {
    Catch,
    HttpStatus,
    HttpException,
    ExceptionFilter,
    ArgumentsHost,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = (exception instanceof HttpException) ?
            exception.getStatus() :
            HttpStatus.INTERNAL_SERVER_ERROR;

        response
            .status(status)
            .json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
            });
    }
}
