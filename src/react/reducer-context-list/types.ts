export interface Task {
  id: number
  content: string
  done: boolean
}

export type TaskAction =
  | { type: 'add'; content: string }
  | { type: 'update'; task: Partial<Task> & { id: number } }
  | { type: 'delete'; id: number }
