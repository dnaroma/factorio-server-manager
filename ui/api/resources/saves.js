import client from "../client";

export default {
    list: async (latest) => {
        const response = await client.get('/api/saves/list', {
            params: {
                latest
            }
        });
        return response.data;
    },
    delete: async (save) => {
        const response = await client.get(`/api/saves/rm/${save.name}`);
        return response.data;
    },
    backups: async () => {
        const response = await client.get('/api/saves/backups');
        return response.data;
    },
    backup: async (save) => {
        const response = await client.post(`/api/saves/backup/${save.name}`);
        return response.data;
    },
    restore: async (backup, targetName) => {
        const response = await client.post('/api/saves/restore', {
            backup_name: backup.name,
            target_name: targetName
        });
        return response.data;
    },
    rename: async (save, newName) => {
        const response = await client.post('/api/saves/rename', {
            name: save.name,
            new_name: newName
        });
        return response.data;
    },
    duplicate: async (save, newName) => {
        const response = await client.post('/api/saves/duplicate', {
            name: save.name,
            new_name: newName
        });
        return response.data;
    },
    create: async (name) => {
        const response = await client.get(`/api/saves/create/${name}`);
        return response.data;
    },
    upload: async file => {
        let formData = new FormData();
        formData.append("savefile", file);

        const response = await client.post(`/api/saves/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    },
    mods: async save => {
        const response = await client.post("/api/saves/mods", {
            saveFile: save
        });
        return response.data;
    }
}
