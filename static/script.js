let allTasks = [];

async function handleGoogleLogin(response) {
    try {
        const result = await fetch("/auth/google", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                credential: response.credential
            })
        });

        if (!result.ok) {
            showToast("Google login failed.", true);
            return;
        }

        location.reload();

    } catch (error) {
        console.error(error);
        showToast("Unable to connect to the server.", true);
    }
}


async function loadUser() {
    try {
        const response = await fetch("/auth/me");

        if (response.ok) {
            const user = await response.json();

            document.getElementById("login").style.display = "none";
            document.getElementById("app").style.display = "block";

            document.getElementById("userInfo").textContent =
                `Welcome, ${user.name} (${user.email})`;

            await loadTasks();

        } else {
            document.getElementById("login").style.display = "block";
            document.getElementById("app").style.display = "none";
        }

    } catch (error) {
        console.error(error);
        showToast("Unable to connect to the server.", true);
    }
}


async function loadTasks() {
    try {
        const response = await fetch("/api/tasks");

        if (!response.ok) {
            showToast("Unable to load tasks.", true);
            return;
        }

        allTasks = await response.json();

        updateSummary();
        renderTasks();

    } catch (error) {
        console.error(error);
        showToast("Unable to load tasks.", true);
    }
}


function renderTasks() {
    const container = document.getElementById("tasks");

    const searchText =
        document.getElementById("search").value.toLowerCase().trim();

    const filterStatus =
        document.getElementById("statusFilter").value;

    const filteredTasks = allTasks.filter(task => {

        const matchesSearch =
            task.title.toLowerCase().includes(searchText) ||
            (task.description || "").toLowerCase().includes(searchText);

        const matchesStatus =
            filterStatus === "All" ||
            task.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    container.innerHTML = "";

    if (filteredTasks.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <strong>No tasks found</strong>
                <p>Try changing your search or filter.</p>
            </div>
        `;

        return;
    }

    filteredTasks.forEach(task => {

        const div = document.createElement("div");

        div.className = "task";

        div.innerHTML = `
            <div class="task-header">
                <div>
                    <h3>${escapeHtml(task.title)}</h3>
                </div>

                <select
                    class="task-status"
                    onchange="updateStatus(${task.id}, this.value)"
                >
                    <option value="Planned"
                        ${task.status === "Planned" ? "selected" : ""}>
                        Planned
                    </option>

                    <option value="In Progress"
                        ${task.status === "In Progress" ? "selected" : ""}>
                        In Progress
                    </option>

                    <option value="Complete"
                        ${task.status === "Complete" ? "selected" : ""}>
                        Complete
                    </option>
                </select>
            </div>

            <p class="task-description">
                ${escapeHtml(task.description || "No description provided.")}
            </p>
        `;

        container.appendChild(div);
    });
}


function updateSummary() {

    const total = allTasks.length;

    const planned =
        allTasks.filter(task => task.status === "Planned").length;

    const inProgress =
        allTasks.filter(task => task.status === "In Progress").length;

    const complete =
        allTasks.filter(task => task.status === "Complete").length;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("plannedCount").textContent = planned;
    document.getElementById("progressCount").textContent = inProgress;
    document.getElementById("completeCount").textContent = complete;
}


async function createTask() {

    const titleInput = document.getElementById("title");
    const descriptionInput = document.getElementById("description");
    const button = document.getElementById("createButton");

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!title) {
        showToast("Please enter a task title.", true);
        titleInput.focus();
        return;
    }

    button.disabled = true;
    button.textContent = "Creating...";

    try {

        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                description: description
            })
        });

        if (!response.ok) {

            const error = await response.json();

            showToast(
                error.detail || "Failed to create task.",
                true
            );

            return;
        }

        titleInput.value = "";
        descriptionInput.value = "";

        await loadTasks();

        showToast("Task created successfully.");

    } catch (error) {

        console.error(error);
        showToast("Unable to create task.", true);

    } finally {

        button.disabled = false;
        button.textContent = "Create Task";
    }
}


async function updateStatus(taskId, status) {

    try {

        const response = await fetch(
            `/api/tasks/${taskId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: status
                })
            }
        );

        if (!response.ok) {
            showToast("Failed to update status.", true);
            return;
        }

        const task = allTasks.find(task => task.id === taskId);

        if (task) {
            task.status = status;
        }

        updateSummary();
        renderTasks();

        showToast("Task status updated.");

    } catch (error) {

        console.error(error);
        showToast("Unable to update task status.", true);
    }
}


async function logout() {

    try {

        await fetch("/logout", {
            method: "POST"
        });

        location.reload();

    } catch (error) {

        console.error(error);
        showToast("Logout failed.", true);
    }
}


function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


function showToast(message, isError = false) {

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.style.background = isError ? "#b91c1c" : "#111827";

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("search");

    const statusFilter = document.getElementById("statusFilter");

    searchInput.addEventListener("input", renderTasks);

    statusFilter.addEventListener("change", renderTasks);

    loadUser();
});