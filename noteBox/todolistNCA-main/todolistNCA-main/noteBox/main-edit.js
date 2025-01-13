const inputNotes = document.querySelector("#input-text");
const saveBtn = document.querySelector("#save");
const noteArea = document.querySelector("#notes");
const deleteBtnShow = document.querySelector("#delete-show");
const addCommentShow = document.querySelector("#add-comment-show");

document.addEventListener("DOMContentLoaded", () => {
	const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
	const savedComments = JSON.parse(localStorage.getItem("comments")) || [];

	savedNotes.forEach((note) => {
		const commentsForNote = savedComments.filter(
			(comment) => comment.noteId === note.id,
		);
		addNoteToDOM(note, commentsForNote);
	});
});

const saveFileBtn = document.querySelector("#save-file");
const uploadFileBtn = document.querySelector("#upload-file");
const fileInput = document.querySelector("#file-input");

// Функция для сохранения данных в файл
function saveToFile() {
	const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
	const savedComments = JSON.parse(localStorage.getItem("comments")) || [];

	let fileContent = "Заметки:\n\n";
	savedNotes.forEach((note) => {
		fileContent += `Заметка (ID: ${note.id}):\n`;
		fileContent += `${note.text}\nДата: ${note.date}\n\nКомментарии:\n`;

		const commentsForNote = savedComments.filter(
			(comment) => comment.noteId === note.id,
		);

		if (commentsForNote.length > 0) {
			commentsForNote.forEach((comment) => {
				fileContent += `- ${comment.commentText}\n`;
			});
		} else {
			fileContent += "Нет комментариев.\n";
		}
		fileContent += "\n-----------------------------\n\n";
	});

	const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = "notes.txt";
	a.click();
	URL.revokeObjectURL(url);
}

// Событие для кнопки "Сохранить в файл"
saveFileBtn.addEventListener("click", saveToFile);

// Событие для загрузки файла
uploadFileBtn.addEventListener("click", () => {
	fileInput.click();
});

// Чтение данных из загруженного файла
fileInput.addEventListener("change", (event) => {
	const file = event.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (e) => {
		const content = e.target.result;

		// Парсим файл и сохраняем данные в localStorage
		const notes = [];
		const comments = [];

		// Парсинг содержимого файла
		const lines = content.split("\n");
		let currentNote = null;

		lines.forEach((line) => {
			if (line.startsWith("Заметка (ID:")) {
				const idMatch = line.match(/ID: (\d+)\):/);
				if (idMatch) {
					const noteId = Number(idMatch[1]);
					currentNote = { id: noteId, text: "", date: "", comments: [] };
					notes.push(currentNote);
				}
			} else if (line.startsWith("Дата:")) {
				if (currentNote) {
					currentNote.date = line.replace("Дата: ", "").trim();
				}
			} else if (line.startsWith("-")) {
				if (currentNote) {
					comments.push({
						noteId: currentNote.id,
						commentText: line.replace("-", "").trim(),
					});
				}
			} else if (
				line.trim() &&
				currentNote &&
				!line.startsWith("Комментарии")
			) {
				currentNote.text += `${line.trim()} `;
			}
		});

		// Сохраняем данные в localStorage
		localStorage.setItem("notes", JSON.stringify(notes));
		localStorage.setItem("comments", JSON.stringify(comments));

		// Отображаем загруженные заметки
		noteArea.innerHTML = "";
		notes.forEach((note) => {
			const commentsForNote = comments.filter(
				(comment) => comment.noteId === note.id,
			);
			addNoteToDOM(note, commentsForNote);
		});
	};

	reader.readAsText(file);
});

saveBtn.addEventListener("click", (event) => {
	event.preventDefault();

	const inputValue = inputNotes.value.trim();
	if (inputValue === "") return;

	const date = new Date().toISOString().split("T")[0];
	const noteId = new Date().getTime();
	const note = {
		id: noteId,
		text: inputValue,
		date,
		comments: [],
		isStriked: false,
	};

	addNoteToDOM(note, []);
	saveNoteToStorage(note);
	inputNotes.value = "";
});

