<?php
// Afficher toutes les erreurs en sortie HTML
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Charger WordPress
require_once('/opt/bitnami/wordpress/wp-load.php');

echo "<pre>";

// 1. Vérifier que la fonction existe
echo "function_exists('aal_insert_log') = ";
var_dump(function_exists('aal_insert_log'));

// 2. Si elle existe, tenter un log simple
if (function_exists('aal_insert_log')) {
    $res = aal_insert_log([
        'action'         => 'studio_test',
        'object_type'    => 'Studio',
        'object_name'    => 'Test log depuis test-aal.php',
        'object_subtype' => 'test',
        'user_id'        => get_current_user_id(), // 0 si pas connecté
    ]);

    echo "\nRésultat de aal_insert_log(): ";
    var_dump($res);
} else {
    echo "\n⚠️ aal_insert_log n'existe pas, donc le plugin n'est pas chargé.\n";
}

echo "\nTerminé.\n</pre>";
