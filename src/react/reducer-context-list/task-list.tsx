import { useState, useContext } from 'react'
import { TasksContext, DispatchContext } from './context'
import type { Task } from './types'

export default function TaskList() {
	const tasks = useContext(TasksContext)
	return (
		<ul>
			{tasks.map(task => (
				<li key={task.id}>
					<Task task={task} />
				</li>
			))}
		</ul>
	)
}

function Task({ task }: { task: Task }) {
	const [isEditing, setIsEditing] = useState(false)
	const dispatch = useContext(DispatchContext)
	let taskContent

	if (isEditing) {
		taskContent = (
			<>
				<input
					value={task.content}
					onChange={e => {
						dispatch({
							type: 'update',
							task: {
								id: task.id,
								content: e.target.value,
							}
						})
					}} />
				<button onClick={() => setIsEditing(false)}>Save</button>
			</>
		)
	} else {
		taskContent = (
			<>
				{task.content}
				<button onClick={() => setIsEditing(true)}>Edit</button>
			</>
		)
	}

	return (
		<label>
			<input
				type="checkbox"
				checked={task.done}
				onChange={e => {
					dispatch({
						type: 'update',
						task: {
							id: task.id,
							done: e.target.checked,
						}
					})
				}}
			/>
			{taskContent}
			<button onClick={() => {
				dispatch({
					type: 'delete',
					id: task.id,
				})
			}}>Delete</button>
		</label>
	)
}