inputNotes.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		saveBtn.click();
	}
});

function addNoteToDOM(note, comments) {
	const { text, date, id, isStriked } = note;
	let dateHeader = Array.from(noteArea.querySelectorAll("h3")).find(
		(header) => header.textContent === date,
	);
	if (!dateHeader) {
		dateHeader = document.createElement("h3");
		dateHeader.textContent = date;
		noteArea.appendChild(dateHeader);
	}

	const newNote = document.createElement("li");
	const newNoteText = document.createElement("span");
	newNoteText.textContent = text;

	if (isStriked) {
		newNoteText.style.textDecoration = "line-through";
		newNoteText.style.color = "green";
	}

	newNote.appendChild(newNoteText);

	const deleteBtn = document.createElement("button");
	deleteBtn.textContent = "х";
	deleteBtn.classList.add("delete-btn");
	deleteBtn.addEventListener("click", () => {
		newNote.remove();
		deleteNoteFromStorage(note);
		deleteCommentsFromStorage(id);
	});

	const toggleStrikeBtn = document.createElement("button");
	toggleStrikeBtn.textContent = "✓";
	toggleStrikeBtn.classList.add("strike-btn");
	toggleStrikeBtn.addEventListener("click", () => {
		const newIsStriked = !note.isStriked;
		note.isStriked = newIsStriked;
		saveNoteToStorage(note);

		if (newIsStriked) {
			newNoteText.style.textDecoration = "line-through";
			newNoteText.style.color = "green";
		} else {
			newNoteText.style.textDecoration = "none";
			newNoteText.style.color = "initial";
		}
	});

	const addCommentField = document.createElement("div");
	addCommentField.classList.add("add-comment-field");
	addCommentField.style.display = "none";

	const commentInput = document.createElement("textarea");
	commentInput.classList.add("comment-input");
	commentInput.placeholder = "Введите комментарий...";

	const saveCommentBtn = document.createElement("button");
	saveCommentBtn.textContent = "Сохранить";
	saveCommentBtn.addEventListener("click", () => {
		const commentText = commentInput.value.trim();
		if (commentText) {
			saveCommentToStorage(id, commentText);

			const comment = document.createElement("p");
			comment.textContent = commentText;
			addCommentField.appendChild(comment);

			commentInput.style.display = "none";
			saveCommentBtn.style.display = "none";
		}
	});

	addCommentField.appendChild(commentInput);
	addCommentField.appendChild(saveCommentBtn);

	newNote.appendChild(toggleStrikeBtn);
	newNote.appendChild(deleteBtn);
	newNote.appendChild(addCommentField);
	dateHeader.after(newNote);

	comments.forEach((comment) => {
		const commentText = comment.commentText;
		const commentElement = document.createElement("p");
		commentElement.textContent = commentText;
		addCommentField.appendChild(commentElement);
	});

	addCommentShow.addEventListener("click", (event) => {
		event.preventDefault();

		if (addCommentField.style.display === "none") {
			addCommentField.style.display = "flex";
		} else {
			addCommentField.style.display = "none";
		}
	});
}

function saveNoteToStorage(note) {
	const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];

	const updatedNotes = savedNotes.filter(
		(savedNote) => savedNote.id !== note.id,
	);
	updatedNotes.push(note);
	localStorage.setItem("notes", JSON.stringify(updatedNotes));
}

function deleteNoteFromStorage(note) {
	let savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
	savedNotes = savedNotes.filter((savedNote) => savedNote.id !== note.id);
	localStorage.setItem("notes", JSON.stringify(savedNotes));
}

function saveCommentToStorage(noteId, commentText) {
	const savedComments = JSON.parse(localStorage.getItem("comments")) || [];

	savedComments.push({ noteId, commentText });
	localStorage.setItem("comments", JSON.stringify(savedComments));
}

function deleteCommentsFromStorage(noteId) {
	let savedComments = JSON.parse(localStorage.getItem("comments")) || [];
	savedComments = savedComments.filter((comment) => comment.noteId !== noteId);
	localStorage.setItem("comments", JSON.stringify(savedComments));
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
