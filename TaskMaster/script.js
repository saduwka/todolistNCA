let tasks = [];
const tasksPerPage = 5;
let currentPage = 1;

// DOM Elements
const fileInput = document.getElementById("fileInput");
const saveToFileButton = document.getElementById("saveToFile");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const addTaskButton = document.getElementById("addTask");
const searchInput = document.getElementById("searchInput");
const taskList = document.getElementById("taskList");
const paginationContainer = document.getElementById("pagination");

// Event Listeners
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
	document.getElementById("fileInput").click(); // Кликаем на скрытое поле input
});

document
	.getElementById("fileInput")
	.addEventListener("change", function (event) {
		taskList.style.display = "flex";
		const fileName = event.target.files[0]
			? event.target.files[0].name
			: "No file chosen";
	});

// Add a task
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

// Render tasks with pagination
function renderTasks() {
	const searchTerm = searchInput.value.toLowerCase();
	taskList.innerHTML = "";

	// Filter tasks based on search
	const filteredTasks = tasks.filter(
		(task) =>
			task.title.toLowerCase().includes(searchTerm) ||
			task.description.toLowerCase().includes(searchTerm),
	);

	// Calculate tasks to display for the current page
	const startIndex = (currentPage - 1) * tasksPerPage;
	const endIndex = startIndex + tasksPerPage;
	const tasksToDisplay = filteredTasks.slice(startIndex, endIndex);

	// Display tasks
	tasksToDisplay.forEach((task, index) => {
		const taskElement = document.createElement("div");
		taskElement.className = `task ${task.completed ? "completed" : ""}`;
		taskElement.innerHTML = `
      <h3 id="title-${index}" class="task-title">${task.title}</h3>
      <p id="description-${index}" class="task-description">${
			task.description
		}</p>
      <p><strong>Date:</strong> ${task.date}</p>
      <button id="complete-btn" onclick="toggleTask(${index})">${
			task.completed ? "Incomplete" : "Complete"
		}</button>
      <button id="edit-btn" onclick="editTask(${index})">Edit</button>
      <button id="delete-btn" onclick="confirmDelete(${index})">Delete</button>
    `;
		taskList.appendChild(taskElement);
	});

	renderPagination(filteredTasks.length);
}

// Clear input fields
function clearInputs() {
	taskTitle.value = "";
	taskDescription.value = "";
}

// Toggle task completion
function toggleTask(index) {
	const actualIndex = (currentPage - 1) * tasksPerPage + index;
	tasks[actualIndex].completed = !tasks[actualIndex].completed;
	renderTasks();
}

// Edit task
function editTask(index) {
	const actualIndex = (currentPage - 1) * tasksPerPage + index;
	const task = tasks[actualIndex];
	const titleElement = document.getElementById(`title-${index}`);
	const descriptionElement = document.getElementById(`description-${index}`);

	if (titleElement.hasAttribute("contenteditable")) {
		task.title = titleElement.innerText;
		task.description = descriptionElement.innerText;

		titleElement.removeAttribute("contenteditable");
		descriptionElement.removeAttribute("contenteditable");
		titleElement.classList.remove("editable-field");
		descriptionElement.classList.remove("editable-field");

		const editButton = titleElement
			.closest(".task")
			.querySelector("button:nth-child(2)");
		editButton.textContent = "Edit";
	} else {
		titleElement.setAttribute("contenteditable", "true");
		descriptionElement.setAttribute("contenteditable", "true");
		titleElement.classList.add("editable-field");
		descriptionElement.classList.add("editable-field");

		const editButton = titleElement
			.closest(".task")
			.querySelector("button:nth-child(2)");
		editButton.textContent = "Save";

		titleElement.focus();
	}
	renderTasks();
}

// Delete task with confirmation
function confirmDelete(index) {
	const actualIndex = (currentPage - 1) * tasksPerPage + index;
	if (window.confirm("Are you sure you want to delete this task?")) {
		deleteTask(actualIndex);
	}
}

// Delete a task
function deleteTask(index) {
	tasks.splice(index, 1);
	renderTasks();
}

// Save tasks to file
function saveTasksToFile() {
	const blob = new Blob([JSON.stringify(tasks, null, 2)], {
		type: "text/plain",
	});
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "tasks.txt";
	link.click();
}

// Load tasks from file
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

// Render pagination
// Render pagination with a limit on visible page numbers
function renderPagination(totalTasks) {
	paginationContainer.innerHTML = "";
	const totalPages = Math.ceil(totalTasks / tasksPerPage);
	const visiblePages = 5; // количество видимых страниц

	let startPage = currentPage - Math.floor(visiblePages / 2);
	let endPage = currentPage + Math.floor(visiblePages / 2);

	// Обрезаем диапазон, чтобы страницы не выходили за пределы
	if (startPage < 1) {
		startPage = 1;
		endPage = Math.min(visiblePages, totalPages);
	}

	if (endPage > totalPages) {
		endPage = totalPages;
		startPage = Math.max(1, totalPages - visiblePages + 1);
	}

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

	// Добавляем кнопки для перехода к первой и последней странице, если нужно
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

// Warn before leaving the page
window.addEventListener("beforeunload", function (event) {
	if (tasks.length > 0) {
		const message = "You have unsaved tasks. Do you want to save them?";
		event.returnValue = message;
		return message;
	}
});

// Initial render
renderTasks();
