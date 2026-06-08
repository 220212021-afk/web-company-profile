<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$transaksi = $data['transaksi'] ?? [];
$total = $data['total'] ?? 0;

$stmt = $pdo->prepare("INSERT INTO transaksi (data_transaksi, total, created_at) VALUES (?, ?, NOW())");
$stmt->execute([json_encode($transaksi), $total]);

echo json_encode([
    'success' => true, 
    'message' => 'Transaksi tersimpan',
    'id' => $pdo->lastInsertId()
]);
?>