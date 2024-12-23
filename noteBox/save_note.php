<?php
$host = 'mysql.beget.com';
$dbname = 'y70784s1_notes';
$user = 'yy70784s1_notes';
$password = 'Milan1899!';

// Подключение к базе данных
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]));
}

// Получение данных из запроса
$data = json_decode(file_get_contents("php://input"), true);
$note = $data['note'] ?? '';

if (!empty($note)) {
    // Сохранение заметки в базу данных
    $stmt = $pdo->prepare("INSERT INTO notes (note_text) VALUES (:note_text)");
    $stmt->bindParam(':note_text', $note);
    $stmt->execute();

    echo json_encode(['status' => 'success', 'message' => 'Note saved']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'No note provided']);
}
?>
