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

    // replace native selects
    selects.type = makeASelect("typeSelect");
    selects.livery = makeASelect("liverySelect");
    selects.aircraft = makeASelect("aircraftSelect");

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
                    label: env.name,
                    cls: "card-item",
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
            selects.type.reset("— Select a Type —");

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
            selects.livery.reset("— Select an Airline —");

            if (!typeId) return;

            let rows = await Api.listLiveries(typeId);

            // --- Normalisation des noms / codes ---
            rows = rows.map(l => {
                let name = l.name || "";
                let code = l.code || "";

                // Retirer "_" au début
                if (name.startsWith("_")) name = name.substring(1);
                if (code.startsWith("_")) code = code.substring(1);

                return {
                    ...l,
                    name,
                    code
                };
            });

            // --- Tri alphabétique sur name propre ---
            rows.sort((a, b) => a.name.localeCompare(b.name));

            // --- Construction du label final ---
            rows.forEach(l => {

                // Si name vide OU name == code → afficher juste code
                let label;
                if (!l.name || l.name === l.code)
                    label = l.code;
                else
                    label = `${l.name} - ${l.code}`;

                selects.livery.appendChild(option(l.code, label));
            });

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
            selects.aircraft.reset("— Select an Aircraft —");

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
    selects.type.root.addEventListener("change", async () => {
        const type = selects.type.value || null;

        selects.livery.reset("— Select an Airline —");
        enable(selects.livery, false);

        selects.aircraft.reset("— Select an Aircraft —");
        enable(selects.aircraft, false);

        if (type) loadLiveries(type);
    });

    selects.livery.root.addEventListener("change", async () => {
        const code = selects.livery.value || null;

        selects.aircraft.reset("— Select an Aircraft —");
        enable(selects.aircraft, false);

        if (code) loadAircrafts(code);
    });

    selects.aircraft.root.addEventListener("change", async () => {
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

    window.OnReadyToImport = async () => {
        // Exemple : AIB (Airbus Industrie), A350-1000, etc.
        // Adapte selon ce que tu veux sélectionner automatiquement.
        const targetTypeId = 0;
        const targetLiveryCode = "AIB";
        const targetAircraftId = "A350-1000";

        // 1. Sélectionner Type
        selects.type.value = targetTypeId;
        selects.type.root.dispatchEvent(new Event("change"));

        // 2. Attendre que les liveries soient chargées
        await new Promise(res => setTimeout(res, 150));

        // 3. Sélectionner Airline / Livery
        selects.livery.value = targetLiveryCode;
        selects.livery.root.dispatchEvent(new Event("change"));

        // 4. Attendre que les aircrafts soient chargés
        await new Promise(res => setTimeout(res, 150));

        // 5. Sélectionner Aircraft
        selects.aircraft.value = targetAircraftId;
        selects.aircraft.root.dispatchEvent(new Event("change"));
    };

    window.OnScreenshotProgress = (phase, prog) => {
        const pct = Math.round(prog * 100);
        updateProgressModal(
            pct,
            (phase === 0 ? "Rendering…" : "Merging…") + " " + pct + "%"
        );
    };

    window.OnScreenshotReady = async (base64, w, h) => {
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

            // 🔍 Check tokens *sans consommer*
            try {
                const r = await fetch("/studio/check-tokens.php");
                const j = await r.json();

                if (j.tokens <= 0) {
                    showToast("You have used your last rendering beta token. You will be redirected.");
                    setTimeout(() => {
                        window.location.href = "/pricing/";
                    }, 1800);
                    return;
                }

                updateTokenUI();

            } catch (err) {
                console.error("Token check failed:", err);
            }
        }
    };

    function showToast(msg) {
        const t = document.getElementById("toast");
        t.textContent = msg;
        t.style.opacity = 1;
        setTimeout(() => t.style.opacity = 0, 1500);
    }

    // =========================================
    // CUSTOM SELECT ADAPTER
    // =========================================
    function makeASelect(id) {
        const root = document.querySelector(`.aselect[data-id="${id}"]`);
        if (!root) return null;

        const display = root.querySelector(".aselect-display");
        const optionsBox = root.querySelector(".aselect-options");

        // Inject search bar ONLY for liveries
        let searchInput = null;
        if (id === "liverySelect") {

            searchInput = document.createElement("input");
            searchInput.type = "text";
            searchInput.className = "aselect-search";
            searchInput.placeholder = "Search airline…";

            // Style minimal (tu peux externaliser en CSS)
            searchInput.style.display = "block";
            searchInput.style.width = "100%";
            searchInput.style.boxSizing = "border-box";
            searchInput.style.margin = "4px 0";
            searchInput.style.padding = "6px 8px";

            optionsBox.prepend(searchInput);

            // live filtering
            searchInput.addEventListener("input", () => {
                const q = searchInput.value.toLowerCase();

                optionsBox.querySelectorAll(".opt").forEach(o => {
                    const txt = o.textContent.toLowerCase();
                    o.style.display = txt.includes(q) ? "block" : "none";

                    // Autocomplete highlight
                    if (q && txt.includes(q)) {
                        const start = txt.indexOf(q);
                        const end = start + q.length;
                        const orig = o.textContent;
                        o.innerHTML =
                            orig.substring(0, start) +
                            "<strong>" + orig.substring(start, end) + "</strong>" +
                            orig.substring(end);
                    } else {
                        o.textContent = o.textContent; // reset
                    }
                });
            });
        }

        const api = {
            root,
            disabled: false,
            _value: "",

            set disabled(v) {
                this._disabled = v;
                display.style.opacity = v ? .5 : 1;
                display.style.pointerEvents = v ? "none" : "auto";
            },

            get disabled() {
                return this._disabled;
            },

            set value(v) {
                this._value = v;
                const opt = optionsBox.querySelector(`.opt[data-value="${v}"]`);
                display.textContent = opt ? opt.textContent : display.textContent;
            },

            get value() {
                return this._value;
            },

            appendChild(optEl) {
                // don't duplicate options
                if (optionsBox.querySelector(`.opt[data-value="${optEl.value}"]`))
                    return;

                const o = document.createElement("div");
                o.className = "opt";
                o.dataset.value = optEl.value;
                o.textContent = optEl.textContent;

                o.addEventListener("click", () => {
                    this.value = optEl.value;
                    optionsBox.style.display = "none";

                    // reset highlight and search
                    if (searchInput) {
                        searchInput.value = "";
                        optionsBox.querySelectorAll(".opt").forEach(x => {
                            x.style.display = "block";
                            x.textContent = x.textContent;
                        });
                    }

                    root.dispatchEvent(new Event("change"));
                });

                optionsBox.appendChild(o);
            },

            reset(placeholder) {
                optionsBox.innerHTML = "";
                display.textContent = placeholder;
                this.value = "";
            }
        };

        // toggle
        display.addEventListener("click", () => {
            if (api.disabled) return;
            const shown = optionsBox.style.display === "block";
            document.querySelectorAll(".aselect-options").forEach(o => o.style.display = "none");
            optionsBox.style.display = shown ? "none" : "block";
        });

        return api;
    }

    // ============================================================
    //  WAIT FOR API READY
    // ============================================================
    const wait = setInterval(() => {

        // 1. API prête ?
        if (!window.Api || window.Api.API_BASE === "nourl")
            return;

        // 2. Unity prêt ?
        if (!window.unityInstance) {
            return;
        }

        // ✔️ Unity + API prêts → on lance tout
        console.log("API & Unity ready. Initialisation…");
        clearInterval(wait);

        // cacher l'écran de chargement (si tu en as un)
        const waitScreen = document.getElementById("unity-wait-screen");
        if (waitScreen) {
            waitScreen.classList.remove("wait-visible");
            waitScreen.classList.add("wait-hidden");
        }
        // lancer le JS
        loadTypes();
        loadEnvironmentPreviews();
        loadViews();

    }, 50);

    // ============================================================
    //  RENDER PANEL (BOTTOM SHEET)
    // ============================================================
    const sheet = document.getElementById("bottom-sheet");
    const openBtn = document.getElementById("render-open-btn");
    const renderBtn = document.getElementById("bs-render-btn");

    const bsRes = document.getElementById("bs-resolution");
    const bsCustom = document.getElementById("bs-custom-res");

    // show panel
    function openSheet() {
        sheet.classList.remove("sheet-hidden");
        sheet.classList.add("sheet-visible");
    }

    // hide panel
    function closeSheet() {
        sheet.classList.remove("sheet-visible");
        sheet.classList.add("sheet-hidden");
    }

    // Open on main render button
    openBtn.addEventListener("click", openSheet);

    // Show/hide custom resolution
    bsRes.addEventListener("change", () => {
        bsCustom.style.display = (bsRes.value === "custom") ? "block" : "none";
    });

    // Fermer si clic extérieur
    document.addEventListener("click", (e) => {
        const clickedInside = sheet.contains(e.target) || openBtn.contains(e.target);

        if (!clickedInside) {
            sheet.classList.add("sheet-hidden");
            sheet.classList.remove("sheet-visible");
        }
    });

    renderBtn.addEventListener("click", async (e) => {

        // 1. Vérifier les tokens côté serveur
        const r = await fetch("/studio/consume-token.php", {
            method: "POST"
        });

        const j = await r.json();

        if (!j.success) {
            // Stopper le click, empêcher le reste du JS
            e.preventDefault();
            e.stopPropagation();

            if (j.redirect)
                window.location.href = j.redirect;

            return; // NE RIEN CONTINUER
        }

        // 2. OK → on continue normalement
        let width, height;

        if (bsRes.value === "custom") {
            width = Math.min(16000, Math.max(256, parseInt(document.getElementById("bs-width").value)));
            height = Math.min(16000, Math.max(256, parseInt(document.getElementById("bs-height").value)));
        } else {
            const parts = bsRes.value.split("x");
            width = parseInt(parts[0]);
            height = parseInt(parts[1]);
        }

        const payload = {
            width,
            height,
            pngCompression: 2,
            background: document.getElementById("bs-background").checked,
            environment: document.getElementById("bs-background").checked,
            includePostFX: true,
            ambiantOclusion: false,
            supersample: true
        };

        closeSheet();
        showProgressModal("Rendu en cours…", "Préparation…");

        // 3. Lancer Unity
        window.unityInstance.SendMessage(
            "API",
            "CaptureScreenJSON",
            JSON.stringify(payload)
        );
    });

    // Optional: close sheet when clicking handle
    document.querySelector("#sheet-header .handle")
        .addEventListener("click", closeSheet);
    let lastTokenCount = null;

    async function updateTokenUI() {
        const r = await fetch("/studio/check-tokens.php");
        const j = await r.json();

        const max = 20;
        const val = j.tokens;

        const badge = document.getElementById("token-badge");
        const ring = document.getElementById("token-ring");
        const wrapper = document.getElementById("token-inline");

        // Detect loss of token
        if (lastTokenCount !== null && val < lastTokenCount) {
            wrapper.classList.add("lost");
            setTimeout(() => wrapper.classList.remove("lost"), 450);
        }
        lastTokenCount = val;

        // Update numeric badge
        badge.textContent = val;

        // Update radial progress
        const pct = (val / max) * 100;
        ring.style.setProperty("--percent", pct + "%");

        // Tooltip
        wrapper.setAttribute("data-tip", `${val} / ${max} tokens`);
    }

    updateTokenUI();
})();