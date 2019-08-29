import { IResponse } from 'common/interfaces/response.interface';

export class ResponseSuccess implements IResponse {
    constructor(status: number, message: string, data?: any) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    status: number;
    message: string;
    data: any;
    error: any;
}
