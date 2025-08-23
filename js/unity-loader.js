(function () {
    // Configuration Unity
    const canvas = document.querySelector('#unity-canvas');
    const progressBarFull = document.querySelector('#unity-progress-bar-full');
    const loadingBar = document.querySelector('#unity-loading-bar');
    const warningBanner = document.querySelector('#unity-warning');
    const fullscreenButton = document.querySelector('#unity-fullscreen-button');

    function unityShowBanner(msg, type) {
        const div = document.createElement('div');
        div.innerHTML = msg;
        div.style = 'padding:10px;margin:4px 0;' + (type === 'error' ? 'background:#7f1d1d;color:#fecaca;' : 'background:#78350f;color:#fde68a;');
        warningBanner.appendChild(div);
        setTimeout(() => { warningBanner.removeChild(div); warningBanner.style.display = warningBanner.children.length ? 'block' : 'none'; }, 5000);
        warningBanner.style.display = 'block';
    }

    var buildUrl = "Build";
    var loaderUrl = buildUrl + "/SMR.loader.js";
    var config = {
        arguments: [],
        dataUrl: buildUrl + "/SMR.data",
        frameworkUrl: buildUrl + "/SMR.framework.js",
        workerUrl: buildUrl + "/SMR.worker.js",
        codeUrl: buildUrl + "/SMR.wasm",
        streamingAssetsUrl: "StreamingAssets",
        companyName: "VRDTMStudio",
        productName: "Self Mapping Rendering",
        productVersion: "0.1.0",
        showBanner: unityShowBanner,
    };

    function hookModuleIO(instance) {
        try {
            const mod = instance.Module || {};
            const prevPrint = mod.print, prevPrintErr = mod.printErr;
            mod.print = (t) => { console.log(String(t)); if (prevPrint) prevPrint(t); };
            mod.printErr = (t) => { console.error(String(t)); if (prevPrintErr) prevPrintErr(t); };
        } catch (e) { console.warn('Module I/O hook failed', e); }
    }

    function loadUnity() {
        loadingBar.style.display = 'block';
        const s = document.createElement('script');
        s.src = loaderUrl;
        s.onload = () => {
            if (typeof createUnityInstance !== 'function') {
                console.error('Unity loader missing: createUnityInstance not found');
                return;
            }
            createUnityInstance(canvas, config, (p) => { progressBarFull.style.width = (100 * p) + '%'; })
                .then((instance) => {
                    window.unityInstance = instance;
                    hookModuleIO(instance);
                    loadingBar.style.display = 'none';
                    if (fullscreenButton) fullscreenButton.onclick = () => instance.SetFullscreen(1);
                    console.log('Unity prêt ✔️');
                })
                .catch((message) => {
                    console.error('Unity error:', message);
                    alert(message);
                });
        };
        s.onerror = () => console.error('Failed to load Unity loader at', loaderUrl);
        document.body.appendChild(s);
    }

    // FPS counter (simple)
    (function fpsCounter() {
        const fpsEl = document.getElementById('fps'); if (!fpsEl) return;
        let last = performance.now(), frames = 0, acc = 0;
        function tick() {
            const now = performance.now(), dt = now - last; last = now; frames++; acc += dt;
            if (acc >= 500) { fpsEl.textContent = 'FPS: ' + Math.round(frames * 1000 / acc); frames = 0; acc = 0; }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    })();

    // Load
    loadUnity();
})();