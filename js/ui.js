(function () {
    const GAMEOBJECT_NAME = 'API';
    document.getElementById('goNameLabel') && (document.getElementById('goNameLabel').textContent = GAMEOBJECT_NAME);

    const $console = document.getElementById('console');
    function appendLog(text, cls = '') { const p = document.createElement('div'); p.className = 'log ' + cls; p.textContent = String(text); $console.appendChild(p); $console.scrollTop = $console.scrollHeight; }
    (function hookConsole() { const _l = console.log, _w = console.warn, _e = console.error; console.log = (...a) => { _l(...a); appendLog(a.join(' '), 'ok'); }; console.warn = (...a) => { _w(...a); appendLog(a.join(' '), 'warn'); }; console.error = (...a) => { _e(...a); appendLog(a.join(' '), 'err'); }; })();

    const selects = {
        type: document.getElementById('typeSelect'),
        aircraft: document.getElementById('aircraftSelect'),
        livery: document.getElementById('liverySelect'),
        env: document.getElementById('envSelect'),
        view: document.getElementById('viewSelect'),
    };
    const spinners = {
        type: document.getElementById('typeSpin'),
        aircraft: document.getElementById('aircraftSpin'),
        livery: document.getElementById('liverySpin'),
        env: document.getElementById('envSpin'),
        view: document.getElementById('viewSpin'),
    };

    function setLoading(which, on) { if (spinners[which]) spinners[which].style.display = on ? 'inline-block' : 'none'; }
    function resetSelect(sel, placeholder) { sel.innerHTML = ''; const opt = document.createElement('option'); opt.value = ''; opt.textContent = placeholder; sel.appendChild(opt); sel.value = ''; }
    function enable(sel, on) { sel.disabled = !on; }
    function option(v, label) { const o = document.createElement('option'); o.value = String(v); o.textContent = label; return o; }


    async function loadEnvironments() {
        try {
            enable(selects.env, false); setLoading('env', true); resetSelect(selects.env, '— Sélectionner un Environement —');
            const rows = await window.Api.listEnvironments();
            rows.forEach(t => selects.env.appendChild(option(t.id, t.name)));
            enable(selects.env, true);
        } catch (e) { console.error('Environments load failed:', e.message); }
        finally { setLoading('env', false); }
    }

    const viewsGrid = document.getElementById("viewsGrid");
    let currentViewId = null;

    const viewsGrid = document.getElementById("viewsGrid");
    let currentViewId = null;

    async function loadViews() {
        viewsGrid.innerHTML = `<span class="spinner"></span>`;

        try {
            const rows = await window.Api.listViews();

            viewsGrid.innerHTML = ""; // remove spinner

            rows.forEach(view => {
                const card = document.createElement("div");
                card.className = "view-card";
                card.dataset.id = view.id;

                // preview PNG (transparente)
                const img = document.createElement("img");
                img.src = window.Api.getViewPrevURI(view.id);
                img.loading = "lazy";

                // name
                const name = document.createElement("div");
                name.className = "view-card-name";
                name.textContent = view.name;

                card.appendChild(img);
                card.appendChild(name);

                // CLICK = SELECT + APPLY VIEW TO UNITY
                card.addEventListener("click", () => {

                    // update selected appearance
                    document
                        .querySelectorAll(".view-card")
                        .forEach(c => c.classList.remove("selected"));

                    card.classList.add("selected");
                    currentViewId = view.id;

                    // must have unity
                    if (!window.unityInstance) {
                        console.warn("Unity pas prêt");
                        return;
                    }

                    try {
                        window.unityInstance.SendMessage(
                            GAMEOBJECT_NAME,
                            "SetCameraView",
                            currentViewId
                        );
                        console.log("SendMessage ApplyView:", currentViewId);
                    } catch (e) {
                        console.error("SendMessage error:", e.message);
                    }
                });

                viewsGrid.appendChild(card);
            });

        } catch (e) {
            console.error("Views load failed:", e.message);
            viewsGrid.innerHTML = `<p class="muted">Impossible de charger les vues.</p>`;
        }
    }

    async function loadTypes() {
        try {
            enable(selects.type, false); setLoading('type', true); resetSelect(selects.type, '— Sélectionner un type —');
            const rows = await window.Api.listTypes();
            rows.forEach(t => selects.type.appendChild(option(t.id, t.name)));
            enable(selects.type, true);
        } catch (e) { console.error('Types load failed:', e.message); }
        finally { setLoading('type', false); }
    }

    async function loadLiveries(typeId) {
        try {
            enable(selects.livery, false); setLoading('livery', true); resetSelect(selects.livery, '— Sélectionner une livrée —');
            if (!typeId) return;
            const rows = await window.Api.listLiveries(typeId);
            rows.forEach(l => selects.livery.appendChild(option(l, l)));
            enable(selects.livery, true);
        } catch (e) { console.error('Liveries load failed:', e.message); }
        finally { setLoading('livery', false); }
    }

    async function loadAircrafts(liveryCode) {
        try {
            enable(selects.aircraft, false); setLoading('aircraft', true); resetSelect(selects.aircraft, '— Sélectionner un aircraft —');
            if (!liveryCode) return;
            const rows = await window.Api.listAircraftsByLiveries(liveryCode);
            rows.forEach(a => selects.aircraft.appendChild(option(a.id, a.name)));
            enable(selects.aircraft, true);
        } catch (e) { console.error('Aircrafts load failed:', e.message); }
        finally { setLoading('aircraft', false); }
    }

    // Chain events
    selects.type.addEventListener('change', async () => {
        const typeId = selects.type.value || null;
        resetSelect(selects.livery, '— Sélectionner une livrée —'); enable(selects.livery, false);
        resetSelect(selects.aircraft, '— Sélectionner un aircraft —'); enable(selects.aircraft, false);
        if (typeId) await loadLiveries(typeId);
    });

    selects.livery.addEventListener('change', async () => {
        const liveryCode = selects.livery.value || null;
        resetSelect(selects.aircraft, '— Sélectionner un aircraft —'); enable(selects.aircraft, false);
        if (liveryCode) await loadAircrafts(liveryCode);
    });

    var selectedAircraft;
    selects.aircraft.addEventListener('change', async () => {
        const aircraftId = selects.aircraft.value || null;
        if (!aircraftId) return;
        await window.Api.getAircraft(aircraftId).then(data => {
            selectedAircraft = data;
            var jsonData = JSON.stringify(data, null, 2);
            console.log(`Aircraft selected : ${jsonData}`);
            sendImport();
        });
    });

    // Unity bridge
    function sendImport() {
        if (!window.unityInstance) { console.warn('Unity pas prêt'); return; }
        const data = {
            TypeId: selectedAircraft.type_id,
            FamilyId: selectedAircraft.family_id,
            AircraftId: selectedAircraft.id,
            LiveryCode: selects.livery.value,
        };
        const json = JSON.stringify(data);
        try {
            window.unityInstance.SendMessage(GAMEOBJECT_NAME, 'Load', json);
            console.log('SendMessage Import:', json);
        } catch (e) {
            console.error('SendMessage error:', e.message);
        }
    }

    // Load Environment
    function sendLoadEnvironment() {
        if (!window.unityInstance) { console.warn('Unity pas prêt'); return; }
        const envId = selects.env.value ? parseInt(selects.env.value, 10) : 0;
        if (!envId) {
            console.warn('Aucun environnement sélectionné');
            return;
        }
        try {
            window.unityInstance.SendMessage(GAMEOBJECT_NAME, 'LoadEnvironment', envId);
            console.log('SendMessage LoadEnvironment:', envId);
        } catch (e) {
            console.error('SendMessage error:', e.message);
        }
    }

    // Quality settings
    const renderScaleSlider = document.getElementById('renderScale');
    const renderScaleVal = document.getElementById('renderScaleVal');
    renderScaleSlider.addEventListener('input', () => {
        const val = parseFloat(renderScaleSlider.value);
        switch (val) {
            case 1: renderScaleVal.textContent = 'Low';
                break;
            case 2: renderScaleVal.textContent = 'Medium';
                break;
            case 3: renderScaleVal.textContent = 'High';
                break;
        }
        if (window.unityInstance) {
            try {
                window.unityInstance.SendMessage(GAMEOBJECT_NAME, 'SetQualityLevel', val);
                console.log('SetQualityLevel:', val);
            } catch (e) {
                console.error('SetQualityLevel error:', e.message);
            }
        }
    });

    // Rotation
    const rotationSlider = document.getElementById('rotation');
    const rotationVal = document.getElementById('rotationVal');
    rotationSlider.addEventListener('input', () => {
        const val = parseFloat(rotationSlider.value);
        rotationVal.textContent = val.toFixed(1);
        if (window.unityInstance) {
            try {
                window.unityInstance.SendMessage(GAMEOBJECT_NAME, 'SetEnvironmentRotation', val);
                console.log('SetEnvironmentRotation:', val);
            } catch (e) {
                console.error('SetEnvironmentRotation error:', e.message);
            }
        }
    });

    // --- Screenshot form wiring ---
    const $ss = {
        width: document.getElementById('ss-width'),
        height: document.getElementById('ss-height'),
        background: document.getElementById('ss-background'),
        environement: document.getElementById('ss-environement'),
        compression: document.getElementById('ss-compression'),
        compressionVal: document.getElementById('ss-compression-val'),
        captureBtn: document.getElementById('ss-capture'),
        ssao: document.getElementById('ss-ssao'),
        pfx: document.getElementById('ss-pfx')
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
            const background = $ss.background.checked;
            const supersample = true;
            const environment = $ss.environement.checked;
            const ambiantOclusion = $ss.ssao.checked;
            const includePostFX = $ss.pfx.checked;
            const pngCompression = Math.min(9, Math.max(0, parseInt($ss.compression.value || '6', 10)));

            // open modal
            showProgressModal('Rendu en cours…', 'Préparation…');

            // Prepare payload
            const payload = JSON.stringify({
                width, height, background,
                environment, pngCompression,
                ambiantOclusion, includePostFX,
                supersample
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

    // --- Unity → JS callbacks (linked by .jslib into unity project) ---
    window.OnScreenshotProgress = function (phase, progress) {
        // phase: 0 = Rendering, 1 = Merging
        const pct = Math.round(progress * 100);
        const label = phase === 0 ? 'Rendering…' : 'Merging…';
        updateProgressModal(pct, `${label} ${pct}%`);
    };

    window.OnScreenshotReady = function (base64, w, h) {
        try {
            // Auto-download .png file
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

    document.getElementById('envImportBtn').addEventListener('click', sendLoadEnvironment);
    document.getElementById('clearLogs').addEventListener('click', () => { $console.innerHTML = ''; });
    document.getElementById('copyLogs') && document.getElementById('copyLogs').addEventListener('click', async () => {
        const text = Array.from($console.querySelectorAll('.log')).map(n => n.textContent).join('\n');
        try { await navigator.clipboard.writeText(text); console.log('Logs copiés'); } catch { console.warn('Copie impossible'); }
    });

    // wait until window.Api.API_BASE != '' to load types
    const waitForApiBase = setInterval(() => {
        if (window.Api && window.Api.API_BASE !== '') {
            clearInterval(waitForApiBase);
            loadTypes();
            loadEnvironments();
            alert(window.Api.API_BASE);
            loadViews(window.Api.API_BASE);
        }
    }, 50);
})();