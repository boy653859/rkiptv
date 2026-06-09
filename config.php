<?php
// ============================================================
// config.php — Database & Admin Config
// ============================================================

define('DB_HOST',    'localhost');
define('DB_USER',    'root');         // আপনার MySQL username
define('DB_PASS',    '');             // আপনার MySQL password
define('DB_NAME',    'rkiptv');

define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'rk@admin123'); // এটা পরিবর্তন করুন!

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// DB সংযোগ
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed: ' . $conn->connect_error]);
    exit;
}
$conn->set_charset('utf8mb4');

function json_out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
