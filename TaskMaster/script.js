let tasks = [];
const tasksPerPage = 5;
let currentPage = 1;
let activeTab = "incomplete";

const fileInput = document.getElementById("fileInput");
const saveToFileButton = document.getElementById("saveToFile");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const addTaskButton = document.getElementById("addTask");
const searchInput = document.getElementById("searchInput");
const taskList = document.getElementById("taskList");
const paginationContainer = document.getElementById("pagination");
const taskTabsBtn = document.querySelector("#taskTabs");

fileInput.addEventListener("change", loadTasksFromFile);
saveToFileButton.addEventListener("click", saveTasksToFile);
addTaskButton.addEventListener("click", addTask);
searchInput.addEventListener("input", () => {
	currentPage = 1;
	renderTasks();
});
taskTitle.addEventListener("keydown", function (e) {
	if (e.key === "Enter") {
		addTask();
	}
});

document.getElementById("upload-file").addEventListener("click", function () {
	document.getElementById("fileInput").click();
});

document
	.getElementById("fileInput")
	.addEventListener("change", function (event) {
		taskTabsBtn.style.display = "flex";
		taskList.style.display = "flex";
		const fileName = event.target.files[0]
			? event.target.files[0].name
			: "No file chosen";
	});

function addTask() {
	if (taskTitle.value) {
		const currentDate = new Date().toISOString().split("T")[0];
		tasks.unshift({
			title: taskTitle.value,
			description: taskDescription.value,
			date: currentDate,
			completed: false,
		});
		renderTasks();
		clearInputs();
	} else {
		alert("Please fill in the title.");
	}
}

function switchTab(tab) {
	const incompleteTab = document.getElementById("incompleteTab");
	const completedTab = document.getElementById("completedTab");
	const incompleteTasks = document.getElementById("incompleteTasks");
	const completedTasks = document.getElementById("completedTasks");

	// Переключаем вкладки
	if (tab === "incomplete") {
		activeTab = "incomplete"; // Обновляем активную вкладку
		incompleteTab.classList.add("active");
		completedTab.classList.remove("active");
		incompleteTasks.style.display = "block";
		completedTasks.style.display = "none";
	} else if (tab === "completed") {
		activeTab = "completed"; // Обновляем активную вкладку
		completedTab.classList.add("active");
		incompleteTab.classList.remove("active");
		completedTasks.style.display = "block";
		incompleteTasks.style.display = "none";
	}
	currentPage = 1; // Сбрасываем страницу на первую
	renderTasks(); // Перерисовываем задачи
}

function renderTasks() {
	const searchTerm = searchInput.value.toLowerCase();
	const incompleteTasksContainer = document.getElementById("incompleteTasks");
	const completedTasksContainer = document.getElementById("completedTasks");

	// Очищаем контейнеры
	incompleteTasksContainer.innerHTML = "";
	completedTasksContainer.innerHTML = "";

	// Фильтруем задачи по поисковому запросу
	const filteredTasks = tasks.filter(
		(task) =>
			task.title.toLowerCase().includes(searchTerm) ||
			task.description.toLowerCase().includes(searchTerm),
	);

	// Определяем активную вкладку и разделяем задачи
	const activeTabTasks =
		activeTab === "incomplete"
			? filteredTasks.filter((task) => !task.completed)
			: filteredTasks.filter((task) => task.completed);

	// Определяем индексы задач для текущей страницы
	const startIndex = (currentPage - 1) * tasksPerPage;
	const endIndex = startIndex + tasksPerPage;
	const tasksToDisplay = activeTabTasks.slice(startIndex, endIndex);

	// Отображаем задачи
	tasksToDisplay.forEach((task, index) => {
		const globalIndex = tasks.indexOf(task); // Получаем глобальный индекс
		const taskElement = document.createElement("div");
		taskElement.className = `task ${task.completed ? "completed" : ""}`;
		taskElement.innerHTML = `
      <h3 class="task-title">${task.title}</h3>
      <p class="task-description">${task.description}</p>
      <p><strong>Date:</strong> ${task.date}</p>
      <button onclick="toggleTask(${globalIndex})">${
			task.completed ? "Incomplete" : "Complete"
		}</button>
      <button onclick="editTask(${globalIndex})">Edit</button>
      <button onclick="confirmDelete(${globalIndex})">Delete</button>
    `;
		// Размещаем задачу в соответствующем контейнере
		if (task.completed) {
			completedTasksContainer.appendChild(taskElement);
		} else {
			incompleteTasksContainer.appendChild(taskElement);
		}
	});

	// Отрисовка пагинации
	renderPagination(activeTabTasks.length);
}

