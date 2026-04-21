import { TasksProvider } from './context'
import { AddInput } from './add-input'
import TaskList from "./task-list"

export default function App() {
	return (
		<TasksProvider>
			<h1>Task List</h1>
			<AddInput />
			<TaskList />
		</TasksProvider>
	)
}
