const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const WebSocket = require("ws");

const PORT = 5000;
const TASKS_FILE = "tasks.json";

const app = express();
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

// Создаем HTTP сервер и WebSocket сервер
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

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

// Обновление задачи (включая переключение статуса)
app.patch("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  let tasks = await readTasks();

  const taskIndex = tasks.findIndex((task) => task.id == id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  // Обновляем только те поля, которые приходят в запросе
  const updatedTask = {
    ...tasks[taskIndex],
    ...req.body, // Если приходит поле completed, то оно также будет обновлено
  };

  tasks[taskIndex] = updatedTask;

  await writeTasks(tasks);
  res.json(updatedTask);  // Возвращаем обновленную задачу
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
});

// Обработчик для WebSocket подключений
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
  });

  ws.send("Connected to WebSocket server!");
});
