(function (global) {
    const API_BASE = 'http://api.smr.local';

    async function fetchJSON(url) {
        const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!r.ok) {
            const text = await r.text().catch(() => '');
            throw new Error(url + ' -> ' + r.status + ' ' + r.statusText + (text ? (' | ' + text) : ''));
        }
        return r.json();
    }

    const Api = {
        listTypes: () => fetchJSON(`${API_BASE}/types`),
        listAircraftsByLiveries: (liveryId) => fetchJSON(`${API_BASE}/liveries/code/${liveryId}/aircrafts`),
        listLiveries: (typeId) => fetchJSON(`${API_BASE}/liveries/type/${typeId}`),
        listEnvironments: () => fetchJSON(`${API_BASE}/environments`),
        getAircraft: (aircraftId) => fetchJSON(`${API_BASE}/aircrafts/${aircraftId}`),
        listViews: () => fetchJSON(`${API_BASE}/views`),
    };

    global.Api = Api;
})(window);
