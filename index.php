<?php
// Charger WordPress depuis n'importe où sur le serveur
require_once('/opt/bitnami/wordpress/wp-load.php');

// 1. user not connected, redirect to main url
if (!is_user_logged_in()) {
    wp_redirect('/');
    exit;
}

// 2. get connected user
$user_id = get_current_user_id();

// 3. get ACF fields
$acf = function_exists('get_fields') ? get_fields("user_$user_id") : [];
// 4. ensure tokens
$tokens = isset($acf['tokens']) ? intval($acf['tokens']) : 0;
if ($tokens <= 0) {
    wp_redirect('/pricing/');
    exit;
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Self Mapping Rendering</title>
    <link rel="stylesheet" href="TemplateData/style.css" />
    <link rel="stylesheet" href="css/ui.css" />
</head>

<body>
    <div id="root">
        <!-- Unity -->
        <div id="unity-container" class="unity-desktop">

            <div id="top-controls">
                <div class="ctrl">
                    <label for="renderScale">Quality</label>
                    <input type="range" id="renderScale" min="1" max="3" step="1" value="3" />
                    <span id="renderScaleVal">High</span>
                </div>

                <div class="ctrl">
                    <label for="rotation">Rotation</label>
                    <input type="range" id="rotation" min="0" max="360" step="1" value="0" />
                    <span id="rotationVal">0°</span>
                </div>
            </div>

<!-- BOTTOM RENDER BUTTON -->
    <button id="render-open-btn">Rendering</button>

    <!-- BOTTOM SHEET -->
    <div id="bottom-sheet" class="sheet-hidden">
        <div id="sheet-header">
            <div class="handle"></div>
            <h3>Render Settings</h3>
            <p class="hint">
                For best quality, try adjusting the <strong>Rotation</strong> slider before rendering.
            </p>
        </div>

        <div id="sheet-content">

            <div class="row check-group">
                <label class="pill">
                    <input type="checkbox" id="bs-background" checked>
                    Background (sky)
                </label>
            </div>

            <div class="row">
                <label>Resolution</label>
                <select id="bs-resolution">
                    <option value="1920x1080">1080p (1920×1080)</option>
                    <option value="2560x1440">1440p (2560×1440)</option>
                    <option value="3840x2160" selected>4K (3840×2160)</option>
                    <option value="7680x4320">8K (7680×4320)</option>
                    <option value="16000x9000">16K (16000x9000)</option>
                    <option value="custom">Custom…</option>
                </select>
            </div>

            <div id="bs-custom-res" style="display:none;margin-top:6px;">
                <div class="row">
                    <label>Width</label>
                    <input type="number" min="256" max="16000" value="4096" id="bs-width" class="bs-input">
                </div>
                <div class="row">
                    <label>Height</label>
                    <input type="number" min="256" max="16000" value="4096"  id="bs-height" class="bs-input">
                </div>
            </div>

            <button id="bs-render-btn" class="btn" style="margin-top:20px;">Render</button>
        </div>
    </div>

            <canvas id="unity-canvas" tabindex="-1"></canvas>
            <div id="unity-loading-bar">
                <div id="unity-logo"></div>
                <div id="unity-progress-bar-empty"><div id="unity-progress-bar-full"></div></div>
            </div>
            <div id="unity-warning"></div>
        </div>

        <!-- Side Panel -->
        <div id="side">

            <!-- AIRCRAFT -->
            <div class="card">
                <h3>Aircraft</h3>

                <div class="row">
                    <label>Type</label>
                    <div class="aselect" data-id="typeSelect">
                        <div class="aselect-display">Loading…</div>
                        <div class="aselect-options"></div>
                    </div>
                </div>

                <div class="row">
                    <label>Airline</label>
                    <div class="aselect" data-id="liverySelect">
                        <div class="aselect-display">— Select an Airline —</div>
                        <div class="aselect-options"></div>
                    </div>
                </div>

                <div class="row">
                    <label>Aircraft</label>
                    <div class="aselect" data-id="aircraftSelect">
                        <div class="aselect-display">— Select an Aircraft —</div>
                        <div class="aselect-options"></div>
                    </div>
                </div>
            </div>

            <!-- VIEWS -->
            <div class="card">
                <h3>Views</h3>

                <div id="viewsGrid" class="card-grid">
                    <span id="viewsSpin" class="spinner"></span>
                </div>
            </div>

            <!-- ENVIRONMENT -->
            <div class="card">
                <h3>Environment</h3>
                <div id="envGrid" class="card-grid">
                    <span id="envSpin" class="spinner"></span>
                </div>
            </div>

        </div>
    </div>

    <!-- Global render progress (blocking modal) -->
    <div id="progress-modal" class="modal" aria-hidden="true">
        <div class="modal-content">
            <h3 id="progress-title">Rendu en cours…</h3>
            <div class="progress-container">
                <div id="progress-bar"></div>
            </div>
            <p id="progress-message" class="muted">Initialisation…</p>
        </div>
    </div>

    <!-- Unity loader (will dynamically load SMR.loader.js) -->
    <script src="js/unity-loader.js"></script>
    <!-- API wrapper must load before UI -->
    <script src="js/api.js"></script>
    <script src="js/ui.js"></script>
</body>
</html>
