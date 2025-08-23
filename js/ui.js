// UI binding + Unity bridge (prod-ready)
(function(){
  const GAMEOBJECT_NAME = 'Engine';
  document.getElementById('goNameLabel') && (document.getElementById('goNameLabel').textContent = GAMEOBJECT_NAME);

  const $console = document.getElementById('console');
  function appendLog(text, cls=''){ const p=document.createElement('div'); p.className='log ' + cls; p.textContent=String(text); $console.appendChild(p); $console.scrollTop=$console.scrollHeight; }
  (function hookConsole(){ const _l=console.log,_w=console.warn,_e=console.error; console.log=(...a)=>{_l(...a);appendLog(a.join(' '),'ok');}; console.warn=(...a)=>{_w(...a);appendLog(a.join(' '),'warn');}; console.error=(...a)=>{_e(...a);appendLog(a.join(' '),'err');}; })();

  const selects = {
    type: document.getElementById('typeSelect'),
    family: document.getElementById('familySelect'),
    aircraft: document.getElementById('aircraftSelect'),
    livery: document.getElementById('liverySelect'),
  };
  const spinners = {
    type: document.getElementById('typeSpin'),
    family: document.getElementById('familySpin'),
    aircraft: document.getElementById('aircraftSpin'),
    livery: document.getElementById('liverySpin'),
  };

  function setLoading(which, on){ if(spinners[which]) spinners[which].style.display = on ? 'inline-block' : 'none'; }
  function resetSelect(sel, placeholder){ sel.innerHTML=''; const opt=document.createElement('option'); opt.value=''; opt.textContent=placeholder; sel.appendChild(opt); sel.value=''; }
  function enable(sel, on){ sel.disabled = !on; }
  function option(v, label){ const o=document.createElement('option'); o.value=String(v); o.textContent=label; return o; }

  async function loadTypes(){
    try{
      enable(selects.type,false); setLoading('type', true); resetSelect(selects.type, '— Sélectionner un type —');
      const rows = await window.Api.listTypes();
      rows.forEach(t=> selects.type.appendChild(option(t.id, t.code ? `${t.code} — ${t.name}` : t.name)));
      enable(selects.type,true);
    }catch(e){ console.error('Types load failed:', e.message); }
    finally{ setLoading('type', false); }
  }

  async function loadFamilies(typeId){
    try{
      enable(selects.family,false); setLoading('family', true); resetSelect(selects.family, '— Sélectionner une famille —');
      if(!typeId) return;
      const rows = await window.Api.listFamiliesByType(typeId);
      rows.forEach(f=> selects.family.appendChild(option(f.id, f.code ? `${f.code} — ${f.name}` : f.name)));
      enable(selects.family,true);
    }catch(e){ console.error('Families load failed:', e.message); }
    finally{ setLoading('family', false); }
  }

  async function loadAircrafts(familyId){
    try{
      enable(selects.aircraft,false); setLoading('aircraft', true); resetSelect(selects.aircraft, '— Sélectionner un aircraft —');
      if(!familyId) return;
      const rows = await window.Api.listAircraftsByFamily(familyId);
      rows.forEach(a=> selects.aircraft.appendChild(option(a.id, a.code ? `${a.code} — ${a.name}` : a.name)));
      enable(selects.aircraft,true);
    }catch(e){ console.error('Aircrafts load failed:', e.message); }
    finally{ setLoading('aircraft', false); }
  }

  async function loadLiveries(aircraftId){
    try{
      enable(selects.livery,false); setLoading('livery', true); resetSelect(selects.livery, '— Sélectionner une livrée —');
      if(!aircraftId) return;
      const rows = await window.Api.listLiveriesByAircraft(aircraftId);
      rows.forEach(l=> selects.livery.appendChild(option(l.id, l.code ? `${l.code} — ${l.name}` : l.name)));
      enable(selects.livery,true);
    }catch(e){ console.error('Liveries load failed:', e.message); }
    finally{ setLoading('livery', false); }
  }

  // Chain events
  selects.type.addEventListener('change', async ()=>{
    const typeId = selects.type.value || null;
    resetSelect(selects.family, '— Sélectionner une famille —'); enable(selects.family,false);
    resetSelect(selects.aircraft, '— Sélectionner un aircraft —'); enable(selects.aircraft,false);
    resetSelect(selects.livery, '— Sélectionner une livrée —'); enable(selects.livery,false);
    if(typeId) await loadFamilies(typeId);
  });

  selects.family.addEventListener('change', async ()=>{
    const familyId = selects.family.value || null;
    resetSelect(selects.aircraft, '— Sélectionner un aircraft —'); enable(selects.aircraft,false);
    resetSelect(selects.livery, '— Sélectionner une livrée —'); enable(selects.livery,false);
    if(familyId) await loadAircrafts(familyId);
  });

  selects.aircraft.addEventListener('change', async ()=>{
    const aircraftId = selects.aircraft.value || null;
    resetSelect(selects.livery, '— Sélectionner une livrée —'); enable(selects.livery,false);
    if(aircraftId) await loadLiveries(aircraftId);
  });

  // Initial load
  loadTypes();

  // Unity bridge
  function sendImport(){
    if(!window.unityInstance){ console.warn('Unity pas prêt'); return; }
    const data = {
      TypeId: selects.type.value ? parseInt(selects.type.value,10) : 0,
      FamilyId: selects.family.value ? parseInt(selects.family.value,10) : 0,
      AircraftId: selects.aircraft.value ? parseInt(selects.aircraft.value,10) : 0,
      LiveryId: selects.livery.value ? parseInt(selects.livery.value,10) : 0,
    };
    const json = JSON.stringify(data);
    try{
      window.unityInstance.SendMessage('Engine', 'ImportFromJson', json);
      console.log('SendMessage ImportFromJson:', json);
    }catch(e){
      console.error('SendMessage error:', e.message);
    }
  }

  document.getElementById('importBtn').addEventListener('click', sendImport);
  document.getElementById('clearBtn').addEventListener('click', ()=>{ $console.innerHTML=''; });
  document.getElementById('clearLogs') && document.getElementById('clearLogs').addEventListener('click', ()=>{ $console.innerHTML=''; });
  document.getElementById('copyLogs') && document.getElementById('copyLogs').addEventListener('click', async ()=>{
    const text = Array.from($console.querySelectorAll('.log')).map(n=>n.textContent).join('\n');
    try{ await navigator.clipboard.writeText(text); console.log('Logs copiés'); }catch{ console.warn('Copie impossible'); }
  });
})();