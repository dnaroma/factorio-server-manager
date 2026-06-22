import client from "../client";

export default {
    factorioVersion: async () => {
        const response = await client.get('/api/server/facVersion');
        return response.data;
    },
    installStatus: async () => {
        const response = await client.get('/api/server/install');
        return response.data;
    },
    install: async (version) => {
        const response = await client.post('/api/server/install', {version});
        return response.data;
    },
    lifecycle: async () => {
        const response = await client.get('/api/server/lifecycle');
        return response.data;
    },
    updateLifecycle: async (lifecycle) => {
        const response = await client.post('/api/server/lifecycle', lifecycle);
        return response.data;
    },
    status: async () => {
        const response = await client.get('/api/server/status');
        return response.data;
    },
    stop: async () => {
        const response = await client.get('/api/server/stop');
        return response.data;
    },
    start: async (ip, port, savefile) => {
        const response = await client.post('/api/server/start', {
            bindip: ip,
            savefile,
            port
        });
        return response.data;
    },
    kill: async () => {
        const response = await client.get('/api/server/kill');
        return response.data;
    }
}
