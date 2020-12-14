import {MockAdapter} from "../index";
import Axios from "axios";

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
})