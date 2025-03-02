const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(express.json());

// Инициализация Firebase Admin SDK
const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
console.log("Firebase credentials loaded:", firebaseCredentials);
admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

const db = admin.firestore();
const tasksCollection = db.collection("tasks");

// Читаем задачи из Firestore
const readTasks = async () => {
  const snapshot = await tasksCollection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Записываем новую задачу в Firestore
const writeTask = async (task) => {
  const docRef = await tasksCollection.add(task);
  return { id: docRef.id, ...task };
};

// Обновляем задачу в Firestore
const updateTask = async (id, updatedFields) => {
  await tasksCollection.doc(id).update(updatedFields);
  return { id, ...updatedFields };
};

// Удаляем задачу из Firestore
const deleteTask = async (id) => {
  await tasksCollection.doc(id).delete();
};

// Получить все задачи
app.get("/tasks", async (req, res) => {
  const tasks = await readTasks();
  res.json(tasks);
});

// Добавить новую задачу
app.post("/tasks", async (req, res) => {
  const newTask = { completed: false, ...req.body };
  const savedTask = await writeTask(newTask);
  res.json(savedTask);
});

// Обновление задачи
app.patch("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedTask = await updateTask(id, req.body);
    res.json(updatedTask);
  } catch (error) {
    res.status(404).json({ message: "Task not found" });
  }
});

// Удалить задачу
app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await deleteTask(id);
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ message: "Task not found" });
  }
});

const helmet = require('helmet');

// Добавляем Content Security Policy заголовки
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'none'"],
    imgSrc: ["'self'", "data:"],  // Разрешаем изображения через data URL (base64)
  }
}));

// Запускаем сервер
console.log("Starting server...");
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

// Не даем серверу завершиться (например, на Railway)
setInterval(() => {
  console.log("Server is running...");
}, 30000);
