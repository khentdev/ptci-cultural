<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/guards.php';

require_method('PUT');
$actorId = require_admin();

$input = json_body();
$id = trim((string)($input['id'] ?? ''));
$isActive = $input['is_active'] ?? null;

if ($id === '') json_out(422, ['message' => 'An account id is required.']);
if (!is_bool($isActive) && !in_array($isActive, [0, 1, '0', '1'], true)) {
    json_out(422, ['message' => 'is_active must be true or false.']);
}
if ((string)$id === (string)$actorId) {
    json_out(422, ['message' => 'You cannot deactivate your own account.']);
}

$safeId = mysqli_real_escape_string($conn, $id);
$value = filter_var($isActive, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

$exists = mysqli_query($conn, "SELECT id FROM users WHERE id = '$safeId'");
if (!$exists || mysqli_num_rows($exists) === 0) {
    json_out(404, ['message' => 'Account not found.']);
}

$result = mysqli_query($conn, "UPDATE users SET is_active = $value WHERE id = '$safeId'");
if (!$result) json_out(500, ['message' => 'Internal Server Error']);

json_out(200, ['message' => $value ? 'Account activated.' : 'Account deactivated.']);
