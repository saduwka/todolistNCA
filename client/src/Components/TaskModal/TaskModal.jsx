import { motion, AnimatePresence } from "framer-motion";
import styles from "./TaskModal.module.css";
import { useState, useEffect } from "react";

export default function TaskModal({ isOpen, task, onClose, onSave }) {
	const [title, setTitle] = useState(task?.title || "");
	const [description, setDescription] = useState(task?.description || "");

	// Функция сохранения задачи
	const handleSave = async () => {
		if (!task?.id) {
			console.error("ID задачи не найден.");
			return;
		}

		const updatedTask = { ...task, title, description };
		console.log("Saving task:", updatedTask); // Логируем задачу перед сохранением

		// Ожидаем выполнения onSave (если это асинхронная операция)
		await onSave(updatedTask);

		// Закрываем модальное окно после сохранения
		onClose();
	};

	// Закрытие по клавише Escape
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [onClose]);

	// Обновление значений при изменении task
	useEffect(() => {
		setTitle(task?.title || "");
		setDescription(task?.description || "");
	}, [task]);

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				className={styles.modalOverlay}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }} // Анимация исчезновения фона
				transition={{ duration: 0.3 }}
				onClick={onClose}
			>
				<motion.div
					className={styles.modal}
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.8, opacity: 0 }} // Анимация исчезновения модального окна
					transition={{ duration: 0.3, ease: "easeOut" }}
					onClick={(e) => e.stopPropagation()}
				>
					<h2>Редактировать задачу</h2>
					<input
						type="text"
						className={styles.input}
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
					<textarea
						className={styles.textarea}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
					<button className={styles.button} onClick={handleSave}>
						Сохранить
					</button>

					<button className={styles.cancelButton} onClick={onClose}>
						Отмена
					</button>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
