<?php
// FORCER AFFICHAGE ERREURS
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<pre>=== TEST STREAM ===\n";

// Charger WordPress
require_once("/opt/bitnami/wordpress/wp-load.php");

// Vérifier si Stream est chargé
echo "function_exists('stream_record') = ";
var_dump(function_exists('stream_record'));

echo "Active plugins:\n";
print_r(get_option('active_plugins'));


// Si Stream n'est pas chargé → stop
if (!function_exists('stream_record')) {
    echo "\n❌ stream_record() n'existe pas.\n";
    echo "➡ Cela veut dire que le plugin Stream n'est PAS activé.\n";
    echo "</pre>";
    exit;
}

// Tenter d'insérer un log
try {

    stream_record(
        'studio',         // context
        'test_render',    // action
        [
            'message' => 'Test log depuis test-stream.php',
            'random'  => rand(1, 999)
        ]
    );

    echo "\nTentative de log envoyée via stream_record().\n";

} catch (Throwable $e) {
    echo "\n❌ Exception attrapée :\n";
    echo $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    echo "</pre>";
    exit;
}

// Confirmation
echo "\nSi tout va bien, un log doit apparaître dans :";
echo "\n  WP Admin → Stream\n";
echo "\n=== FIN ===</pre>";
