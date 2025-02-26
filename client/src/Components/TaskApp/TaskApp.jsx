import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./TaskApp.module.css";
import TaskList from "../TaskList/TaskList";
import TaskForm from "../TaskForm/TaskForm";
import TaskModal from "../TaskModal/TaskModal";
import TaskSearch from "../TaskSearch/TaskSearch";
import { motion } from "framer-motion";

const API_URL = "http://192.168.2.12:5000";

export default function TaskApp() {
	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [activeTab, setActiveTab] = useState("active");
	const [editingTask, setEditingTask] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [visibleTasksCount, setVisibleTasksCount] = useState(5); // Начинаем с 5 задач

	const fetchTasks = useCallback(async () => {
		try {
			setError("");
			setLoading(true);
			const res = await fetch(`${API_URL}/tasks`);
			if (!res.ok) throw new Error("Ошибка загрузки данных");
			const data = await res.json();

			if (Array.isArray(data)) {
				setTasks(data);
			} else if (Array.isArray(data.tasks)) {
				setTasks(data.tasks);
			} else {
				throw new Error("Неверный формат данных");
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchTasks();
	}, [fetchTasks]);

	const filteredTasks = useMemo(() => {
		return tasks.filter((task) => {
			const isStatusMatch =
				activeTab === "active" ? !task.completed : task.completed;
			const isSearchMatch = task.title
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
			return isStatusMatch && isSearchMatch;
		});
	}, [tasks, activeTab, searchQuery]);

	const visibleTasks = filteredTasks.slice(0, visibleTasksCount);

	const loadMoreTasks = () => {
		setVisibleTasksCount((prevCount) => prevCount + 5);
	};

	const handleTaskAction = async (url, method, body = null) => {
		try {
			setLoading(true);
			setError("");
			const options = {
				method,
				headers: { "Content-Type": "application/json" },
			};
			if (body) options.body = JSON.stringify(body);

			const res = await fetch(url, options);
			console.log("Response:", res);
			if (!res.ok) throw new Error("Ошибка выполнения запроса");

			await fetchTasks();
		} catch (err) {
			setError(err.message);
			console.error("Error:", err.message);
		} finally {
			setLoading(false);
		}
	};

	const addTask = ({ title, description }) => {
		handleTaskAction(`${API_URL}/tasks`, "POST", {
			title,
			description,
			completed: false,
			date: new Date().toISOString(),
		});
	};

	const toggleTask = async (task) => {
		try {
			const updatedTask = { completed: !task.completed };
			const res = await fetch(`${API_URL}/tasks/${task.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updatedTask),
			});

			if (!res.ok) throw new Error("Ошибка при переключении задачи");

			fetchTasks();
		} catch (err) {
			console.error("Ошибка обновления задачи:", err);
		}
	};

	const updateTask = async (task) => {
		try {
			const res = await fetch(`${API_URL}/tasks/${task.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(task),
			});

			if (!res.ok) throw new Error("Ошибка обновления задачи");

			fetchTasks();
		} catch (err) {
			console.error("Ошибка обновления задачи:", err);
		}
	};

	const deleteTask = (id) =>
		window.confirm("Удалить задачу?") &&
		handleTaskAction(`${API_URL}/tasks/${id}`, "DELETE");

	const handleTabChange = (tab) => {
		setActiveTab(tab);
	};

	const handleModalClose = () => {
		setIsModalOpen(false);
		setEditingTask(null);
	};

	const activeTasksCount = tasks.filter((task) => !task.completed).length;
	const completedTasksCount = tasks.filter((task) => task.completed).length;

	return (
		<>
			<div className={styles.animatedBackground}></div>{" "}
			{/* Фон отдельным слоем */}
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
						<motion.span whileTap={{ scale: 0.9 }}>
							In Progress ({activeTasksCount})
						</motion.span>
					</button>
					<button
						className={`${styles.tabButton} ${activeTab === "completed" ? styles.activeTab : ""}`}
						onClick={() => setActiveTab("completed")}
					>
						<motion.span whileTap={{ scale: 0.9 }}>
							Completed ({completedTasksCount})
						</motion.span>
					</button>
				</div>

				{loading && <p className={styles.loading}>Загрузка...</p>}

				<TaskList
					tasks={visibleTasks}
					onEdit={(task) => {
						setEditingTask(task);
						setIsModalOpen(true);
					}}
					onToggle={toggleTask}
					onDelete={deleteTask}
				/>

				<button
					className={styles.showMoreButton}
					onClick={loadMoreTasks}
					disabled={visibleTasksCount >= filteredTasks.length}
				>
					Show More
				</button>

				<TaskModal
					isOpen={isModalOpen}
					task={editingTask}
					onClose={handleModalClose}
					onSave={updateTask}
				/>
			</div>
		</>
	);
}
