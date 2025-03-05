const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const helmet = require("helmet");
require("dotenv").config();

const PORT = process.env.PORT || 8080;
const app = express();
app.use(cors());
app.use(express.json());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"],
      imgSrc: ["'self'", "data:"],
    },
  })
);

// Инициализация Firebase Admin SDK
try {
  const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials),
  });
} catch (error) {
  console.error("Ошибка загрузки Firebase Credentials", error);
  process.exit(1);
}

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
    return res.status(403).json({ message: "Недействительный токен" });
  }
};

// Получение всех задач пользователя
app.get("/tasks", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const tasksSnapshot = await tasksCollection
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
    if (!title) {
      return res.status(400).json({ message: "Заголовок обязателен" });
    }
    const userId = req.user.uid;
    const newTask = {
      title,
      description: description || "",
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
    if (!Object.keys(req.body).length) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }
    const taskRef = tasksCollection.doc(id);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data().userId !== req.user.uid) {
      return res.status(403).json({ message: "Нет доступа" });
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
    const taskRef = tasksCollection.doc(id);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data().userId !== req.user.uid) {
      return res.status(403).json({ message: "Нет доступа к удалению" });
    }
    await taskRef.delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при удалении задачи" });
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

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

server.keepAliveTimeout = 60000;