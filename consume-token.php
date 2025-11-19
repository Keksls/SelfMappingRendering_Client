<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once('/opt/bitnami/wordpress/wp-load.php');
header('Content-Type: application/json');

// User not logged
if (!is_user_logged_in()) {
    echo json_encode(["success" => false, "redirect" => "/"]);
    exit;
}

$user_id = get_current_user_id();

// load ACF fields
$acf = get_fields("user_$user_id");
$tokens = isset($acf['tokens']) ? intval($acf['tokens']) : 0;

if ($tokens <= 0) {
    echo json_encode(["success" => false, "redirect" => "/pricing/"]);
    exit;
}

// decrease token
update_field('tokens', $tokens - 1, "user_$user_id");

echo json_encode([
    "success" => true,
    "tokens_left" => $tokens - 1
]);
exit;
