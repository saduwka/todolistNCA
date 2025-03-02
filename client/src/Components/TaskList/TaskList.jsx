import TaskItem from "../TaskItem/TaskItem";
import { motion, AnimatePresence } from "framer-motion";

export default function TaskList({ tasks, onEdit, onToggle, onDelete }) {

	const sortedTasks = [...tasks].sort((a, b) => new Date(b.date) - new Date(a.date));

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={sortedTasks.length}
				initial={{ opacity: 0, x: 50 }}
				animate={{ opacity: 1, x: 0 }}
				exit={{ opacity: 0, x: -50 }}
				transition={{ duration: 0.3 }}
			>
				{sortedTasks.map((task) => (
					<TaskItem
						key={task.id}
						task={task}
						onEdit={onEdit}
						onToggle={onToggle}
						onDelete={onDelete}
					/>
				))}
			</motion.div>
		</AnimatePresence>
	);
}