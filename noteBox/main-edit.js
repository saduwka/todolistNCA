const inputNotes = document.querySelector("#input-text");
const saveBtn = document.querySelector("#save");
const noteArea = document.querySelector("#notes");
const searchInput = document.querySelector("#search-input");
const saveFileBtn = document.querySelector("#save-file");
const uploadFileBtn = document.querySelector("#upload-file");
const fileInput = document.querySelector("#file-input");
const OAUTH_TOKEN = 'y0__wgBELmsjoYCGMiiNCCNl4T-Ec5Sn5GoVFjOE3sP5KP7RTla6oje'; // Ваш OAuth токен
const API_URL = 'https://cloud-api.yandex.net/v1/disk/resources';

// Действия при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    loadNotesFromYandexDisk(); // Загружаем заметки с Яндекс.Диска
});

// Поиск заметок
searchInput.addEventListener("input", () => {
    const searchText = searchInput.value.trim().toLowerCase();
    filterNotes(searchText);
});

// Сохранение заметок на Яндекс.Диск
function saveNotesToYandexDisk(notes) {
    const fileContent = JSON.stringify(notes); // Преобразуем массив заметок в строку

    // Создаем Blob-объект с содержимым
    const blob = new Blob([fileContent], { type: 'application/json' });

    // Загружаем файл на Яндекс.Диск
    fetch(`${API_URL}/upload?path=/notes.json`, {
        method: 'GET',
        headers: {
            'Authorization': `OAuth ${OAUTH_TOKEN}`,
        },
    })
    .then(response => response.json())
    .then(data => {
        const uploadUrl = data.href;
        
        // Отправляем сам файл
        const formData = new FormData();
        formData.append('file', blob, 'notes.json');

        return fetch(uploadUrl, {
            method: 'PUT',
            body: formData,
        });
    })
    .then(() => {
        console.log('Заметки успешно загружены на Яндекс.Диск');
    })
    .catch(error => {
        console.error('Ошибка при загрузке заметок на Яндекс.Диск:', error);
    });
}

// Загрузка заметок с Яндекс.Диск
function loadNotesFromYandexDisk() {
    fetch(`${API_URL}/download?path=/notes.json`, {
        method: 'GET',
        headers: {
            'Authorization': `OAuth ${OAUTH_TOKEN}`,
        },
    })
    .then(response => response.json())
    .then(data => {
        const downloadUrl = data.href;
        return fetch(downloadUrl);
    })
    .then(response => response.json())
    .then(notes => {
        console.log('Заметки загружены:', notes);
        noteArea.innerHTML = ""; // Очищаем заметки на странице

        notes.forEach((note) => {
            addNoteToDOM(note);
        });
    })
    .catch(error => {
        console.error('Ошибка при загрузке заметок с Яндекс.Диск:', error);
    });
}

// Сохранение заметки в локальное хранилище
function saveNoteToStorage(note) {
    const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
    const updatedNotes = savedNotes.filter((n) => n.id !== note.id);
    updatedNotes.push(note);
    localStorage.setItem("notes", JSON.stringify(updatedNotes));
}

// Добавление заметки в DOM
function addNoteToDOM(note) {
    const { text, date, id, isStriked } = note;

    let dateWrapper = Array.from(noteArea.querySelectorAll(".date-wrapper")).find(
        (wrapper) => wrapper.querySelector("h3").textContent === date
    );

    if (!dateWrapper) {
        dateWrapper = document.createElement("div");
        dateWrapper.classList.add("date-wrapper");

        const dateHeader = document.createElement("h3");
        dateHeader.textContent = date;
        dateHeader.classList.add("date-header");

        const toggleButton = document.createElement("button");
        toggleButton.textContent = "▼";
        toggleButton.classList.add("toggle-btn");

        const notesList = document.createElement("ul");
        notesList.classList.add("notes-list");
        notesList.style.display = "none";

        toggleButton.addEventListener("click", () => {
            notesList.style.display =
                notesList.style.display === "none" ? "block" : "none";
            toggleButton.textContent = notesList.style.display === "none" ? "▼" : "▲";
        });

        dateWrapper.appendChild(dateHeader);
        dateWrapper.appendChild(toggleButton);
        dateWrapper.appendChild(notesList);

        noteArea.appendChild(dateWrapper);
    }

    const notesList = dateWrapper.querySelector(".notes-list");

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
            newNoteText.style.color = "black";
        }
    });

    const addCommentBtn = document.createElement("button");
    addCommentBtn.textContent = "Добавить комментарий";
    addCommentBtn.classList.add("add-comment-btn");
    addCommentBtn.addEventListener("click", () => {
        const commentText = prompt("Введите комментарий:");
        if (commentText) {
            const comment = {
                noteId: id,
                commentText,
            };
            saveCommentToStorage(comment);
            addCommentToDOM(comment, newNote);
        }
    });

    const commentSection = document.createElement("div");
    commentSection.classList.add("add-comment-field");

    newNote.appendChild(deleteBtn);
    newNote.appendChild(toggleStrikeBtn);
    newNote.appendChild(addCommentBtn);
    newNote.appendChild(commentSection);

    notesList.appendChild(newNote);
}

// Добавление комментария в DOM
function addCommentToDOM(comment, noteElement) {
    const commentText = document.createElement("p");
    commentText.textContent = comment.commentText;
    const commentSection = noteElement.querySelector(".add-comment-field");
    commentSection.appendChild(commentText);
}

// Сохранение комментария в локальное хранилище
function saveCommentToStorage(comment) {
    const savedComments = JSON.parse(localStorage.getItem("comments")) || [];
    savedComments.push(comment);
    localStorage.setItem("comments", JSON.stringify(savedComments));
}

// Удаление заметки из локального хранилища
function deleteNoteFromStorage(note) {
    const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
    const updatedNotes = savedNotes.filter((n) => n.id !== note.id);
    localStorage.setItem("notes", JSON.stringify(updatedNotes));
}

// Обработчик нажатия кнопки "Сохранить заметку"
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
        isStriked: false,
    };

    addNoteToDOM(note);
    saveNoteToStorage(note);
    saveNotesToYandexDisk(JSON.parse(localStorage.getItem("notes"))); // Сохраняем на Яндекс.Диск
    inputNotes.value = "";
});

// Обработчик нажатия Enter для сохранения заметки
inputNotes.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        saveBtn.click();
    }
});

// Функция для поиска заметок
function filterNotes(searchText) {
    const notes = noteArea.querySelectorAll("li");
    let hasResults = false;

    notes.forEach((note) => {
        const noteText = note.querySelector("span").textContent.toLowerCase();

        if (noteText.includes(searchText)) {
            note.style.display = "block";
            hasResults = true;
        } else {
            note.style.display = "none";
        }
    });

    const noResultsMessage = document.querySelector("#no-results-message");
    if (!hasResults && searchText !== "") {
        if (!noResultsMessage) {
            const message = document.createElement("p");
            message.id = "no-results-message";
            message.textContent = "Заметки не найдены";
            noteArea.appendChild(message);
        }
    } else {
        const message = document.querySelector("#no-results-message");
        if (message) {
            message.remove();
        }
    }
}
