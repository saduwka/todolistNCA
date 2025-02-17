const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const http = require("http");  // Для работы с сервером WebSocket
const WebSocket = require("ws");  // Для работы с WebSocket

const app = express();
const server = http.createServer(app);  // Используем http сервер для WebSocket
const PORT = 5000;
const TASKS_FILE = "tasks.json";

app.use(cors());
app.use(express.json());

// Читаем задачи из файла
const readTasks = async () => {
  try {
    await fs.access(TASKS_FILE);
    const data = await fs.readFile(TASKS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    await fs.writeFile(TASKS_FILE, "[]");
    return [];
  }
};

// Записываем задачи в файл
const writeTasks = async (tasks) => {
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
};

// Создаем WebSocket сервер
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  // Обработка сообщений от клиента
  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
  });

  // Отправка сообщения клиенту
  ws.send("Welcome to the WebSocket server!");
});

// Получить все задачи с пагинацией
app.get("/tasks", async (req, res) => {
  const tasks = await readTasks();
  res.json(tasks);  // Просто отправляем все задачи
});

// Добавить новую задачу
app.post("/tasks", async (req, res) => {
  const tasks = await readTasks();
  const newTask = { id: Date.now(), completed: false, ...req.body };
  tasks.unshift(newTask);
  await writeTasks(tasks);
  res.json(newTask);

  // Отправляем уведомление через WebSocket, если нужно
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("A new task has been added.");
    }
  });
});

// Обновить задачу (PATCH - частичное обновление)
// Переключить состояние задачи
app.patch("/tasks/:id/toggle", async (req, res) => {
  let tasks = await readTasks();
  const { id } = req.params;

  let task = tasks.find((task) => task.id == id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  // Переключаем состояние задачи
  task.completed = !task.completed;

  await writeTasks(tasks);
  res.json(task);

  // Отправляем уведомление через WebSocket, если нужно
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(`Task ${id} status has been updated.`);
    }
  });
});

// Удалить задачу
app.delete("/tasks/:id", async (req, res) => {
  let tasks = await readTasks();
  const newTasks = tasks.filter((task) => task.id != req.params.id);

  if (tasks.length === newTasks.length) {
    return res.status(404).json({ message: "Task not found" });
  }

  await writeTasks(newTasks);
  res.json({ success: true });

  // Отправляем уведомление через WebSocket, если нужно
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(`Task ${req.params.id} has been deleted.`);
    }
  });
});

// Запуск сервера
server.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});