function clearInputs() {
	taskTitle.value = "";
	taskDescription.value = "";
}

function toggleTask(globalIndex) {
	tasks[globalIndex].completed = !tasks[globalIndex].completed;
	currentPage = 1;
	renderTasks();
}

function editTask(globalIndex) {
	const task = tasks[globalIndex];

	// Проверяем, если элементы уже редактируемы
	const taskElement = document.querySelector(
		`.task:nth-child(${globalIndex + 1})`,
	);

	if (!taskElement) {
		console.error("Task element not found.");
		return;
	}

	const titleElement = taskElement.querySelector(".task-title");
	const descriptionElement = taskElement.querySelector(".task-description");

	if (titleElement.hasAttribute("contenteditable")) {
		// Завершаем редактирование
		task.title = titleElement.innerText;
		task.description = descriptionElement.innerText;

		titleElement.removeAttribute("contenteditable");
		descriptionElement.removeAttribute("contenteditable");
		titleElement.classList.remove("editable-field");
		descriptionElement.classList.remove("editable-field");

		const editButton = taskElement.querySelector("button:nth-child(2)");
		editButton.textContent = "Edit";
	} else {
		// Начинаем редактирование
		titleElement.setAttribute("contenteditable", "true");
		descriptionElement.setAttribute("contenteditable", "true");
		titleElement.classList.add("editable-field");
		descriptionElement.classList.add("editable-field");

		const editButton = taskElement.querySelector("button:nth-child(2)");
		editButton.textContent = "Save";

		titleElement.focus();
	}
}

function confirmDelete(globalIndex) {
	if (window.confirm("Are you sure you want to delete this task?")) {
		deleteTask(globalIndex);
	}
}

function deleteTask(globalIndex) {
	tasks.splice(globalIndex, 1);
	renderTasks();
}

function saveTasksToFile() {
	const blob = new Blob([JSON.stringify(tasks, null, 2)], {
		type: "text/plain",
	});
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "tasks.txt";
	link.click();
}

function loadTasksFromFile(event) {
	const file = event.target.files[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = function (e) {
			tasks = JSON.parse(e.target.result);
			renderTasks();
		};
		reader.readAsText(file);
	}
}

function renderPagination(totalTasks) {
	paginationContainer.innerHTML = "";
	const totalPages = Math.ceil(totalTasks / tasksPerPage);

	// Если всего задач 0, не показываем пагинацию
	if (totalPages <= 1) return;

	const visiblePages = 5; // количество видимых страниц
	let startPage = currentPage - Math.floor(visiblePages / 2);
	let endPage = currentPage + Math.floor(visiblePages / 2);

	// Ограничиваем диапазон
	if (startPage < 1) {
		startPage = 1;
		endPage = Math.min(visiblePages, totalPages);
	}
	if (endPage > totalPages) {
		endPage = totalPages;
		startPage = Math.max(1, totalPages - visiblePages + 1);
	}

	// Кнопки страниц
	for (let i = startPage; i <= endPage; i++) {
		const pageButton = document.createElement("button");
		pageButton.textContent = i;
		pageButton.className = i === currentPage ? "active" : "";
		pageButton.addEventListener("click", () => {
			currentPage = i;
			renderTasks();
		});
		paginationContainer.appendChild(pageButton);
	}

	// Кнопки перехода на первую и последнюю страницу
	if (startPage > 1) {
		const firstPageButton = document.createElement("button");
		firstPageButton.textContent = "1";
		firstPageButton.addEventListener("click", () => {
			currentPage = 1;
			renderTasks();
		});
		paginationContainer.prepend(firstPageButton);

		const ellipsisLeft = document.createElement("span");
		ellipsisLeft.textContent = "...";
		paginationContainer.prepend(ellipsisLeft);
	}

	if (endPage < totalPages) {
		const ellipsisRight = document.createElement("span");
		ellipsisRight.textContent = "...";
		paginationContainer.appendChild(ellipsisRight);

		const lastPageButton = document.createElement("button");
		lastPageButton.textContent = totalPages;
		lastPageButton.addEventListener("click", () => {
			currentPage = totalPages;
			renderTasks();
		});
		paginationContainer.appendChild(lastPageButton);
	}
}

window.addEventListener("beforeunload", function (event) {
	if (tasks.length > 0) {
		const message = "You have unsaved tasks. Do you want to save them?";
		event.returnValue = message;
		return message;
	}
});
