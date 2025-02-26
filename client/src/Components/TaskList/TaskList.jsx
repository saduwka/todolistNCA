import TaskItem from "../TaskItem/TaskItem";
import { motion, AnimatePresence } from "framer-motion";

export default function TaskList({ tasks, onEdit, onToggle, onDelete }) {
	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={tasks.length}
				initial={{ opacity: 0, x: 50 }}
				animate={{ opacity: 1, x: 0 }}
				exit={{ opacity: 0, x: -50 }}
				transition={{ duration: 0.3 }}
			>
				{tasks.map((task) => (
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
