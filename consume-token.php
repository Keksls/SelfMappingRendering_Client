<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once('/opt/bitnami/wordpress/wp-load.php');
header('Content-Type: application/json');

if (function_exists('aal_insert_log')) {
    aal_insert_log([
        'action'      => 'test_log',
        'object_type' => 'Studio',
        'object_name' => 'Test entry OK',
        'user_id'     => 0
    ]);
    error_log("Test log inserted");
} else {
    error_log("aal_insert_log NOT FOUND");
}

if (!is_user_logged_in()) {
    wp_send_json(["success" => false, "redirect" => "/"]);
}

$user_id = get_current_user_id();

// ---- Retrieve POST parameters from the Studio frontend ----
$type        = $_POST['type'] ?? null;
$airline     = $_POST['airline'] ?? null;
$aircraft    = $_POST['aircraft'] ?? null;
$view        = $_POST['view'] ?? null;
$environment = $_POST['environment'] ?? null;
$resolution  = $_POST['resolution'] ?? null; // ex: "4096x2160"
$mapping     = $_POST['mapping'] ?? null;    // "mapping" or "rendering"

// ---- TOKENS ----
$tokens = intval(get_field('tokens', "user_$user_id"));

if ($tokens <= 0) {
    wp_send_json(["success" => false, "redirect" => "/pricing/"]);
}

$field = acf_get_field('tokens');
if (!$field || !isset($field['key'])) {
    wp_send_json([
        "success" => false,
        "error"   => "ACF field key not found for 'tokens'."
    ]);
}

$field_key = $field['key'];
update_field($field_key, $tokens - 1, "user_$user_id");

// ---- USER INFO ----
$first_name = get_user_meta($user_id, 'first_name', true);
$last_name  = get_user_meta($user_id, 'last_name', true);
$user       = get_userdata($user_id);
$email      = $user->user_email;

// ---- ACTIVITY LOG (Aryo Activity Log) ----
error_log("CHECK: aal_insert_log exists? " . (function_exists('aal_insert_log') ? "YES" : "NO"));
// On logue un événement custom dans le plugin "Activity Log"
if (function_exists('aal_insert_log')) {

    // Message humain lisible dans le tableau
    $message = sprintf(
        'Studio render by %s (%s) | Type: %s | Airline: %s | Aircraft: %s | View: %s | Env: %s | Resolution: %s | Mode: %s | Tokens left: %d',
        trim($first_name . ' ' . $last_name),
        $email,
        $type ?: '-',
        $airline ?: '-',
        $aircraft ?: '-',
        $view ?: '-',
        $environment ?: '-',
        $resolution ?: '-',
        $mapping ?: '-',
        $tokens - 1
    );

    aal_insert_log([
        'action'         => 'studio_render', // notre “type” d’action
        'object_type'    => 'Studio',        // pour filtrer facilement dans l’UI
        'object_name'    => $message,        // affiché dans la colonne principale
        'object_subtype' => $mapping ?: '',  // ex: "rendering" ou "mapping"
        'user_id'        => $user_id,
    ]);
}

// ---- RESPONSE ----
wp_send_json([
    "success"     => true,
    "tokens_left" => $tokens - 1
]);