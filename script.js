document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. STATE MANAGEMENT & STORAGE
  // ==========================================
  let tasks = JSON.parse(localStorage.getItem('myday_tasks')) || [];
  let currentFilter = 'all';
  let currentSort = 'newest';
  let searchQuery = '';

  // DOM Elements
  const taskForm = document.getElementById('task-form');
  const taskTitleInput = document.getElementById('task-title');
  const taskDescInput = document.getElementById('task-desc');
  const taskCategoryInput = document.getElementById('task-category');
  const taskPriorityInput = document.getElementById('task-priority');
  const taskDueDateInput = document.getElementById('task-due-date');
  
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const sortSelect = document.getElementById('sort-select');
  const filterChips = document.getElementById('filter-chips');

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const liveClock = document.getElementById('live-clock');
  const liveDate = document.getElementById('live-date');
  const greetingText = document.getElementById('greeting-text');

  const statTotal = document.getElementById('stat-total');
  const statActive = document.getElementById('stat-active');
  const statCompleted = document.getElementById('stat-completed');
  const statOverdue = document.getElementById('stat-overdue');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressPercentage = document.getElementById('progress-percentage');

  // Modal Elements
  const editModal = document.getElementById('edit-modal');
  const editTaskForm = document.getElementById('edit-task-form');
  const editTaskId = document.getElementById('edit-task-id');
  const editTaskTitle = document.getElementById('edit-task-title');
  const editTaskDesc = document.getElementById('edit-task-desc');
  const editTaskCategory = document.getElementById('edit-task-category');
  const editTaskPriority = document.getElementById('edit-task-priority');
  const editTaskDueDate = document.getElementById('edit-task-due-date');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  // Confetti Canvas
  const confettiCanvas = document.getElementById('confetti-canvas');
  const ctx = confettiCanvas.getContext('2d');

  // ==========================================
  // 2. INITIALIZATION
  // ==========================================
  function init() {
    initTheme();
    updateClockAndGreeting();
    setInterval(updateClockAndGreeting, 1000);
    renderTasks();
    setupEventListeners();
    resizeCanvas();
  }

  function saveTasks() {
    localStorage.setItem('myday_tasks', JSON.stringify(tasks));
  }

  // ==========================================
  // 3. THEME MANAGEMENT
  // ==========================================
  function initTheme() {
    const savedTheme = localStorage.getItem('myday_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('myday_theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
  }

  function updateThemeIcon(theme) {
    themeToggleBtn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
  }

  // ==========================================
  // 4. CLOCK, DATE & GREETING
  // ==========================================
  function updateClockAndGreeting() {
    const now = new Date();
    
    // Time format
    liveClock.textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Date format
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    liveDate.textContent = now.toLocaleDateString('en-US', options);

    // Dynamic Greeting
    const hour = now.getHours();
    if (hour < 12) greetingText.textContent = 'Good Morning ☀️';
    else if (hour < 18) greetingText.textContent = 'Good Afternoon 🌤️';
    else greetingText.textContent = 'Good Evening 🌙';
  }

  // ==========================================
  // 5. TASK CRUD OPERATIONS
  // ==========================================
  function addTask(e) {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    if (!title) {
      showToast('Task title cannot be empty', 'warning');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title: title,
      description: taskDescInput.value.trim(),
      category: taskCategoryInput.value,
      priority: taskPriorityInput.value,
      dueDate: taskDueDateInput.value,
      completed: false,
      createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();

    // Reset Form
    taskForm.reset();
    taskTitleInput.focus();
    showToast('Task added successfully', 'success');
  }

  function toggleTaskComplete(id) {
    const previousCompletedCount = tasks.filter(t => t.completed).length;

    tasks = tasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });

    saveTasks();
    renderTasks();

    const currentCompletedCount = tasks.filter(t => t.completed).length;
    
    // Confetti Check: Trigger if all tasks are complete
    if (tasks.length > 0 && currentCompletedCount === tasks.length && currentCompletedCount > previousCompletedCount) {
      triggerConfetti();
      showToast('🎉 All tasks completed! Great job!', 'success');
    }
  }

  function deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
      taskElement.classList.add('fade-out');
      setTimeout(() => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        showToast('Task deleted', 'danger');
      }, 250);
    }
  }

  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editTaskDesc.value = task.description || '';
    editTaskCategory.value = task.category;
    editTaskPriority.value = task.priority;
    editTaskDueDate.value = task.dueDate || '';

    editModal.classList.remove('hidden');
    editTaskTitle.focus();
  }

  function closeEditModal() {
    editModal.classList.add('hidden');
    editTaskForm.reset();
  }

  function saveEditedTask(e) {
    e.preventDefault();
    const id = editTaskId.value;
    const title = editTaskTitle.value.trim();

    if (!title) {
      showToast('Task title cannot be empty', 'warning');
      return;
    }

    tasks = tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          title: title,
          description: editTaskDesc.value.trim(),
          category: editTaskCategory.value,
          priority: editTaskPriority.value,
          dueDate: editTaskDueDate.value
        };
      }
      return task;
    });

    saveTasks();
    renderTasks();
    closeEditModal();
    showToast('Task updated successfully', 'success');
  }

  // ==========================================
  // 6. FILTERING & SORTING LOGIC
  // ==========================================
  function getFilteredAndSortedTasks() {
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter
    let result = tasks.filter(task => {
      // Search
      const matchesSearch = task.title.toLowerCase().includes(searchQuery) || 
                            (task.description && task.description.toLowerCase().includes(searchQuery));
      if (!matchesSearch) return false;

      // Category / Status Filter
      if (currentFilter === 'active') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
      if (currentFilter === 'today') return task.dueDate === todayStr;
      if (currentFilter === 'overdue') return task.dueDate && task.dueDate < todayStr && !task.completed;
      if (currentFilter === 'high-priority') return task.priority === 'High';

      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (currentSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (currentSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (currentSort === 'alphabetical') return a.title.localeCompare(b.title);
      if (currentSort === 'due-date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (currentSort === 'priority') {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (currentSort === 'completed-first') return (b.completed ? 1 : 0) - (a.completed ? 1 : 0);
      return 0;
    });

    return result;
  }

  // ==========================================
  // 7. RENDER FUNCTIONS
  // ==========================================
  function renderTasks() {
    const filteredTasks = getFilteredAndSortedTasks();
    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      filteredTasks.forEach(task => {
        const card = createTaskCardElement(task);
        taskList.appendChild(card);
      });
    }

    updateDashboardMetrics();
  }

  function createTaskCardElement(task) {
    const li = document.createElement('li');
    li.className = `task-card fade-in ${task.completed ? 'completed' : ''}`;
    li.setAttribute('data-id', task.id);

    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = task.dueDate && task.dueDate < todayStr && !task.completed;

    const categoryClass = `badge-cat-${task.category.toLowerCase()}`;
    const priorityClass = `badge-priority-${task.priority.toLowerCase()}`;

    li.innerHTML = `
      <label class="checkbox-container">
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <span class="checkmark"></span>
      </label>

      <div class="task-content">
        <div class="task-header-line">
          <span class="task-title">${escapeHTML(task.title)}</span>
          <span class="badge ${priorityClass}">${task.priority}</span>
        </div>
        
        ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}

        <div class="task-meta">
          <span class="badge ${categoryClass}">${task.category}</span>
          ${task.dueDate ? `
            <span class="task-date-badge ${isOverdue ? 'is-overdue' : ''}">
              <i class="fa-regular fa-calendar"></i> ${formatDate(task.dueDate)} ${isOverdue ? '(Overdue)' : ''}
            </span>
          ` : ''}
        </div>
      </div>

      <div class="task-actions">
        <button class="action-btn edit-btn" title="Edit Task"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="action-btn delete-btn" title="Delete Task"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `;

    // Event Listeners for Card Controls
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));

    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => openEditModal(task.id));

    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    // Double click on card content to edit
    const taskContent = li.querySelector('.task-content');
    taskContent.addEventListener('dblclick', () => openEditModal(task.id));

    return li;
  }

  function updateDashboardMetrics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < todayStr && !t.completed).length;

    statTotal.textContent = total;
    statActive.textContent = active;
    statCompleted.textContent = completed;
    statOverdue.textContent = overdue;

    // Progress percentage
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressBarFill.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
  }

  // ==========================================
  // 8. EVENT LISTENERS & SHORTCUTS
  // ==========================================
  function setupEventListeners() {
    // Form Submit
    taskForm.addEventListener('submit', addTask);
    editTaskForm.addEventListener('submit', saveEditedTask);

    // Modal Close Events
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeEditModal();
    });

    // Theme Toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Search Input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      if (searchQuery) {
        clearSearchBtn.classList.remove('hidden');
      } else {
        clearSearchBtn.classList.add('hidden');
      }
      renderTasks();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderTasks();
      searchInput.focus();
    });

    // Sort Selection
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderTasks();
    });

    // Filter Chips
    filterChips.addEventListener('click', (e) => {
      if (e.target.classList.contains('chip')) {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderTasks();
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Focus Search: Ctrl + /
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        searchInput.focus();
      }
      // Close Modal: Escape
      if (e.key === 'Escape' && !editModal.classList.contains('hidden')) {
        closeEditModal();
      }
    });

    window.addEventListener('resize', resizeCanvas);
  }

  // ==========================================
  // 9. TOAST NOTIFICATION SYSTEM
  // ==========================================
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'danger') icon = 'fa-circle-xmark';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHTML(message)}</span>`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  // ==========================================
  // 10. CONFETTI ANIMATION
  // ==========================================
  let confettiParticles = [];

  function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function triggerConfetti() {
    confettiParticles = [];
    const colors = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

    for (let i = 0; i < 120; i++) {
      confettiParticles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.7) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    animateConfetti();
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // Gravity
      p.opacity -= 0.015;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.globalAlpha = Math.max(p.opacity, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();

      if (p.opacity <= 0) {
        confettiParticles.splice(index, 1);
      }
    });

    if (confettiParticles.length > 0) {
      requestAnimationFrame(animateConfetti);
    }
  }

  // ==========================================
  // 11. HELPER UTILITIES
  // ==========================================
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Boot Application
  init();
});
