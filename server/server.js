const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const admin = require("firebase-admin");
require("dotenv").config();

const PORT = process.env.PORT || 5001;

// Инициализация Firebase Admin SDK
const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});
const db = admin.firestore();
const tasksCollection = db.collection("tasks");

const app = express();
app.use(cors());
app.use(express.json());

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

// Запускаем HTTP сервер и WebSocket сервер
console.log("Starting server...");
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
const wss = new WebSocket.Server({ server });

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

  // Уведомление по WebSocket
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "new_task", task: savedTask }));
    }
  });
});

// Обновление задачи
app.patch("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedTask = await updateTask(id, req.body);
    res.json(updatedTask);

    // Уведомление по WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "update_task", task: updatedTask }));
      }
    });
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

    // Уведомление по WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "delete_task", id }));
      }
    });
  } catch (error) {
    res.status(404).json({ message: "Task not found" });
  }
});

// WebSocket соединение
wss.on("connection", (ws, req) => {
  console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);

  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
  });

  // Пинг для поддержания соединения
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping" }));
    }
  }, 30000);

  ws.on("close", () => {
    console.log(`WebSocket connection closed: ${req.socket.remoteAddress}`);
    clearInterval(interval);
  });

  ws.send("Connected to WebSocket server!");
});