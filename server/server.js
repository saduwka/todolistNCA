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
  const snapshot = await tasksCollection.orderBy("date", "desc").get(); // Сортировка по убыванию даты
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
  const newTask = {
    completed: false,
    date: new Date().toISOString(), 
    ...req.body,
  };
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

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN
  if (!token) {
    return res.status(401).json({ message: "Нет токена" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Добавляем пользователя в запрос
    next();
  } catch (error) {
    return res.status(403).json({ message: "Недействительный токен" });
  }
};

// Применяем защиту для задач
app.get("/tasks", verifyToken, async (req, res) => {
  try {
    const snapshot = await tasksCollection
      .where("userId", "==", req.user.uid) // Фильтруем по userId
      .orderBy("date", "desc")
      .get();
    
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении задач" });
  }
});

app.post("/tasks", verifyToken, async (req, res) => {
  const newTask = {
    userId: req.user.uid, // Привязываем задачу к пользователю
    completed: false,
    date: new Date().toISOString(),
    ...req.body,
  };
  const savedTask = await writeTask(newTask);
  res.json(savedTask);
});