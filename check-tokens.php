<?php
require_once('/opt/bitnami/wordpress/wp-load.php');
header('Content-Type: application/json');

if (!is_user_logged_in()) {
    wp_send_json(["tokens" => 0]);
}

$user_id = get_current_user_id();
$tokens = intval(get_field('tokens', "user_$user_id"));

wp_send_json(["tokens" => $tokens]);