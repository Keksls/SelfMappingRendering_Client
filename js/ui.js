// UI binding + Unity bridge (prod-ready)
(function () {
    const GAMEOBJECT_NAME = 'API';
    document.getElementById('goNameLabel') && (document.getElementById('goNameLabel').textContent = GAMEOBJECT_NAME);

    const $console = document.getElementById('console');
    function appendLog(text, cls = '') { const p = document.createElement('div'); p.className = 'log ' + cls; p.textContent = String(text); $console.appendChild(p); $console.scrollTop = $console.scrollHeight; }
    (function hookConsole() { const _l = console.log, _w = console.warn, _e = console.error; console.log = (...a) => { _l(...a); appendLog(a.join(' '), 'ok'); }; console.warn = (...a) => { _w(...a); appendLog(a.join(' '), 'warn'); }; console.error = (...a) => { _e(...a); appendLog(a.join(' '), 'err'); }; })();

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

    function setLoading(which, on) { if (spinners[which]) spinners[which].style.display = on ? 'inline-block' : 'none'; }
    function resetSelect(sel, placeholder) { sel.innerHTML = ''; const opt = document.createElement('option'); opt.value = ''; opt.textContent = placeholder; sel.appendChild(opt); sel.value = ''; }
    function enable(sel, on) { sel.disabled = !on; }
    function option(v, label) { const o = document.createElement('option'); o.value = String(v); o.textContent = label; return o; }

    async function loadTypes() {
        try {
            enable(selects.type, false); setLoading('type', true); resetSelect(selects.type, '— Sélectionner un type —');
            const rows = await window.Api.listTypes();
            rows.forEach(t => selects.type.appendChild(option(t.id, t.code ? `${t.code} — ${t.name}` : t.name)));
            enable(selects.type, true);
        } catch (e) { console.error('Types load failed:', e.message); }
        finally { setLoading('type', false); }
    }

    async function loadFamilies(typeId) {
        try {
            enable(selects.family, false); setLoading('family', true); resetSelect(selects.family, '— Sélectionner une famille —');
            if (!typeId) return;
            const rows = await window.Api.listFamiliesByType(typeId);
            rows.forEach(f => selects.family.appendChild(option(f.id, f.code ? `${f.code} — ${f.name}` : f.name)));
            enable(selects.family, true);
        } catch (e) { console.error('Families load failed:', e.message); }
        finally { setLoading('family', false); }
    }

    async function loadAircrafts(familyId) {
        try {
            enable(selects.aircraft, false); setLoading('aircraft', true); resetSelect(selects.aircraft, '— Sélectionner un aircraft —');
            if (!familyId) return;
            const rows = await window.Api.listAircraftsByFamily(familyId);
            rows.forEach(a => selects.aircraft.appendChild(option(a.id, a.code ? `${a.code} — ${a.name}` : a.name)));
            enable(selects.aircraft, true);
        } catch (e) { console.error('Aircrafts load failed:', e.message); }
        finally { setLoading('aircraft', false); }
    }

    async function loadLiveries(aircraftId) {
        try {
            enable(selects.livery, false); setLoading('livery', true); resetSelect(selects.livery, '— Sélectionner une livrée —');
            if (!aircraftId) return;
            const rows = await window.Api.listLiveriesByAircraft(aircraftId);
            rows.forEach(l => selects.livery.appendChild(option(l.id, l.code ? `${l.code} — ${l.name}` : l.name)));
            enable(selects.livery, true);
        } catch (e) { console.error('Liveries load failed:', e.message); }
        finally { setLoading('livery', false); }
    }

    // Chain events
    selects.type.addEventListener('change', async () => {
        const typeId = selects.type.value || null;
        resetSelect(selects.family, '— Sélectionner une famille —'); enable(selects.family, false);
        resetSelect(selects.aircraft, '— Sélectionner un aircraft —'); enable(selects.aircraft, false);
        resetSelect(selects.livery, '— Sélectionner une livrée —'); enable(selects.livery, false);
        if (typeId) await loadFamilies(typeId);
    });

    selects.family.addEventListener('change', async () => {
        const familyId = selects.family.value || null;
        resetSelect(selects.aircraft, '— Sélectionner un aircraft —'); enable(selects.aircraft, false);
        resetSelect(selects.livery, '— Sélectionner une livrée —'); enable(selects.livery, false);
        if (familyId) await loadAircrafts(familyId);
    });

    selects.aircraft.addEventListener('change', async () => {
        const aircraftId = selects.aircraft.value || null;
        resetSelect(selects.livery, '— Sélectionner une livrée —'); enable(selects.livery, false);
        if (aircraftId) await loadLiveries(aircraftId);
    });

    // Initial load
    loadTypes();

    // Unity bridge
    function sendImport() {
        if (!window.unityInstance) { console.warn('Unity pas prêt'); return; }
        const data = {
            TypeId: selects.type.value ? parseInt(selects.type.value, 10) : 0,
            FamilyId: selects.family.value ? parseInt(selects.family.value, 10) : 0,
            AircraftId: selects.aircraft.value ? parseInt(selects.aircraft.value, 10) : 0,
            LiveryId: selects.livery.value ? parseInt(selects.livery.value, 10) : 0,
        };
        const json = JSON.stringify(data);
        try {
            window.unityInstance.SendMessage(GAMEOBJECT_NAME, 'Load', json);
            console.log('SendMessage Import:', json);
        } catch (e) {
            console.error('SendMessage error:', e.message);
        }
    }

    // Render scale
    const renderScaleSlider = document.getElementById('renderScale');
    const renderScaleVal = document.getElementById('renderScaleVal');
    renderScaleSlider.addEventListener('input', () => {
        const val = parseFloat(renderScaleSlider.value);
        renderScaleVal.textContent = val.toFixed(1);
        if (window.unityInstance) {
            try {
                window.unityInstance.SendMessage(GAMEOBJECT_NAME, 'SetRenderScale', val);
                console.log('SetRenderScale:', val);
            } catch (e) {
                console.error('SetRenderScale error:', e.message);
            }
        }
    });

    // --- Screenshot form wiring ---
    const $ss = {
        width: document.getElementById('ss-width'),
        height: document.getElementById('ss-height'),
        supersample: document.getElementById('ss-supersample'),
        transparent: document.getElementById('ss-transparent'),
        environement: document.getElementById('ss-environement'),
        compression: document.getElementById('ss-compression'),
        compressionVal: document.getElementById('ss-compression-val'),
        captureBtn: document.getElementById('ss-capture'),
        ssao: document.getElementById('ss-ssao')
    };

    if ($ss.compression && $ss.compressionVal) {
        $ss.compression.addEventListener('input', () => {
            $ss.compressionVal.textContent = $ss.compression.value;
        });
    }

    if ($ss.captureBtn) {
        $ss.captureBtn.addEventListener('click', () => {
            if (!window.unityInstance) { console.warn('Unity pas prêt'); return; }

            const width = Math.max(256, parseInt($ss.width.value || '0', 10) || 0);
            const height = Math.max(256, parseInt($ss.height.value || '0', 10) || 0);
            const supersample = false;
            const transparentBg = !!$ss.transparent.checked;
            const environment = $ss.environement.checked;
            const ambiantOclusion = $ss.ssao.checked;
            const pngCompression = Math.min(9, Math.max(0, parseInt($ss.compression.value || '6', 10)));

            // Ouvre la modal (UI bloquée)
            showProgressModal('Rendu en cours…', 'Préparation…');

            // ⚠️ Unity SendMessage n’accepte qu’un seul paramètre ⇒ on envoie du JSON.
            // Côté C#, expose une méthode CaptureScreenJSON(string json) qui appelle ton CaptureScreen(...)
            const payload = JSON.stringify({
                width, height,
                supersample, transparentBg,
                environment, pngCompression,
                ambiantOclusion
            });

            try {
                window.unityInstance.SendMessage(GAMEOBJECT_NAME, 'CaptureScreenJSON', payload);
                console.log('CaptureScreenJSON →', payload);
            } catch (e) {
                console.error('CaptureScreenJSON error:', e.message);
                hideProgressModal();
            }
        });
    }

    // --- Global render progress modal ---
    const $modal = document.getElementById('progress-modal');
    const $title = document.getElementById('progress-title');
    const $bar = document.getElementById('progress-bar');
    const $msg = document.getElementById('progress-message');

    function showProgressModal(title, message) {
        if ($title) $title.textContent = title || 'En cours…';
        if ($msg) $msg.textContent = message || '';
        if ($bar) $bar.style.width = '0%';
        if ($modal) $modal.setAttribute('aria-hidden', 'false');
    }

    function updateProgressModal(percent, message) {
        if ($bar) $bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
        if ($msg && typeof message === 'string') $msg.textContent = message;
    }

    function hideProgressModal() {
        if ($modal) $modal.setAttribute('aria-hidden', 'true');
    }

    // --- Unity → JS callbacks (branchés par .jslib) ---
    window.OnScreenshotProgress = function (phase, progress) {
        // phase: 0 = Rendering, 1 = Merging (selon ton implémentation C#)
        const pct = Math.round(progress * 100);
        const label = phase === 0 ? 'Rendering…' : 'Merging…';
        updateProgressModal(pct, `${label} ${pct}%`);
    };

    window.OnScreenshotReady = function (base64, w, h) {
        try {
            // Télécharger automatiquement
            const bin = atob(base64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `screenshot_${w}x${h}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            hideProgressModal();
            console.log(`Screenshot prêt (${w}×${h})`);
        } catch (e) {
            console.error('OnScreenshotReady error:', e.message);
            hideProgressModal();
        }
    };

    document.getElementById('importBtn').addEventListener('click', sendImport);
    document.getElementById('clearBtn').addEventListener('click', () => { $console.innerHTML = ''; });
    document.getElementById('clearLogs') && document.getElementById('clearLogs').addEventListener('click', () => { $console.innerHTML = ''; });
    document.getElementById('copyLogs') && document.getElementById('copyLogs').addEventListener('click', async () => {
        const text = Array.from($console.querySelectorAll('.log')).map(n => n.textContent).join('\n');
        try { await navigator.clipboard.writeText(text); console.log('Logs copiés'); } catch { console.warn('Copie impossible'); }
    });
})();