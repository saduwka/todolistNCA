let tasks = [];

// DOM Elements
const fileInput = document.getElementById("fileInput");
const saveToFileButton = document.getElementById("saveToFile");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const addTaskButton = document.getElementById("addTask");
const searchInput = document.getElementById("searchInput");
const taskList = document.getElementById("taskList");

// Event Listeners
fileInput.addEventListener("change", loadTasksFromFile);
saveToFileButton.addEventListener("click", saveTasksToFile);
addTaskButton.addEventListener("click", addTask);
searchInput.addEventListener("input", renderTasks);

// Add a task (called by both button click and Enter key)
function addTask() {
	if (taskTitle.value) {
		const currentDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
		tasks.push({
			title: taskTitle.value,
			description: taskDescription.value,
			date: currentDate,
			completed: false,
		});
		tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
		renderTasks();
		clearInputs();
	} else {
		alert("Please fill in the title.");
	}
}

// Render tasks
function renderTasks() {
	const searchTerm = searchInput.value.toLowerCase();
	taskList.innerHTML = "";

	tasks
		.filter(
			(task) =>
				task.title.toLowerCase().includes(searchTerm) ||
				task.description.toLowerCase().includes(searchTerm),
		)
		.forEach((task, index) => {
			const taskElement = document.createElement("div");
			taskElement.className = `task ${task.completed ? "completed" : ""}`;
			taskElement.innerHTML = `
        <h3 id="title-${index}" class="task-title">${task.title}</h3>
        <p id="description-${index}" class="task-description">${
				task.description
			}</p>
        <p><strong>Date:</strong> ${task.date}</p>
        <button onclick="toggleTask(${index})">${
				task.completed ? "Incomplete" : "Complete"
			}</button>
        <button onclick="editTask(${index})">Edit</button>
        <button onclick="confirmDelete(${index})">Delete</button>
      `;
			taskList.appendChild(taskElement);
		});
}

// Clear input fields
function clearInputs() {
	taskTitle.value = "";
	taskDescription.value = "";
}

// Toggle task completion
function toggleTask(index) {
	tasks[index].completed = !tasks[index].completed;
	renderTasks();
}

// Edit task
function editTask(index) {
	const titleElement = document.getElementById(`title-${index}`);
	const descriptionElement = document.getElementById(`description-${index}`);

	// If already in editing mode, save the changes
	if (titleElement.hasAttribute("contenteditable")) {
		tasks[index].title = titleElement.innerText;
		tasks[index].description = descriptionElement.innerText;

		// Disable editing mode and remove background color
		titleElement.removeAttribute("contenteditable");
		descriptionElement.removeAttribute("contenteditable");
		titleElement.classList.remove("editable-field");
		descriptionElement.classList.remove("editable-field");

		// Change button back to "Edit"
		const editButton = titleElement
			.closest(".task")
			.querySelector("button:nth-child(2)");
		editButton.textContent = "Edit";
	} else {
		// Enable editing mode and add background color
		titleElement.setAttribute("contenteditable", "true");
		descriptionElement.setAttribute("contenteditable", "true");
		titleElement.classList.add("editable-field");
		descriptionElement.classList.add("editable-field");

		// Change button to "Save"
		const editButton = titleElement
			.closest(".task")
			.querySelector("button:nth-child(2)");
		editButton.textContent = "Save";

		// Focus and select the text inside the task title and description
		titleElement.focus();
		document.execCommand("selectAll", false, null);
	}
	renderTasks();
}

// Delete a task with confirmation
function confirmDelete(index) {
	const confirmDelete = window.confirm(
		"Are you sure you want to delete this task?",
	);
	if (confirmDelete) {
		deleteTask(index);
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
			tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
			renderTasks();
		};
		reader.readAsText(file);
	}
}

// Handle pressing Enter to add a task
taskTitle.addEventListener("keydown", function (e) {
	if (e.key === "Enter") {
		addTask();
	}
});

// Display alert before the user leaves the page
window.addEventListener("beforeunload", function (event) {
	if (tasks.length > 0) {
		const message = "You have unsaved tasks. Do you want to save them?";
		event.returnValue = message;
		return message;
	}
});

// Initial render
renderTasks();
