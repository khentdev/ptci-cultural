<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/guards.php';

require_method('PUT');
$userId = require_login();

$id = mysqli_real_escape_string($conn, (string)$userId);
$result = mysqli_query($conn, "UPDATE users SET has_submitted = 1 WHERE id = '$id'");

if (!$result) {
    json_out(500, ['message' => 'Internal Server Error']);
}

$_SESSION['has_submitted'] = 1;
json_out(200, ['message' => 'Submission recorded.', 'has_submitted' => true]);
