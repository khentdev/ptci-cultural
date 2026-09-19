<?php
// Session + CORS preamble must already have run (config/session_config.php).

function json_out($status, array $payload)
{
    http_response_code($status);
    echo json_encode(array_merge(['status' => $status], $payload));
    exit();
}

function json_body()
{
    $raw = file_get_contents("php://input");
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) return $decoded;
    return $_POST ?: [];
}

function require_login()
{
    if (!isset($_SESSION['user_id'])) {
        json_out(401, ['message' => 'You are not logged in.']);
    }
    return $_SESSION['user_id'];
}

function require_admin()
{
    require_login();
    if (($_SESSION['role'] ?? '') !== 'admin') {
        json_out(403, ['message' => 'Administrator access is required.']);
    }
    return $_SESSION['user_id'];
}

function require_method($method)
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_out(405, ['message' => $_SERVER['REQUEST_METHOD'] . ' Method Not Allowed']);
    }
}
