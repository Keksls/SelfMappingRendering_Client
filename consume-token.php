<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('/opt/bitnami/wordpress/wp-load.php');
header('Content-Type: application/json');

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
do_action('aal_insert_log', [
    'action'         => 'studio_render',
    'object_type'    => 'Studio',
    'object_subtype' => $mapping ?: '',
    'object_name'    => sprintf(
        '%s (%s) rendered %s %s %s [%s] at %s',
        trim($first_name . ' ' . $last_name),
        $email,
        $airline,
        $aircraft,
        $view,
        $resolution,
        current_time('mysql')
    ),
    'user_id'        => $user_id,
]);

// ---- RESPONSE ----
wp_send_json([
    "success"     => true,
    "tokens_left" => $tokens - 1
]);