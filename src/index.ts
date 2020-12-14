import {AxiosAdapter, AxiosInstance, AxiosRequestConfig} from 'axios';
import {pathToRegexp} from 'path-to-regexp'
import {default404Res, ResponseHandler} from "./ResponseHandler";
export {ResponseHandler}
type ListItem = {
    request: AxiosRequestConfig,
    responseHandler: ResponseHandler
}
export class MockAdapter{
    private originAxiosInstance: AxiosInstance;
    private originAxiosInstanceAdapter: AxiosAdapter
    private requestList: ListItem[] = [];
    constructor(axiosInstance: AxiosInstance) {
        this.originAxiosInstance = axiosInstance;
        this.originAxiosInstanceAdapter = axiosInstance.defaults.adapter;
        axiosInstance.defaults.adapter = this.adapter;
    }

    /**
     * @description find the consistent response for request
     * currently we only match url
     * target path can be normal url,url path variable(/:variable)
     * @param config
     */
    findRequest = (config: AxiosRequestConfig) => {
        const targetUrl: string = config.url;
        return this.requestList.find(value => {
            const originUrl = value.request.url + (value.request.baseURL || '');
            if (typeof originUrl === "string" && originUrl.includes(':')) {
                // this is path variable
                const regex:RegExp = pathToRegexp(originUrl);
                return regex.test(targetUrl)
            } else {
                return targetUrl === originUrl
            }
        })
    }
    private adapter:AxiosAdapter = (config: AxiosRequestConfig) => {
        const requestItem = this.findRequest(config);
        if (!requestItem) {
            return Promise.resolve(default404Res)
        }
        return requestItem.responseHandler.exec();
    }

    onRequest = (config: AxiosRequestConfig) => {
        const handler = new ResponseHandler();
        this.requestList.push({
            request: config,
            responseHandler: handler
        });
        return handler;
    };
}