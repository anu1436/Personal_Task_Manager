document.addEventListener("DOMContentLoaded", function() {
    let tasks = []; 
    fetchTasks();
    
    const addTaskForm = document.querySelector("#add-task-form");
    addTaskForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const formData = new FormData(addTaskForm);
        fetch("/add_task", {
            method: "POST",
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fetchTasks(); 
            } else {
                console.error("Error adding task:", data.message);
            }
        })
        .catch(error => console.error("Error adding task:", error));
    });

    // Delete task event listeners
    document.querySelectorAll('.delete-task').forEach(button => {
        button.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task-id');
            fetch(`/delete_task/${taskId}`, {
                method: "POST",
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchTasks(); // Re-fetch tasks to update the list
                } else {
                    console.error("Error deleting task:", data.message);
                }
            })
            .catch(error => console.error("Error deleting task:", error));
        });
    });

    // Mark task as done event listeners
    document.querySelectorAll('.mark-done').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskId = this.getAttribute('data-task-id');
            const status = this.checked ? 1 : 0;
            fetch(`/mark_task/${taskId}/${status}`, {
                method: "POST",
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Task marked as done:", data);
                } else {
                    console.error("Error updating task status:", data.message);
                }
            })
            .catch(error => console.error("Error updating task status:", error));
        });
    });

    //Edit event listeners
    document.getElementById('tasks-list').addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('edit-task')) {
            const taskId = event.target.getAttribute('data-task-id');
            editTask(taskId);
        }
    });
    
    
    
    document.querySelectorAll('.edit-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const taskId = this.id.replace('edit-form-', '');
            
            const formData = new FormData(this); 
            fetch(`/edit_task/${taskId}`, {
                method: "POST",
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.reload(); 
                } else {
                    console.error("Error updating task:", data.message);
                }
            })
            .catch(error => console.error("Error updating task:", error));
        });
    });
    
    // Sort tasks event listener
    document.getElementById('sort-tasks').addEventListener('click', () => {
        const selectedAlgorithm = document.getElementById('sorting-algorithms').value;
        let startTime, endTime;
    
        startTime = performance.now();
    
        switch (selectedAlgorithm) {
            case 'bubble':
                tasks = bubbleSort(tasks); 
                break;
            case 'selection':
                tasks = selectionSort(tasks);
                break;
            case 'insertion':
                tasks = insertionSort(tasks);
                break;
            
        }
    
        endTime = performance.now();
    
        displaySortTime(selectedAlgorithm, endTime - startTime); 
        renderTasks(tasks); 
    });
    

    // Bubble sort algorithm
    function bubbleSort(tasksArray) {
        let length = tasksArray.length;
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < (length - i - 1); j++) {
                if (new Date(tasksArray[j].due_date) > new Date(tasksArray[j + 1].due_date)) {
                    let temp = tasksArray[j];
                    tasksArray[j] = tasksArray[j + 1];
                    tasksArray[j + 1] = temp;
                }
            }
        }
        return tasksArray;
    }
    //Selection Sort
    function selectionSort(tasksArray) {
        let n = tasksArray.length;
        
        for (let i = 0; i < n; i++) {
            let min = i;
            for (let j = i + 1; j < n; j++) {
                let date1 = new Date(tasksArray[j].due_date);
                let date2 = new Date(tasksArray[min].due_date);
                
                if (date1.getTime() < date2.getTime()) {
                    min = j;
                }
            }
            if (min != i) {
                
                let temp = tasksArray[i];
                tasksArray[i] = tasksArray[min];
                tasksArray[min] = temp;
            }
        }
        return tasksArray;
    }
    
    //Insertion Sort
    function insertionSort(tasksArray) {
        let n = tasksArray.length;
        for (let i = 1; i < n; i++) {
            let current = tasksArray[i];
            let j = i - 1;
            while (j > -1 && (new Date(tasksArray[j].due_date) > new Date(current.due_date))) {
                tasksArray[j + 1] = tasksArray[j];
                j--;
            }
            tasksArray[j + 1] = current;
        }
        return tasksArray;
    }
    
    function fetchTasks() {
        fetch('/get_tasks') 
            .then(response => response.json())
            .then(data => {
                tasks = data;
                renderTasks(tasks);
            })
            .catch(error => console.error("Error fetching tasks:", error));
    }
   
    function displaySortTime(algorithm, timeTaken) {
        const timingDisplay = document.getElementById('timing-display'); 
        timingDisplay.textContent = `${algorithm} Sort took ${timeTaken.toFixed(2)} milliseconds.`;
    }

    function renderTasks(sortedTasks) {
    const tasksList = document.getElementById('tasks-list').getElementsByTagName('ul')[0];
    tasksList.innerHTML = ''; 

    sortedTasks.forEach(task => {
        const li = document.createElement('li');
        li.id = `task-${task.id}`;
        li.innerHTML =  `<form id="edit-form-${task.id}" class="edit-form" style="display:none;">
                        <input type="text" name="title" value="${task.title}" required>
                        <textarea name="description">${task.description}</textarea>
                        <input type="date" name="due_date" value="${task.due_date}">
                        <select name="priority">
                            <option value="1" ${task.priority == 1 ? 'selected' : ''}>Low</option>
                            <option value="2" ${task.priority == 2 ? 'selected' : ''}>Medium</option>
                            <option value="3" ${task.priority == 3 ? 'selected' : ''}>High</option>
                        </select>
                        <button type="submit">Update Task</button>
                        </form>
                        <span class="task-title">${task.title}</span> - 
                        <span class="task-due-date">${task.due_date}</span>
                        <button class="edit-task" data-task-id="${task.id}">Edit</button>
                        <button class="delete-task" data-task-id="${task.id}">Delete</button>
                        <input type="checkbox" class="mark-done" data-task-id="${task.id}" ${task.completion_status ? 'checked' : ''}>
                        <label for="done-${task.id}">Done</label>`;
        tasksList.appendChild(li);
    });

    
    reattachEventListeners();
   }
    
   function reattachEventListeners() {
    document.querySelectorAll('.edit-task').forEach(button => {
        button.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task-id');
            editTask(taskId);
        });
    });
    document.querySelectorAll('.delete-task').forEach(button => {
        button.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task-id');
            deleteTask(taskId);
        });
    });

    document.querySelectorAll('.edit-task').forEach(button => {
        button.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task-id');
            editTask(taskId);
        });
    });

    document.querySelectorAll('.mark-done').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskId = this.getAttribute('data-task-id');
            const isDone = this.checked ? 1 : 0;
            markTaskAsDone(taskId, isDone);
        });
    });
   }

function deleteTask(taskId) {
    fetch(`/delete_task/${taskId}`, {
        method: "POST",
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            fetchTasks(); 
        } else {
            console.error("Error deleting task:", data.message);
        }
    })
    .catch(error => console.error("Error deleting task:", error));
}

function editTask(taskId) {
    console.log(`Looking for edit-form-${taskId}`);
    const editForm = document.getElementById(`edit-form-${taskId}`);
    if (editForm) {
        editForm.style.display = editForm.style.display === 'none' || editForm.style.display === '' ? 'block' : 'none';
    } else {
        console.error(`Edit form not found for task ID ${taskId}.`);
    }
}

function markTaskAsDone(taskId, isDone) {
    fetch(`/mark_task/${taskId}/${isDone ? 1 : 0}`, {
        method: "POST",
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log("Task marked as done:", data);
        } else {
            console.error("Error updating task status:", data.message);
        }
    })
    .catch(error => console.error("Error updating task status:", error));
}


});
