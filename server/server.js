const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const helmet = require("helmet");
require("dotenv").config();

const PORT = process.env.PORT || 8080;

const app = express();

// Настройки CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://client-saduwka-saduwkas-projects.vercel.app"); // Разрешаем все домены (лучше указать конкретный)
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end(); // Завершаем preflight-запрос
    return;
  }
  next();
});

app.use(express.json());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://todolistnca-production.up.railway.app"],
    },
  })
);

// Инициализация Firebase Admin SDK
const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

const db = admin.firestore();
const tasksCollection = db.collection("tasks");

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Нет токена" });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Недействительный токен" }); // <- Здесь return
  }
};

// Получение всех задач пользователя
app.get("/tasks", verifyToken, async (req, res) => {
  try {
      const userId = req.user.uid;
      const tasksSnapshot = await db.collection("tasks")
          .where("userId", "==", userId)
          .orderBy("date", "desc")
          .get();

      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(tasks);
  } catch (error) {
      res.status(500).json({ message: "Ошибка получения задач" });
  }
});

// Добавление новой задачи
app.post("/tasks", verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.uid;
    const newTask = {
      title,
      description,
      completed: false,
      date: new Date().toISOString(),
      userId,
    };
    const docRef = await tasksCollection.add(newTask);
    res.status(201).json({ id: docRef.id, ...newTask });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при создании задачи" });
  }
});

// Обновление задачи
app.patch("/tasks/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const taskRef = tasksCollection.doc(id);
    const task = await taskRef.get();

    if (!task.exists) {
      return res.status(404).json({ message: "Задача не найдена" });
    }

    // Проверяем, что задача принадлежит текущему пользователю
    if (task.data().userId !== req.user.uid) {
      return res.status(403).json({ message: "Нет доступа к этой задаче" });
    }

    await taskRef.update(req.body);
    res.json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при обновлении задачи" });
  }
});

// Удаление задачи
app.delete("/tasks/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await tasksCollection.doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ message: "Ошибка при удалении задачи" });
  }
});

// Регистрация нового пользователя
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    res.json({ uid: userRecord.uid, email: userRecord.email });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Логин (получение ID токена)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(user.uid);
    res.json({ token: customToken });
  } catch (error) {
    res.status(400).json({ message: "Неверный email или пароль" });
  }
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

server.keepAliveTimeout = 60000;