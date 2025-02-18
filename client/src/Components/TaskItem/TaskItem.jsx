import React from "react";
import styles from "./TaskItem.module.css"; // Подключаем стили

const formatDate = (isoDate) => {
  if (!isoDate) return "Не указано"; // Проверяем, есть ли дата

  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Almaty", // Часовой пояс Казахстана
  }).format(new Date(isoDate));
};

export default function TaskItem({ task, onEdit, onToggle, onDelete }) {
  return (
    <div className={styles.taskItem}>
      <h5 className={`${styles.taskTitle} ${task.completed ? styles.completed : ""}`}>
        {task.title}
      </h5>
      {task.description && <p className={styles.taskDescription}>{task.description}</p>}
      <p className={styles.taskDate}>Дата: {formatDate(task.date)}</p> {/* Форматируем дату */}
      <div className={styles.taskButtons}>
        <button className={styles.editButton} onClick={() => onEdit(task)}>✏️</button>
        <button className={styles.toggleButton} onClick={() => onToggle(task)}>
          {task.completed ? "🔄" : "✅"}
        </button>
        <button className={styles.deleteButton} onClick={() => onDelete(task.id)}>🗑</button>
      </div>
    </div>
  );
}
