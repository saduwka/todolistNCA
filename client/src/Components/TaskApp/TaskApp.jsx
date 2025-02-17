import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./TaskApp.module.css";
import TaskList from "../TaskList/TaskList";
import TaskForm from "../TaskForm/TaskForm";
import TaskModal from "../TaskModal/TaskModal";
import TaskSearch from "../TaskSearch/TaskSearch";
import { motion } from "framer-motion";

const API_URL = "http://192.168.2.158:5000";
const TASKS_PER_PAGE = 5;

export default function TaskApp() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [editingTask, setEditingTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleTasksCount, setVisibleTasksCount] = useState(TASKS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) throw new Error("Ошибка загрузки данных");
      const data = await res.json();
      if (!Array.isArray(data.tasks)) throw new Error("Неверный формат данных");

      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    setVisibleTasksCount(TASKS_PER_PAGE); // Сбросим количество видимых задач при смене вкладки
  }, [activeTab]);

  const handleShowMore = () => {
    setVisibleTasksCount((prev) => prev + TASKS_PER_PAGE); // Увеличиваем количество отображаемых задач
  };

  const handleTaskAction = async (url, method, body = null) => {
    try {
      setLoading(true);
      setError("");
      const options = { method, headers: { "Content-Type": "application/json" } };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(url, options);
      if (!res.ok) throw new Error("Ошибка выполнения запроса");
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTask = ({ title, description }) => {
    handleTaskAction(`${API_URL}/tasks`, "POST", { title, description, completed: false, date: new Date().toISOString() });
  };

  const updateTask = ({ title, description }) => {
    if (!editingTask) return;
    handleTaskAction(`${API_URL}/tasks/${editingTask.id}`, "PATCH", { title, description });
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const toggleTask = (id) => handleTaskAction(`${API_URL}/tasks/${id}/toggle`, "PATCH");
  const deleteTask = (id) => window.confirm("Удалить задачу?") && handleTaskAction(`${API_URL}/tasks/${id}`, "DELETE");

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => (activeTab === "active" ? !task.completed : task.completed))
      .filter((task) => task.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tasks, activeTab, searchQuery]);

  const visibleTasks = filteredTasks.slice(0, visibleTasksCount); // Отображаем только количество задач, которое разрешено

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📝 Tasks</h1>
      {error && <p className={styles.error}>{error}</p>}

      <TaskForm onAdd={addTask} loading={loading} />
      <TaskSearch onSearch={setSearchQuery} />

      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === "active" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("active")}
        >
          <motion.span whileTap={{ scale: 0.9 }}>In Progress</motion.span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "completed" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <motion.span whileTap={{ scale: 0.9 }}>Completed</motion.span>
        </button>
      </div>

      {loading && <p className={styles.loading}>Загрузка...</p>}

      <TaskList tasks={visibleTasks} onEdit={(task) => { setEditingTask(task); setIsModalOpen(true); }} onToggle={toggleTask} onDelete={deleteTask} />

      {/* Кнопка Show More */}
      {filteredTasks.length > visibleTasksCount && (
        <button className={styles.showMoreButton} onClick={handleShowMore} disabled={loading}>
          {loading ? "Loading..." : "Show More"}
        </button>
      )}

      <TaskModal isOpen={isModalOpen} task={editingTask} onClose={() => setIsModalOpen(false)} onSave={updateTask} />
    </div>
  );
}
