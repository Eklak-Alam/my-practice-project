class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        this.draggedItem = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        // Input elements
        this.todoInput = document.getElementById('todo-input');
        this.addBtn = document.getElementById('add-btn');
        this.todoList = document.getElementById('todo-list');
        this.emptyState = document.getElementById('empty-state');

        // Filter elements
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        // Stats elements
        this.totalTasks = document.getElementById('total-tasks');
        this.completedTasks = document.getElementById('completed-tasks');
        this.pendingTasks = document.getElementById('pending-tasks');

        // Action buttons
        this.clearCompletedBtn = document.getElementById('clear-completed');
        this.clearAllBtn = document.getElementById('clear-all');

        // Modal elements
        this.modal = document.getElementById('edit-modal');
        this.editInput = document.getElementById('edit-input');
        this.saveEditBtn = document.getElementById('save-edit');
        this.cancelEditBtn = document.getElementById('cancel-edit');
        this.closeModal = document.querySelector('.close');
    }

    bindEvents() {
        // Add task events
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Action events
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Modal events
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        this.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeEditModal();
        });

        // Keyboard events for modal
        this.editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEdit();
        });

        // Drag and drop events
        this.todoList.addEventListener('dragstart', (e) => this.dragStart(e));
        this.todoList.addEventListener('dragover', (e) => this.dragOver(e));
        this.todoList.addEventListener('drop', (e) => this.drop(e));
        this.todoList.addEventListener('dragend', (e) => this.dragEnd(e));
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        
        if (!text) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveToLocalStorage();
        this.render();
        this.todoInput.value = '';
        this.showNotification('Task added successfully!', 'success');
    }

    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveToLocalStorage();
            this.render();
            this.showNotification('Task deleted!', 'success');
        }
    }

    toggleTodo(id) {
        this.todos = this.todos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        this.saveToLocalStorage();
        this.render();
    }

    editTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            this.editingId = id;
            this.editInput.value = todo.text;
            this.modal.style.display = 'block';
            this.editInput.focus();
        }
    }

    saveEdit() {
        const text = this.editInput.value.trim();
        
        if (!text) {
            this.showNotification('Task cannot be empty!', 'error');
            return;
        }

        this.todos = this.todos.map(todo =>
            todo.id === this.editingId ? { ...todo, text: text } : todo
        );

        this.saveToLocalStorage();
        this.render();
        this.closeEditModal();
        this.showNotification('Task updated successfully!', 'success');
    }

    closeEditModal() {
        this.modal.style.display = 'none';
        this.editingId = null;
        this.editInput.value = '';
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.render();
    }

    clearCompleted() {
        const completedCount = this.todos.filter(todo => todo.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'info');
            return;
        }

        if (confirm(`Are you sure you want to clear ${completedCount} completed task(s)?`)) {
            this.todos = this.todos.filter(todo => !todo.completed);
            this.saveToLocalStorage();
            this.render();
            this.showNotification('Completed tasks cleared!', 'success');
        }
    }

    clearAll() {
        if (this.todos.length === 0) {
            this.showNotification('No tasks to clear!', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear ALL tasks? This action cannot be undone.')) {
            this.todos = [];
            this.saveToLocalStorage();
            this.render();
            this.showNotification('All tasks cleared!', 'success');
        }
    }

    // Drag and Drop functionality
    dragStart(e) {
        if (e.target.classList.contains('todo-item')) {
            this.draggedItem = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', e.target.innerHTML);
        }
    }

    dragOver(e) {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(e.clientY);
        const dragging = document.querySelector('.dragging');
        
        if (afterElement == null) {
            this.todoList.appendChild(dragging);
        } else {
            this.todoList.insertBefore(dragging, afterElement);
        }
    }

    drop(e) {
        e.preventDefault();
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
            
            // Update todos order based on new DOM order
            const newTodos = [];
            const todoItems = this.todoList.querySelectorAll('.todo-item');
            
            todoItems.forEach(item => {
                const id = parseInt(item.dataset.id);
                const todo = this.todos.find(t => t.id === id);
                if (todo) newTodos.push(todo);
            });
            
            this.todos = newTodos;
            this.saveToLocalStorage();
        }
    }

    dragEnd(e) {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
            this.draggedItem = null;
        }
    }

    getDragAfterElement(y) {
        const draggableElements = [...this.todoList.querySelectorAll('.todo-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            default:
                return this.todos;
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        this.totalTasks.textContent = total;
        this.completedTasks.textContent = completed;
        this.pendingTasks.textContent = pending;
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.todoList.style.display = 'block';
            this.emptyState.style.display = 'none';
            
            this.todoList.innerHTML = filteredTodos.map(todo => `
                <li class="todo-item ${todo.completed ? 'completed' : ''}" 
                    data-id="${todo.id}" draggable="true">
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                         onclick="app.toggleTodo(${todo.id})">
                        ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <span class="todo-text" ondblclick="app.editTodo(${todo.id})">
                        ${this.escapeHtml(todo.text)}
                    </span>
                    <div class="todo-actions">
                        <button class="edit-btn" onclick="app.editTodo(${todo.id})" 
                                title="Edit task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="app.deleteTodo(${todo.id})" 
                                title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `).join('');
        }

        this.updateStats();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles for notification
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 15px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                border-left: 4px solid #4facfe;
            }
            .notification-success { border-left-color: #28a745; }
            .notification-error { border-left-color: #dc3545; }
            .notification-info { border-left-color: #17a2b8; }
            .notification button {
                background: none;
                border: none;
                cursor: pointer;
                color: #6c757d;
                padding: 5px;
            }
            .notification button:hover {
                color: #333;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        
        if (!document.querySelector('#notification-styles')) {
            style.id = 'notification-styles';
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
});

// Add some sample data for first-time users
if (!localStorage.getItem('todos') && !localStorage.getItem('hasVisited')) {
    const sampleTodos = [
        { id: 1, text: 'Welcome to your Todo App!', completed: false, createdAt: new Date().toISOString() },
        { id: 2, text: 'Click the checkbox to mark complete', completed: true, createdAt: new Date().toISOString() },
        { id: 3, text: 'Double-click a task to edit it', completed: false, createdAt: new Date().toISOString() },
        { id: 4, text: 'Drag and drop to reorder tasks', completed: false, createdAt: new Date().toISOString() }
    ];
    localStorage.setItem('todos', JSON.stringify(sampleTodos));
    localStorage.setItem('hasVisited', 'true');
}