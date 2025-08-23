# SMR WebGL — UI Prod Ready

## Structure
```
webroot/
  index.html
  css/
    ui.css
  js/
    unity-loader.js
    api.js
    ui.js
  TemplateData/
    (fichiers Unity existants)
  SMR.data / SMR.framework.js / SMR.wasm / SMR.loader.js (fichiers Unity)
```

## Configuration
- Par défaut, l'API est appelée en **même origine** (ex: `/types`). Pour servir sur un sous-chemin, exposez globalement :
  ```html
  <script>window.API_BASE='/api';</script>
  ```
  avant `js/api.js` (ou bien montez le backend à la racine).

- Pour les assets Unity dans un sous-dossier, exposez :
  ```html
  <script>window.UNITY_BUILD_PREFIX='/build';</script>
  ```
  pour que `unity-loader.js` charge `/build/SMR.*` et `/build/StreamingAssets`.

## Notes
- Les `select` sont liés en cascade : Types → Familles → Aircrafts → Livrées.
- Les erreurs réseau sont logguées dans la console intégrée.
- Le bouton **Importer** envoie `ImportFromJson(string json)` vers le GameObject `Engine` (modifiable dans `ui.js`).

## Sécurité / prod
- En prod, activez la compression statique (gzip/brotli) pour `.data`/`.wasm`/`.js`.
- CORS : si l’API est sur un autre domaine, configurez les en-têtes `Access-Control-Allow-Origin` et servez en HTTPS.
