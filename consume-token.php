<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once('/opt/bitnami/wordpress/wp-load.php');
header('Content-Type: application/json');

if (!is_user_logged_in()) {
    wp_send_json(["success" => false, "redirect" => "/"]);
}

$user_id = get_current_user_id();

// 1. Load tokens
$tokens = intval(get_field('tokens', "user_$user_id"));

// 2. Prevent invalid usage
if ($tokens <= 0) {
    wp_send_json(["success" => false, "redirect" => "/pricing/"]);
}

// 3. Retrieve field key automatically
$field = acf_get_field('tokens');
if (!$field || !isset($field['key'])) {
    wp_send_json([
        "success" => false,
        "error" => "ACF field key not found for 'tokens'."
    ]);
}

$field_key = $field['key'];

// 4. Update correctly with field key
update_field($field_key, $tokens - 1, "user_$user_id");

// 5. Output
wp_send_json([
    "success" => true,
    "tokens_left" => $tokens - 1
]);
