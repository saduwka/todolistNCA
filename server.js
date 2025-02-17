const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;

const app = express();
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

// Получить все задачи с пагинацией
app.get("/tasks", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const tasks = await readTasks();
  const paginatedTasks = tasks.slice(offset, offset + limit);

  res.json({
    tasks: paginatedTasks,
    totalPages: Math.ceil(tasks.length / limit),
  });
});

// Добавить новую задачу
app.post("/tasks", async (req, res) => {
  const tasks = await readTasks();
  const newTask = { id: Date.now(), completed: false, ...req.body };
  tasks.unshift(newTask);
  await writeTasks(tasks);
  res.json(newTask);
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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});
