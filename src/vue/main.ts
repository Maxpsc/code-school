import { createApp } from 'vue'
import TodoList from './todo-list/TodoList.vue'

console.log('=== Vue 3 Todo List Demo ===')

const app = createApp(TodoList)
app.mount('#vue-app')
