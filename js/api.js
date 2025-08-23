(function(global){
    const API_BASE = 'http://api.smr.local';

  async function fetchJSON(url){
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if(!r.ok){
      const text = await r.text().catch(()=>'');
      throw new Error(url + ' -> ' + r.status + ' ' + r.statusText + (text ? (' | ' + text) : ''));
    }
    return r.json();
  }

  const Api = {
    listTypes: () => fetchJSON(`${API_BASE}/types`),
    listFamiliesByType: (typeId) => fetchJSON(`${API_BASE}/types/${typeId}/families`),
    listAircraftsByFamily: (familyId) => fetchJSON(`${API_BASE}/aircrafts/family/${familyId}`),
    listLiveriesByAircraft: (aircraftId) => fetchJSON(`${API_BASE}/aircrafts/${aircraftId}/liveries`),
  };

  global.Api = Api;
})(window);
