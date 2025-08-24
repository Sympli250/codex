<?php
$file = __DIR__ . '/validated_responses.json';
header('Content-Type: application/json; charset=utf-8');
if (file_exists($file)) {
    readfile($file);
} else {
    echo json_encode([]);
}
