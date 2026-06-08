<?php
require_once 'config.php';

$stmt = $pdo->query("SELECT * FROM transaksi ORDER BY created_at DESC");
$laporan = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($laporan);
?>