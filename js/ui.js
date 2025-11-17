(function () {

    // ============================================================
    //  CONST / STATE
    // ============================================================
    const GO = "API";

    document.getElementById("goNameLabel") &&
        (document.getElementById("goNameLabel").textContent = GO);

    const selects = {
        type: document.getElementById("typeSelect"),
        aircraft: document.getElementById("aircraftSelect"),
        livery: document.getElementById("liverySelect"),
    };

    const spinners = {
        type: document.getElementById("typeSpin"),
        aircraft: document.getElementById("aircraftSpin"),
        livery: document.getElementById("liverySpin"),
        env: document.getElementById("envSpin"),
        view: document.getElementById("viewsSpin")
    };

    const grids = {
        env: document.getElementById("envGrid"),
        view: document.getElementById("viewsGrid"),
    };

    let currentEnvId = null;
    let currentViewId = null;
    let selectedAircraft = null;


    // ============================================================
    //  UTILS
    // ============================================================
    const setLoading = (k, on) =>
        spinners[k] && (spinners[k].style.display = on ? "inline-block" : "none");

    const enable = (el, on) => el && (el.disabled = !on);

    const resetSelect = (el, placeholder) => {
        el.innerHTML = "";
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = placeholder;
        el.appendChild(opt);
        el.value = "";
    };

    const option = (value, label) => {
        const o = document.createElement("option");
        o.value = String(value);
        o.textContent = label;
        return o;
    };

    const clearGrid = grid => grid && (grid.innerHTML = "");

    const sendMessage = (method, payload) => {
        if (!window.unityInstance) {
            console.warn("Unity pas prêt");
            return;
        }
        try {
            window.unityInstance.SendMessage(GO, method, payload);
            console.log(`Unity → ${method}`, payload);
        } catch (e) {
            console.error(`SendMessage ${method} error:`, e.message);
        }
    };


    // ============================================================
    //  CARD FACTORY
    // ============================================================
    function createCard({ id, img, label, cls, onClick }) {

        const card = document.createElement("div");
        card.className = cls;
        card.dataset.id = id;

        const picture = document.createElement("img");
        picture.src = img;
        picture.loading = "lazy";
        card.appendChild(picture);

        if (label) {
            const name = document.createElement("div");
            name.className = "item-name";
            name.textContent = label;
            card.appendChild(name);
        }

        card.addEventListener("click", () => {
            [...card.parentNode.querySelectorAll("." + cls)]
                .forEach(c => c.classList.remove("selected"));

            card.classList.add("selected");
            onClick(id);
        });

        return card;
    }


    // ============================================================
    //  ENVIRONMENTS
    // ============================================================
    async function loadEnvironmentPreviews() {

        const grid = grids.env;
        clearGrid(grid);
        grid.innerHTML = `<span class="spinner"></span>`;

        try {
            const rows = await Api.listEnvironments();
            clearGrid(grid);

            rows.forEach(env => {
                const c = createCard({
                    id: env.id,
                    img: Api.getEnvPrevURI(env.id),
                    cls: "card-item",
                    label: null,
                    onClick: id => {
                        currentEnvId = id;
                        sendMessage("LoadEnvironment", id);
                    }
                });
                grid.appendChild(c);
            });

        } catch (e) {
            console.error("Env load failed:", e.message);
            grid.innerHTML = `<p class="muted">Impossible de charger les environnements.</p>`;
        }
    }


    // ============================================================
    //  VIEWS
    // ============================================================
    async function loadViews() {

        const grid = grids.view;
        clearGrid(grid);
        grid.innerHTML = `<span class="spinner"></span>`;

        try {
            const rows = await Api.listViews();
            clearGrid(grid);

            rows.forEach(view => {
                const c = createCard({
                    id: view.id,
                    img: Api.getViewPrevURI(view.id),
                    label: view.name,
                    cls: "card-item",
                    onClick: id => {
                        currentViewId = id;
                        sendMessage("SetCameraView", id);
                    }
                });
                grid.appendChild(c);
            });

        } catch (e) {
            console.error("Views load failed:", e.message);
            grid.innerHTML = `<p class="muted">Impossible de charger les vues.</p>`;
        }
    }


    // ============================================================
    //  TYPES
    // ============================================================
    async function loadTypes() {
        try {
            enable(selects.type, false);
            resetSelect(selects.type, "— Sélectionner un type —");

            const rows = await Api.listTypes();
            rows.forEach(t => selects.type.appendChild(option(t.id, t.name)));

            enable(selects.type, true);

        } catch (e) {
            console.error("Types load failed:", e.message);
        }
    }


    // ============================================================
    //  LIVERIES
    // ============================================================
    async function loadLiveries(typeId) {
        try {
            enable(selects.livery, false);
            resetSelect(selects.livery, "— Sélectionner une livrée —");

            if (!typeId) return;

            const rows = await Api.listLiveries(typeId);
            rows.forEach(l => selects.livery.appendChild(option(l.code, l.name)));

            enable(selects.livery, true);

        } catch (e) {
            console.error("Liveries load failed:", e.message);
        }
    }


    // ============================================================
    //  AIRCRAFTS
    // ============================================================
    async function loadAircrafts(liveryCode) {
        try {
            enable(selects.aircraft, false);
            resetSelect(selects.aircraft, "— Sélectionner un aircraft —");

            if (!liveryCode) return;

            const rows = await Api.listAircraftsByLiveries(liveryCode);

            rows.forEach(a =>
                selects.aircraft.appendChild(option(a.id, a.name))
            );

            enable(selects.aircraft, true);

        } catch (e) {
            console.error("Aircraft load failed:", e.message);
        }
    }


    // ============================================================
    //  SELECT EVENTS
    // ============================================================
    selects.type.addEventListener("change", async () => {
        const type = selects.type.value || null;

        resetSelect(selects.livery, "— Sélectionner une livrée —");
        enable(selects.livery, false);

        resetSelect(selects.aircraft, "— Sélectionner un aircraft —");
        enable(selects.aircraft, false);

        if (type) loadLiveries(type);
    });

    selects.livery.addEventListener("change", async () => {
        const code = selects.livery.value || null;

        resetSelect(selects.aircraft, "— Sélectionner un aircraft —");
        enable(selects.aircraft, false);

        if (code) loadAircrafts(code);
    });

    selects.aircraft.addEventListener("change", async () => {
        const id = selects.aircraft.value || null;
        if (!id) return;

        selectedAircraft = await Api.getAircraft(id);
        console.log("Aircraft selected:", selectedAircraft);

        sendImport();
    });


    // ============================================================
    //  SEND IMPORT TO UNITY
    // ============================================================
    function sendImport() {

        if (!selectedAircraft) return;

        const payload = JSON.stringify({
            TypeId: selectedAircraft.type_id,
            FamilyId: selectedAircraft.family_id,
            AircraftId: selectedAircraft.id,
            LiveryCode: selects.livery.value
        });

        try {
            window.unityInstance.SendMessage(GO, "Load", payload);
            console.log("SendMessage Load:", payload);
        } catch (e) {
            console.error("SendMessage Load error:", e.message);
        }
    }


    // ============================================================
    //  QUALITY / ROTATION
    // ============================================================
    const renderScale = document.getElementById("renderScale");
    const renderScaleVal = document.getElementById("renderScaleVal");

    renderScale.addEventListener("input", () => {
        const map = { 1: "Low", 2: "Medium", 3: "High" };
        renderScaleVal.textContent = map[renderScale.value];
        sendMessage("SetQualityLevel", renderScale.value);
    });

    const rotation = document.getElementById("rotation");
    const rotationVal = document.getElementById("rotationVal");

    rotation.addEventListener("input", () => {
        rotationVal.textContent = rotation.value + "°";
        sendMessage("SetEnvironmentRotation", rotation.value);
    });


    // ============================================================
    //  SCREENSHOT
    // ============================================================
    const $ss = {
        width: document.getElementById("ss-width"),
        height: document.getElementById("ss-height"),
        bg: document.getElementById("ss-background"),
        env: document.getElementById("ss-environement"),
        comp: document.getElementById("ss-compression"),
        compVal: document.getElementById("ss-compression-val"),
        capture: document.getElementById("ss-capture"),
        ssao: document.getElementById("ss-ssao"),
        pfx: document.getElementById("ss-pfx")
    };

    if ($ss.comp)
        $ss.comp.addEventListener("input", () =>
            ($ss.compVal.textContent = $ss.comp.value));

    if ($ss.capture)
        $ss.capture.addEventListener("click", () => {

            if (!window.unityInstance) {
                console.warn("Unity pas prêt");
                return;
            }

            const payload = JSON.stringify({
                width: Math.max(256, parseInt($ss.width.value) || 0),
                height: Math.max(256, parseInt($ss.height.value) || 0),
                background: $ss.bg.checked,
                supersample: true,
                environment: $ss.env.checked,
                pngCompression: Math.min(9, Math.max(0, parseInt($ss.comp.value))),
                ambiantOclusion: $ss.ssao.checked,
                includePostFX: $ss.pfx.checked,
            });

            showProgressModal("Rendu en cours…", "Préparation…");
            sendMessage("CaptureScreenJSON", payload);
        });


    // ============================================================
    //  PROGRESS MODAL
    // ============================================================
    const $modal = document.getElementById("progress-modal");
    const $title = document.getElementById("progress-title");
    const $msg = document.getElementById("progress-message");
    const $bar = document.getElementById("progress-bar");

    function showProgressModal(title, msg) {
        $title.textContent = title;
        $msg.textContent = msg;
        $bar.style.width = "0%";
        $modal.setAttribute("aria-hidden", "false");
    }

    function hideProgressModal() {
        $modal.setAttribute("aria-hidden", "true");
    }

    function updateProgressModal(pct, msg) {
        $bar.style.width = pct + "%";
        if (msg) $msg.textContent = msg;
    }

    window.OnScreenshotProgress = (phase, prog) => {
        const pct = Math.round(prog * 100);
        updateProgressModal(
            pct,
            (phase === 0 ? "Rendering…" : "Merging…") + " " + pct + "%"
        );
    };

    window.OnScreenshotReady = (base64, w, h) => {
        try {
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const url = URL.createObjectURL(
                new Blob([bytes], { type: "image/png" })
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `screenshot_${w}x${h}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } finally {
            hideProgressModal();
        }
    };


    // ============================================================
    //  WAIT FOR API READY
    // ============================================================
    const wait = setInterval(() => {
        if (window.Api && Api.API_BASE !== "nourl") {
            clearInterval(wait);
            loadTypes();
            loadEnvironmentPreviews();
            loadViews();
        }
    }, 50);


    // ============================================================
    //  DYNAMIC HEIGHTS (DESKTOP ONLY)
    // ============================================================
    const isMobile = () => window.innerWidth <= 1100;

    function adjustDynamicHeights() {
        if (isMobile()) return;

        const side = document.getElementById("side");
        const cards = side.querySelectorAll(".card");

        const aircraftCard = cards[0];
        const viewCard = cards[1];
        const envCard = cards[2];

        const sideH = side.clientHeight;
        const fixedHeight = aircraftCard.offsetHeight + 16;

        const remaining = sideH - fixedHeight;
        if (remaining < 100) return;

        const half = remaining / 2;

        viewCard.style.flex = `0 0 ${half}px`;
        envCard.style.flex = `0 0 ${half}px`;
    }

    window.addEventListener("resize", adjustDynamicHeights);
    window.addEventListener("load", adjustDynamicHeights);
    setTimeout(adjustDynamicHeights, 300);

})();