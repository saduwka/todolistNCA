const inputNotes = document.querySelector("#input-text");
const saveBtn = document.querySelector("#save");
const noteArea = document.querySelector("#notes");
const deleteBtnShow = document.querySelector("#delete-show");

document.addEventListener("DOMContentLoaded", () => {
	// Загрузка сохраненных заметок при загрузке страницы
	const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
	savedNotes.forEach((note) => {
		addNoteToDOM(note);
	});
});

saveBtn.addEventListener("click", (event) => {
	event.preventDefault();

	const inputValue = inputNotes.value.trim();
	if (inputValue === "") return;

	const date = new Date().toISOString().split("T")[0]; // Текущая дата в формате YYYY-MM-DD
	const note = { text: inputValue, date };

	addNoteToDOM(note); // Передаем объект note в функцию для отображения
	saveNoteToStorage(note); // Сохраняем объект note в локальном хранилище
	inputNotes.value = ""; // Очищаем поле ввода
});

function addNoteToDOM(note) {
	const { text, date } = note;

	// Проверка, есть ли уже раздел с этой датой
	let dateHeader = Array.from(noteArea.querySelectorAll("h3")).find(
		(header) => header.textContent === date,
	);
	if (!dateHeader) {
		dateHeader = document.createElement("h3");
		dateHeader.textContent = date;
		noteArea.appendChild(dateHeader); // Добавляем заголовок с датой
	}

	// Создание элемента заметки
	const newNote = document.createElement("li");
	const newNoteText = document.createElement("span");
	newNoteText.textContent = text;
	newNote.appendChild(newNoteText);

	// Кнопка для удаления заметки
	const deleteBtn = document.createElement("button");
	deleteBtn.textContent = "х";
	deleteBtn.classList.add("delete-btn");
	deleteBtn.addEventListener("click", () => {
		newNote.remove();
		deleteNoteFromStorage(note); // Удаление заметки из хранилища
	});

	// Кнопка для зачеркивания текста
	const toggleStrikeBtn = document.createElement("button");
	toggleStrikeBtn.textContent = "✓";
	toggleStrikeBtn.classList.add("strike-btn");
	toggleStrikeBtn.addEventListener("click", () => {
		newNoteText.style.textDecoration =
			newNoteText.style.textDecoration === "line-through"
				? "none"
				: "line-through";
	});

	newNote.appendChild(toggleStrikeBtn);
	newNote.appendChild(deleteBtn);
	dateHeader.after(newNote); // Добавляем заметку после заголовка даты
}

function saveNoteToStorage(note) {
	const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
	savedNotes.push(note);
	localStorage.setItem("notes", JSON.stringify(savedNotes)); // Сохраняем все заметки в локальное хранилище
}

function deleteNoteFromStorage(note) {
	let savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
	savedNotes = savedNotes.filter(
		(savedNote) => savedNote.text !== note.text || savedNote.date !== note.date,
	);
	localStorage.setItem("notes", JSON.stringify(savedNotes)); // Обновляем локальное хранилище
}

deleteBtnShow.addEventListener("click", (event) => {
	event.preventDefault();
	const deleteBtns = document.querySelectorAll(".delete-btn");
	const areDeleteButtonsVisible = Array.from(deleteBtns).some(
		(btn) => btn.style.display === "inline-block",
	);
	const displayStyle = areDeleteButtonsVisible ? "none" : "inline-block";
	deleteBtns.forEach((btn) => {
		btn.style.display = displayStyle;
	});
});
