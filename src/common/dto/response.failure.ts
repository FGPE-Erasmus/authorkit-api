import { IResponse } from 'common/interfaces/response.interface';

export class ResponseFailure implements IResponse {
    constructor(status: number, message: string, error?: any) {
        this.status = status;
        this.message = message;
        this.error = error;
    }

    status: number;
    message: string;
    data: any;
    error: any;
}
