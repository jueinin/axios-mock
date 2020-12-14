import {AxiosResponse} from "axios";
const defaultRes:AxiosResponse = {
    data: null,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    request: {},
}
export const default404Res = {
    data: null,
    status: 404,
    statusText: 'OK',
    headers: {},
    config: {},
    request: {},
}
export class ResponseHandler {
    private replyRes: AxiosResponse;
    private replyOnceList: AxiosResponse[] = [];
    reply = <Res>(res: Partial<AxiosResponse<Res>>) => {
        this.replyRes = Object.assign({}, defaultRes, res);
        return this;
    }
    replyOnce= <Res>(res: Partial<AxiosResponse<Res>>) => {
        this.replyOnceList.push(Object.assign({}, defaultRes, res));
        return this;
    }
    exec = () => {
        const res = this.replyOnceList.length > 0 ? this.replyOnceList.shift() : this.replyRes;
        if (!res) {
            throw new Error(`you should use reply method to create a default response!`);
        }
        return new Promise<AxiosResponse>((resolve, reject) => {
            const statusCode: number = res.status;
            if (statusCode >= 200 && statusCode < 300) {
                resolve(res);
            } else {
                reject(res);
            }
        })
    }
}
