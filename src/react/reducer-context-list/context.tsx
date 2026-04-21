import { createContext, useContext, useReducer, ReactNode } from 'react'
import { Task, TaskAction } from './types'

export const TasksContext = createContext<Task[]>([])
export const DispatchContext = createContext<React.Dispatch<TaskAction>>(() => {})

const initTasks: Task[] = [
	{ id: 1, content: 'today is monday', done: false },
	{ id: 2, content: 'today is tuesday', done: false },
	{ id: 3, content: 'today is wednesday', done: false },
]

const tasksReducer = (tasks: Task[], action: TaskAction): Task[] => {
	switch (action.type) {
		case 'add':
			return [
				...tasks,
				{ id: Date.now(), content: action.content, done: false }
			]
		case 'update':
			return tasks.map(i => {
				if (i.id === action.task.id) {
					return {
						...i,
						...action.task,
					}
				} else {
					return i
				}
			})
		case 'delete':
			return tasks.filter(i => i.id !== action.id)
		default:
			const _exhaustiveCheck: never = action
			throw new Error(`unknown action type: ${_exhaustiveCheck}`)
	}
}

export function TasksProvider({ children }: { children: ReactNode }) {
	const [tasks, dispatch] = useReducer(tasksReducer, initTasks)

	return (
		<TasksContext.Provider value={tasks}>
			<DispatchContext.Provider value={dispatch}>
				{children}
			</DispatchContext.Provider>
		</TasksContext.Provider>
	)
}

export function useTasks() {
	return useContext(TasksContext)
}

export function useTasksDispatch() {
	return useContext(DispatchContext)
}
