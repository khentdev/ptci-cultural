<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/guards.php';

require_method('PUT');
require_admin();

$input = json_body();
$id = trim((string)($input['id'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($id === '') json_out(422, ['message' => 'An account id is required.']);
if (strlen($password) < 8) json_out(422, ['message' => 'Password must be at least 8 characters.']);

$safeId = mysqli_real_escape_string($conn, $id);
$exists = mysqli_query($conn, "SELECT id FROM users WHERE id = '$safeId'");
if (!$exists || mysqli_num_rows($exists) === 0) {
    json_out(404, ['message' => 'Account not found.']);
}

$hashed = mysqli_real_escape_string($conn, password_hash($password, PASSWORD_DEFAULT));
$result = mysqli_query($conn, "UPDATE users SET password = '$hashed' WHERE id = '$safeId'");

if (!$result) json_out(500, ['message' => 'Internal Server Error']);
json_out(200, ['message' => 'Password reset successfully.']);
