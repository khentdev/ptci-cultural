<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/guards.php';

require_method('PUT');
require_admin();

$input = json_body();
$id = trim((string)($input['id'] ?? ''));
if ($id === '') json_out(422, ['message' => 'An account id is required.']);

$safeId = mysqli_real_escape_string($conn, $id);
$exists = mysqli_query($conn, "SELECT id FROM users WHERE id = '$safeId'");
if (!$exists || mysqli_num_rows($exists) === 0) {
    json_out(404, ['message' => 'Account not found.']);
}

$result = mysqli_query($conn, "UPDATE users SET has_submitted = 0 WHERE id = '$safeId'");
if (!$result) json_out(500, ['message' => 'Internal Server Error']);

json_out(200, ['message' => 'Submission flag cleared.']);
