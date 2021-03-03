import {MockAdapter} from "../index";
import Axios from "axios";
import {pathToRegexp} from "path-to-regexp";

describe("axios mock",() => {
    const mock = (path: string) => {
        const instance = Axios.create({});
        const adapter = new MockAdapter(instance);
        adapter.onRequest({url: path}).reply({
            data: 'ddd'
        });
        return {
            instance,adapter
        }
    }
    it('can mock a simplest request', async function () {
        const {instance} = mock('/api');
        const res = await instance.get('/api')
        expect(res.data).toEqual("ddd");
    });
    it('can mock url with variable', async function () {
        const {instance} = mock('/apis/:test');
        const res = await instance.request({
            url: '/apis/22'
        });
        expect(res.data).toEqual('ddd');
        expect((await instance.get('/apis/333')).data).toEqual('ddd');
    });
    it('replyOnce should work, and when the replyOnce stack is empty && without default reply response,it should throw', async function () {
        const instance = Axios.create({});
        const adapter = new MockAdapter(instance);
        adapter.onRequest({url: '/api'}).replyOnce({data: 'ddd'}).replyOnce({data: 'ddd2'})
        const res1 = await instance.get('/api');
        const res2 = await instance.get('/api');
        expect(res1.data).toEqual('ddd');
        expect(res2.data).toEqual('ddd2');
        await expect(instance.get('/api')).rejects.toThrow();
        adapter.findRequest({url: '/api'}).responseHandler.reply({data: "str"})
        const res3 = await instance.get('/api');
        expect(res3.data).toEqual('str');
    });
    it('can mock rejected value ', async function () {
        const instance = Axios.create({});
        const adapter = new MockAdapter(instance);
        adapter.onRequest({url: '/api'}).reply({
            status: 400,
            statusText: 'bad request'
        });
        expect(() => instance.get('/api')).rejects.toEqual(expect.objectContaining({
            status: 400,
            statusText: 'bad request'
        }));
    });
    it('will save request history', async function () {
        const {instance,adapter} =mock('/api')
        await instance.get('/api',{
            params: {
                name: 'params'
            }
        })
        await instance.request({
            url: '/api',
            data: {
                name: 'data'
            }
        });
        const history = adapter.findRequest({url: '/api'}).history;
        expect(history[0].request.params).toEqual({name: 'params'})
        expect(history[0].response.data).toEqual('ddd')
        expect(history[1].request.data).toEqual(JSON.stringify({name: 'data'}))
        expect(history[1].response.data).toEqual('ddd')
    });
    test('it can save latest request config ', async () => {
        const {instance, adapter} = mock('/api')
        const requestItem = adapter.findRequest({url: '/api'})
        await instance.get('/api', {
            params: {
                name: 'params'
            }
        })
        expect(requestItem.latestConfig.params).toEqual({name: 'params'})
        await instance.request({
            url: '/api',
            data: {
                name: 'data'
            }
        });
        expect(requestItem.latestConfig.data).toEqual(JSON.stringify({name: 'data'}));
    });
    test('support restful api',async () => {
        const instance = Axios.create({});
        const adapter = new MockAdapter(instance);
        adapter.onRequest({
            url: '/xxx',
            method: "get"
        }).reply({
            data: 'get'
        });
        adapter.onRequest({
            url: '/xxx',
            method: 'post'
        }).reply({
            data: 'post'
        });
        const post = await instance.request({
            url: '/xxx',
            method: 'POST'
        })
        expect(post.data).toEqual('post')
        const get = await instance.request({
            url: '/xxx',
        });
        expect(get.data).toEqual('get');
    })
    test('should diff similar url',async () => {
        const instance = Axios.create({});
        const adapter = new MockAdapter(instance);
        adapter.onRequest({
            url: '/contract/:contractId/mifiId/:mifiId',
        }).reply({data: '2'});
        adapter.onRequest({
            url: '/contract/getAllRuleIdInfos/mifiId/:mifiId',
        }).reply({data: '1'})
        // /contract/85309/mifiId/308742 will only match /contract/:contractId/mifiId/:mifiId
        // so it works
        const resB = await instance.request({
            url: '/contract/85309/mifiId/308742'
        })
        expect(resB.data).toEqual(2);
        // /contract/getAllRuleIdInfos/mifiId/6666 will match /contract/getAllRuleIdInfos/mifiId/:mifiId
        // and /contract/:contractId/mifiId/:mifiId
        // so we use string similarity algorithm to pick one
        const resA = await instance.request({
            url: '/contract/getAllRuleIdInfos/mifiId/6666'
        })
        expect(resA.data).toEqual(1);
        expect(JSON.parse("2")).toEqual(2)
    })
})
