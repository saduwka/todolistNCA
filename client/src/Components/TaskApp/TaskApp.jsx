import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./TaskApp.module.css";
import TaskList from "../TaskList/TaskList";
import TaskForm from "../TaskForm/TaskForm";
import TaskModal from "../TaskModal/TaskModal";
import TaskSearch from "../TaskSearch/TaskSearch";
import { auth, signInWithGoogle, logOut } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";


const API_URL =
	"https://todolistnca-production.up.railway.app";

export default function TaskApp() {
	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [activeTab, setActiveTab] = useState("active");
	const [editingTask, setEditingTask] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [visibleTasksCount, setVisibleTasksCount] = useState(5); // Начинаем с 5 задач
	const [user, setUser] = useState(null);
	const navigate = useNavigate();


	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			console.log("currentUser:", currentUser);  // Добавь лог здесь
			setUser(currentUser);
			if (currentUser) {
				localStorage.setItem("token", currentUser.accessToken);
			} else {
				localStorage.removeItem("token");
			}
		});
		return () => unsubscribe();
	}, []);

	const token = localStorage.getItem("token");

	const handleLogout = async () => {
		try {
		  await logOut(); // Вызов выхода из Firebase
		  setTasks([]); // Очистить список задач
		  localStorage.removeItem("token"); // Удалить токен
		  navigate("/login"); // Перенаправить на страницу входа
		} catch (err) {
		  console.error("Ошибка выхода:", err);
		}
	  };
	  



	console.log("Токен перед отправкой запроса:", token);
	const fetchTasks = useCallback(async () => {
		try {
			setError("");
	
			const token = localStorage.getItem("token");
			if (!token) {
				throw new Error("Пользователь не авторизован");
			}
	
			const res = await fetch(`${API_URL}/tasks`, {
				headers: {
					"Authorization": `Bearer ${token}`, // 🔹 Передаем токен
				},
			});
	
			if (!res.ok) throw new Error("Ошибка загрузки данных");
			const data = await res.json();
	
			setTasks(data);
		} catch (err) {
			setError(err.message);
		}
	}, []);

	useEffect(() => {
		fetchTasks(false); // Без включения loading
		const interval = setInterval(() => {
			fetchTasks(false);
		}, 5000);
		return () => clearInterval(interval);
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

	const handleTaskAction = async (url, requestMethod, body = null) => {
		try {
			setLoading(true);
			setError("");
	
			const token = localStorage.getItem("token");
			if (!token) throw new Error("Пользователь не авторизован");
	
			const options = {
				method: requestMethod,  // <-- Исправлено: используем requestMethod вместо method
				headers: { 
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				body: body ? JSON.stringify(body) : null,
			};
	
			const res = await fetch(url, options);
			if (!res.ok) throw new Error("Ошибка выполнения запроса");
	
			await fetchTasks(true); // Обновление списка задач
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const addTask = async ({ title, description }) => {
		try {
			setLoading(true);
			setError("");
	
			const token = localStorage.getItem("token");
			if (!token) throw new Error("Пользователь не авторизован");
	
			const newTask = {
				title,
				description,
				completed: false,
				date: new Date().toISOString(),
				userId: user?.uid, // 🔹 Добавляем userId
			};
	
			const res = await fetch(`${API_URL}/tasks`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}` // 🔹 Передаем токен
				},
				body: JSON.stringify(newTask),
			});
	
			if (!res.ok) throw new Error("Ошибка добавления задачи");
	
			const savedTask = await res.json();
			setTasks((prevTasks) => [savedTask, ...prevTasks]);
			setVisibleTasksCount((prev) => prev + 1);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const toggleTask = async (task) => {
    try {
        const updatedTask = { completed: !task.completed };
        const token = localStorage.getItem("token");
		if (!token) throw new Error("Пользователь не авторизован");

        const res = await fetch(`${API_URL}/tasks/${task.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(updatedTask),
        });

        if (!res.ok) throw new Error("Ошибка при переключении задачи");

        fetchTasks(true);
    } catch (err) {
        setError(err.message);
    }
};

const updateTask = async (task) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Пользователь не авторизован");

        const res = await fetch(`${API_URL}/tasks/${task.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // 🔹 Передаем токен
            },
            body: JSON.stringify(task),
        });

        if (!res.ok) throw new Error("Ошибка обновления задачи");

        fetchTasks(true);
    } catch (err) {
        console.error("Ошибка обновления задачи:", err);
    }
};

const deleteTask = (id) => {
    if (window.confirm("Удалить задачу?")) {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Пользователь не авторизован");
            return;
        }

        handleTaskAction(`${API_URL}/tasks/${id}`, "DELETE", null, token);
    }
};

	const handleTabChange = (tab) => {
		setActiveTab(tab);
	};

	const handleModalClose = () => {
		if (!user) return; // Убедись, что модалка закрывается только после получения пользователя
		setIsModalOpen(false);
		setEditingTask(null);
	};

	const activeTasksCount = tasks.filter((task) => !task.completed).length;
	const completedTasksCount = tasks.filter((task) => task.completed).length;

	return (
		<>
    <div className={styles.container}>
		<div className={styles.header}>
   			<h1 className={styles.title}>📝 Tasks</h1>{user ? (
				<div className={styles.userInfo}>
            		<img src={user.photoURL} alt="Avatar" className={styles.avatar} />
            			<span>{user.displayName}</span>
							<button onClick={handleLogout} className={styles.authButton}>Log out</button>
        </div>
    ) : (
        <button className={styles.buttonGoogle} onClick={signInWithGoogle}>
  			<img src="https://www.google.com/favicon.ico" alt="Google logo" />
  			Sign in with Google
			</button>
    )}
	</div>
        {error && <p className={styles.error}>{error}</p>}

        <TaskForm onAdd={addTask} loading={loading} />
        <TaskSearch onSearch={setSearchQuery} />

        <div className={styles.tabs}>
			<button
				className={`${styles.tabButton} ${activeTab === "active" ? styles.activeTab : ""}`}
				onClick={() => setActiveTab("active")}>In Progress ({activeTasksCount})
			</button>
			<button
				className={`${styles.tabButton} ${activeTab === "completed" ? styles.activeTab : ""}`}
				onClick={() => setActiveTab("completed")}>Completed ({completedTasksCount})
			</button>
        </div>
		{loading && (
			<div className={styles.loaderOverlay}>
				<div className={styles.loader}></div>
			</div>
		)}

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
		
   
		<div className={styles.footer}>
			Made with <span className={styles.heart}>❤️</span> by SADuwka
		</div>

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
