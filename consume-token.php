<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once('/opt/bitnami/wordpress/wp-load.php');
header('Content-Type: application/json');

// ---------------------------------------------------------
// 1. Auth check
// ---------------------------------------------------------
if (!is_user_logged_in()) {
    wp_send_json(["success" => false, "redirect" => "/"]);
}

$user_id = get_current_user_id();

// ---------------------------------------------------------
// 2. Retrieve POST parameters from frontend
// ---------------------------------------------------------
$type        = $_POST['type'] ?? null;
$airline     = $_POST['airline'] ?? null;
$aircraft    = $_POST['aircraft'] ?? null;
$view        = $_POST['view'] ?? null;
$environment = $_POST['environment'] ?? null;
$resolution  = $_POST['resolution'] ?? null;
$mapping     = $_POST['mapping'] ?? null; // "mapping" or "rendering"

// ---------------------------------------------------------
// 3. Token check
// ---------------------------------------------------------
$tokens = intval(get_field('tokens', "user_$user_id"));

if ($tokens <= 0) {
    wp_send_json(["success" => false, "redirect" => "/pricing/"]);
}

$field = acf_get_field('tokens');
if (!$field || !isset($field['key'])) {
    wp_send_json([
        "success" => false,
        "error" => "ACF field key not found for 'tokens'."
    ]);
}

$field_key = $field['key'];
update_field($field_key, $tokens - 1, "user_$user_id");

// ---------------------------------------------------------
// 4. User info
// ---------------------------------------------------------
$first_name = get_user_meta($user_id, 'first_name', true);
$last_name  = get_user_meta($user_id, 'last_name', true);
$user       = get_userdata($user_id);
$email      = $user->user_email;

// ---------------------------------------------------------
// 5. SIMPLE HISTORY LOG
// ---------------------------------------------------------
if (function_exists('SimpleLogger')) {

    SimpleLogger()->info('Studio Render performed', [
        'User ID'     => $user_id,
        'User'        => trim($first_name . ' ' . $last_name),
        'Email'       => $email,
        'Type'        => $type,
        'Airline'     => $airline,
        'Aircraft'    => $aircraft,
        'View'        => $view,
        'Environment' => $environment,
        'Resolution'  => $resolution,
        'Mode'        => $mapping,
        'Tokens left' => $tokens - 1,
    ]);
}

// ---------------------------------------------------------
// 6. Response
// ---------------------------------------------------------
wp_send_json([
    "success" => true,
    "tokens_left" => $tokens - 1
]);