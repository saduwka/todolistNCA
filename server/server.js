const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const helmet = require("helmet");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

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

// Проверка наличия FIREBASE_CREDENTIALS
if (!process.env.FIREBASE_CREDENTIALS) {
  console.error("Ошибка: переменная окружения FIREBASE_CREDENTIALS не задана!");
  process.exit(1);
}

let firebaseCredentials;
try {
  firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} catch (error) {
  console.error("Ошибка парсинга FIREBASE_CREDENTIALS:", error.message);
  process.exit(1);
}

// Инициализация Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

const db = admin.firestore();
const tasksCollection = db.collection("tasks");

// Проверка работоспособности Firebase Auth
admin.auth().listUsers()
  .then(() => console.log("Firebase Auth работает"))
  .catch(error => {
    console.error("Ошибка Firebase Auth:", error.message);
    process.exit(1);
  });

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
    console.error("Ошибка получения задач:", error.message);
    res.status(500).json({ message: "Ошибка получения задач" });
  }
});

// Добавление новой задачи
app.post("/tasks", verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Название задачи обязательно" });
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
    console.error("Ошибка при создании задачи:", error.message);
    res.status(500).json({ message: "Ошибка при создании задачи" });
  }
});

// Обновление задачи
app.patch("/tasks/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await tasksCollection.doc(id).update(req.body);
    res.json({ id, ...req.body });
  } catch (error) {
    console.error("Ошибка при обновлении задачи:", error.message);
    res.status(404).json({ message: "Ошибка при обновлении задачи" });
  }
});

// Удаление задачи
app.delete("/tasks/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await tasksCollection.doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error("Ошибка при удалении задачи:", error.message);
    res.status(404).json({ message: "Ошибка при удалении задачи" });
  }
});

// Регистрация нового пользователя
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email и пароль обязательны" });
  }

  try {
    const userRecord = await admin.auth().createUser({ email, password });
    res.json({ uid: userRecord.uid, email: userRecord.email });
  } catch (error) {
    console.error("Ошибка регистрации:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// Логин (получение ID токена)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email и пароль обязательны" });
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(user.uid);
    res.json({ token: customToken });
  } catch (error) {
    console.error("Ошибка входа:", error.message);
    res.status(400).json({ message: "Неверный email или пароль" });
  }
});

// Запуск сервера
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

server.keepAliveTimeout = 60000;