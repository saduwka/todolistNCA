const express = require("express");
const app = express();
const path = require("path");

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname)));

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
