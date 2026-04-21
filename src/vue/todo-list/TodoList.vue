<script setup lang="ts">
import { ref, computed } from 'vue'

interface Todo {
  id: number
  content: string
  done: boolean
}

const todos = ref<Todo[]>([
  { id: 1, content: '学习 Vue 3 Composition API', done: false },
  { id: 2, content: '理解响应式原理', done: true },
  { id: 3, content: '掌握 setup 语法', done: false },
])

const inputText = ref('')
const filter = ref<'all' | 'active' | 'completed'>('all')

// 过滤后的列表
const filteredTodos = computed(() => {
  switch (filter.value) {
    case 'active':
      return todos.value.filter(t => !t.done)
    case 'completed':
      return todos.value.filter(t => t.done)
    default:
      return todos.value
  }
})

// 统计
const activeCount = computed(() => todos.value.filter(t => !t.done).length)
const completedCount = computed(() => todos.value.filter(t => t.done).length)

// 添加
function addTodo() {
  const text = inputText.value.trim()
  if (!text) return
  todos.value.unshift({
    id: Date.now(),
    content: text,
    done: false,
  })
  inputText.value = ''
}

// 删除
function removeTodo(id: number) {
  const index = todos.value.findIndex(t => t.id === id)
  if (index > -1) {
    todos.value.splice(index, 1)
  }
}

// 切换完成状态
function toggleTodo(id: number) {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.done = !todo.done
  }
}

// 清除已完成
function clearCompleted() {
  todos.value = todos.value.filter(t => !t.done)
}

// 全选/全不选
function toggleAll() {
  const allDone = filteredTodos.value.every(t => t.done)
  filteredTodos.value.forEach(t => {
    t.done = !allDone
  })
}
</script>

<template>
  <div class="todo-container">
    <h2>Vue 3 Todo List</h2>
    <p class="subtitle">Composition API + TypeScript</p>

    <!-- 输入框 -->
    <div class="input-row">
      <input
        v-model="inputText"
        @keyup.enter="addTodo"
        placeholder="添加新任务..."
        class="todo-input"
      />
      <button @click="addTodo" class="add-btn">添加</button>
    </div>

    <!-- 列表 -->
    <ul class="todo-list">
      <li
        v-for="todo in filteredTodos"
        :key="todo.id"
        :class="{ done: todo.done }"
      >
        <label class="checkbox-wrapper">
          <input
            type="checkbox"
            :checked="todo.done"
            @change="toggleTodo(todo.id)"
          />
          <span class="checkmark"></span>
        </label>
        <span class="todo-content">{{ todo.content }}</span>
        <button @click="removeTodo(todo.id)" class="delete-btn">删除</button>
      </li>
    </ul>

    <!-- 空状态 -->
    <div v-if="filteredTodos.length === 0" class="empty-state">
      {{ filter === 'all' ? '暂无任务' : '没有符合条件的任务' }}
    </div>

    <!-- 底部操作栏 -->
    <div class="footer" v-if="todos.length > 0">
      <div class="stats">
        <span>活跃: {{ activeCount }}</span>
        <span>已完成: {{ completedCount }}</span>
      </div>

      <div class="filters">
        <button
          :class="{ active: filter === 'all' }"
          @click="filter = 'all'"
        >全部</button>
        <button
          :class="{ active: filter === 'active' }"
          @click="filter = 'active'"
        >进行中</button>
        <button
          :class="{ active: filter === 'completed' }"
          @click="filter = 'completed'"
        >已完成</button>
      </div>

      <button
        v-if="completedCount > 0"
        @click="clearCompleted"
        class="clear-btn"
      >清除已完成</button>
    </div>
  </div>
</template>

<style scoped>
.todo-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  text-align: center;
  color: #42b883;
  margin-bottom: 5px;
}

.subtitle {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 0;
}

.input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.todo-input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.todo-input:focus {
  outline: none;
  border-color: #42b883;
}

.add-btn {
  padding: 10px 20px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.add-btn:hover {
  background: #3aa876;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.todo-list li.done {
  background: #e8f5e9;
}

.todo-list li.done .todo-content {
  text-decoration: line-through;
  color: #999;
}

.checkbox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 12px;
}

.checkbox-wrapper input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  width: 22px;
  height: 22px;
  border: 2px solid #42b883;
  border-radius: 50%;
  transition: all 0.3s;
}

.checkbox-wrapper input:checked ~ .checkmark {
  background: #42b883;
}

.checkbox-wrapper input:checked ~ .checkmark::after {
  content: '✓';
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.todo-content {
  flex: 1;
  font-size: 16px;
}

.delete-btn {
  padding: 5px 12px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.todo-list li:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #ee5a5a;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.stats {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #666;
}

.filters {
  display: flex;
  gap: 8px;
}

.filters button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.filters button.active {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

.filters button:hover:not(.active) {
  border-color: #42b883;
}

.clear-btn {
  padding: 6px 12px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.clear-btn:hover {
  background: #ee5a5a;
}
</style>
