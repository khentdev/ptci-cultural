<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . '/../../config/guards.php';
include __DIR__ . '/functions.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH'], true)) {
    json_out(405, ['message' => $_SERVER['REQUEST_METHOD'] . ' Method Not Allowed']);
}
require_admin();

echo updateContestant(json_body());
