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
    $quality     = $_POST['quality'] ?? null;
    $mapping     = $_POST['mapping'] ?? null; // "mapping" or "rendering"

    // ---- TOKENS ----
    $tokens = intval(get_field('tokens', "user_$user_id"));

    if ($tokens <= 0) {
        wp_send_json(["success" => false, "redirect" => "/pricing/"]);
    }

    $field = acf_get_field('tokens');
    if (!$field || !isset($field['key'])) {
        wp_send_json([
            "success" => false,
            "error" => "ACCF field key not found for 'tokens'."
        ]);
    }

    $field_key = $field['key'];
    update_field($field_key, $tokens - 1, "user_$user_id");

    // ---- USER INFO ----
    $first_name = get_user_meta($user_id, 'first_name', true);
    $last_name  = get_user_meta($user_id, 'last_name', true);
    $user       = get_userdata($user_id);
    $email      = $user->user_email;

    // ---- LOG INSERTION ----
    global $wpdb;

    $wpdb->insert(
        'wp_studio_logs',
        [
            'user_id'             => $user_id,
            'type'                => $type,
            'airline'             => $airline,
            'aircraft'            => $aircraft,
            'view'                => $view,
            'environment'         => $environment,
            'quality'             => $quality,
            'mapping_or_rendering'=> $mapping,
            'created_at'          => current_time('mysql'),
            'first_name'          => $first_name,
            'last_name'           => $last_name,
            'email'               => $email
        ]
    );

    // ---- RESPONSE ----
    wp_send_json([
        "success" => true,
        "tokens_left" => $tokens - 1
    ]);