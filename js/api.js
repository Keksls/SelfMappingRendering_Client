(function (global) {
    var API_BASE = 'nourl';
    // read apiBase from apiurl.txt file if exists
    fetch('StreamingAssets/apiurl.txt').then(r => r.text()).then(text => {
        const url = text.trim();
        if (url) {
            console.log('Using API URL from apiurl.txt:', url);
            API_BASE = url;
        }
    }).catch(() => { console.log('apiurl.txt not found, using default API URL'); });

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
        getViewPrevURI: (viewID) => `${API_BASE}/views/${viewID}/prev`,
    };

    global.Api = Api;
})(window);
