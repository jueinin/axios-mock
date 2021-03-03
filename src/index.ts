import {AxiosAdapter, AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import {pathToRegexp} from 'path-to-regexp'
import {default404Res, ResponseHandler} from "./ResponseHandler";
export {ResponseHandler}
const stringSimilarity = require('string-similarity');
// 每个请求的地址对应一个requestItem。请求后保存请求和响应的记录
export class RequestItem {
    config: AxiosRequestConfig
    latestConfig: AxiosRequestConfig
    responseHandler: ResponseHandler = new ResponseHandler()
    history: {
        request: AxiosRequestConfig,
        response: AxiosResponse;
    }[]=[];
    constructor(config:AxiosRequestConfig) {
        this.config = config;
        this.latestConfig = config;
    }
    exec= async (config: AxiosRequestConfig) => {
        this.latestConfig = config;
        const res = await this.responseHandler.exec()
        this.history.push({
            request: config,
            response: res
        });
        return res
    }
}
export class MockAdapter{
    private originAxiosInstance: AxiosInstance;
    private originAxiosInstanceAdapter: AxiosAdapter
    private requestList: RequestItem[] = [];
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
        const targetMethod: string = config.method?.toLowerCase() || 'get';
        const requestList = this.requestList.filter(value => {
            const originUrl = value.config.url + (value.config.baseURL || '');
            if (typeof originUrl === "string" && originUrl.includes(':')) {
                // this is path variable
                const regex: RegExp = pathToRegexp(originUrl);
                return regex.test(targetUrl)
            } else {
                return targetUrl === originUrl
            }
        });
        if (requestList.length <= 1) {
            return requestList[0]
        }
        // we should diff similar url.such as /a/:id1/b/:id2  and /a/b/c/:id2
        if (!requestList.every(value => value.config.url === requestList[0].config.url)) {
            const bestMatchUrl = stringSimilarity.findBestMatch(targetUrl, requestList.map(value => value.config.url)).bestMatch.target;
            return requestList.find(value => value.config.url === bestMatchUrl)
        }
        // support RESTful API
        return requestList.find(item => {
            const method = item.config.method?.toLowerCase() || 'get';
            return method === targetMethod
        });
    }
    private adapter:AxiosAdapter = (config: AxiosRequestConfig) => {
        const requestItem = this.findRequest(config);
        if (!requestItem) {
            return Promise.resolve(default404Res)
        }
        return requestItem.exec(config)
    }
    // onRequest建立一个以请求域名为唯一ID的requestItem，
    // 同一个域名下可以有多个请求响应对
    onRequest = (config: AxiosRequestConfig) => {
        const requestItem = new RequestItem(config)
        this.requestList.push(requestItem);
        return requestItem.responseHandler;
    };
}
