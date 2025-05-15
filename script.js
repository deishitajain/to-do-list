const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const filterButtons = document.querySelectorAll('.filter-btn');

let todos = JSON.parse(localStorage.getItem('todos')) || [];

// Render todos on page load
window.addEventListener('DOMContentLoaded', () => {
  renderTodos(todos);
});

// Add new task
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const taskText = todoInput.value.trim();
  if (taskText === '') return alert('Type something first.');
  
  const newTodo = {
    id: Date.now(),
    text: taskText,
    completed: false
  };
  todos.push(newTodo);
  saveAndRender();
  todoInput.value = '';
});

// Render todos based on filter
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTodos(todos, btn.dataset.filter);
  });
});

function renderTodos(todosArray, filter = 'all') {
  todoList.innerHTML = '';

  let filteredTodos = todosArray;
  if (filter === 'active') {
    filteredTodos = todosArray.filter(todo => !todo.completed);
  } else if (filter === 'completed') {
    filteredTodos = todosArray.filter(todo => todo.completed);
  }

  if (filteredTodos.length === 0) {
    todoList.innerHTML = `<li style="text-align:center; color:#999; padding:15px;">No tasks here!</li>`;
    return;
  }

  filteredTodos.forEach(todo => {
    const li = document.createElement('li');
    li.className = todo.completed ? 'completed' : '';

    // Task text span (click to toggle complete)
    const taskSpan = document.createElement('span');
    taskSpan.className = 'task-text';
    taskSpan.textContent = todo.text;
    taskSpan.title = 'Click to mark complete/incomplete';

    // Toggle complete on click
    taskSpan.addEventListener('click', () => {
      todo.completed = !todo.completed;
      saveAndRender();
    });

    // Double click to edit
    taskSpan.addEventListener('dblclick', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = todo.text;
      input.className = 'task-text editing';
      li.replaceChild(input, taskSpan);
      input.focus();

      input.addEventListener('blur', () => {
        const newText = input.value.trim();
        if (newText.length === 0) {
          alert("Task can't be empty!");
          input.focus();
          return;
        }
        todo.text = newText;
        saveAndRender();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
        if (e.key === 'Escape') {
          saveAndRender();
        }
      });
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'REMOVE';

    deleteBtn.addEventListener('click', () => {
      todos = todos.filter(t => t.id !== todo.id);
      saveAndRender();
    });

    li.appendChild(taskSpan);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });
}

function saveAndRender() {
  localStorage.setItem('todos', JSON.stringify(todos));
  const activeFilterBtn = document.querySelector('.filter-btn.active');
  const filter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
  renderTodos(todos, filter);
}