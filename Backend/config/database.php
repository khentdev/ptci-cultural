<?php
// Defaults match the shared-hosting configuration; override with environment
// variables locally (DB_HOST / DB_USER / DB_PASS / DB_NAME).
$host = getenv('DB_HOST') ?: "localhost";
$username = getenv('DB_USER') ?: "root";
$password = getenv('DB_PASS') ?: "";
$dbname = getenv('DB_NAME') ?: "ptci_cultural";

// PHP 8.1+ makes mysqli throw on failure, so a bare `if (!$conn)` never runs and
// the client gets an empty 500 body instead of JSON.
try {
    $conn = mysqli_connect($host, $username, $password, $dbname);
} catch (Throwable $e) {
    $conn = null;
}

if (!$conn) {
    if (!headers_sent()) {
        header('Content-Type: application/json');
        http_response_code(500);
    }
    die(json_encode(['status' => 500, 'message' => 'Database connection failed']));
}

mysqli_set_charset($conn, 'utf8mb4');
