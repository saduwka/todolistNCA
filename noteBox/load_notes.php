<?php
// Данные для подключения к базе
$host = 'mysql.beget.com';
$dbname = 'y70784s1_notes';
$user = 'yy70784s1_notes';
$password = 'Milan1899!';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]));
}

// Получение всех заметок из базы данных
$stmt = $pdo->query("SELECT note_text FROM notes ORDER BY created_at DESC");
$notes = $stmt->fetchAll(PDO::FETCH_COLUMN);

echo json_encode($notes);
?>
