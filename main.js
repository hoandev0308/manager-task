const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// Lấy các phần tử từ HTML
const addBtn = $(".add-btn");
const formAdd = $("#addTaskModal");
const formDelete = $("#deleteTaskModal");
const modalClose = $(".modal-close");
const btnCancel = $(".btn-cancel");
const btnDeleteCancel = $(".btn-delete-cancel");
const modalDeleteClose = $(".modal-delete-close");
const deleteTaskSubmit = $("#deleteTaskSubmit.btn-danger");
const todoForm = $(".todo-app-form");
const titleInput = $("#taskTitle");
const todoList = $("#todoList");
const searchInput = $(".search-input");
const activeTabBtn = $(".active-tab");
const completedTabBtn = $(".completed-btn");
const allTabBtn = $(".all-tab");
const tabs = $(".tabs");

const TAB_KEYS = {
    activeTab: "active-tab",
    completedTab: "completed-tab"
};

document.addEventListener("DOMContentLoaded", function () {
    // Lấy activeTab từ localStorage
    const activeTab = localStorage.getItem("activeTab") || "all-tab";

    // Bỏ class active khỏi các tab
    $$(".tab-button").forEach(tab => tab.classList.remove("active"));

    // Tìm đúng tab đang lưu và set class active
    const currentTab = $(`.tab-button[data-tab="${activeTab}"]`);

    if (currentTab) {
        currentTab.classList.add("active");
    }

    // Hiển thị danh sách task khi trang web tải xong
    switch (activeTab) {
        case TAB_KEYS.activeTab:
            const activeTasks = todoTasks.filter(task => !task.isCompleted);
            renderTasks(activeTasks);
            break;

        case TAB_KEYS.completedTab:
            const completedTabs = todoTasks.filter(task => task.isCompleted);
            renderTasks(completedTabs);
            break;

        default:
            renderTasks(todoTasks);
            break;
    }
});

// Hàm xóa dấu tiếng việt để tìm kiếm
function removeVietnameseTones(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
}

// Khi người dùng gõ vào ô tìm kiếm
searchInput.oninput = function (event) {
    const keyword = removeVietnameseTones(event.target.value);

    const filteredTasks = todoTasks.filter(task => {
        const title = removeVietnameseTones(task.title);
        const description = removeVietnameseTones(task.description);

        return title.includes(keyword) || description.includes(keyword);
    });

    renderTasks(filteredTasks);
};

// Biến để theo dõi đang sửa task nào (null = không sửa)
let editIndex = null;

// Biến để theo dõi đang xóa task nào (null = không xóa)
let deleteIndex = null;

// Hàm đóng form thêm/sửa task
function closeForm() {
    // Ẩn form
    formAdd.className = "modal-overlay";

    // Đổi lại tiêu đề form về ban đầu
    const formTitle = formAdd.querySelector(".modal-title");
    if (formTitle) {
        formTitle.textContent =
            formTitle.dataset.original || formTitle.textContent;
        delete formTitle.dataset.original;
    }

    // Đổi lại text nút submit về ban đầu
    const submitBtn = formAdd.querySelector(".btn-submit");
    if (submitBtn) {
        submitBtn.textContent =
            submitBtn.dataset.original || submitBtn.textContent;
        delete submitBtn.dataset.original;
    }

    // Cuộn form lên đầu
    setTimeout(() => {
        formAdd.querySelector(".modal").scrollTop = 0;
    }, 300);

    // Xóa hết dữ liệu trong form
    todoForm.reset();

    // Đặt lại trạng thái không sửa task nào
    editIndex = null;
}

function closeFormDelete() {
    // Ẩn form delete
    formDelete.className = "modal-overlay";
}

// Hàm mở form thêm/sửa task
function openFormModal() {
    formAdd.className = "modal-overlay show";
    setTimeout(() => titleInput.focus(), 100);
}

// Hàm mở form confirm xác nhận xóa
function openFormDeleteModal(task, taskIndex) {
    formDelete.className = "modal-overlay show";

    const messageDelete = formDelete.querySelector('.delete-message');
    messageDelete.innerHTML = `Are you sure delete task <span class="delete-title">${task.title}?</span>`;

    deleteIndex = taskIndex;
}

// Khi nhấn nút "Thêm mới"
addBtn.onclick = openFormModal;
// addBtn.onclick = openFormDeleteModal;

// Khi nhấn nút đóng form
modalClose.onclick = closeForm;
btnCancel.onclick = closeForm;

// Khi nhấn nút đóng form `delete`
btnDeleteCancel.onclick = closeFormDelete;
modalDeleteClose.onclick = closeFormDelete;

// Lấy danh sách task từ bộ nhớ trình duyệt (nếu có)
const todoTasks = JSON.parse(localStorage.getItem("todoTasks")) ?? [];

// Khi gửi form (thêm mới hoặc sửa task)
todoForm.onsubmit = (event) => {
    event.preventDefault();
    // Lấy dữ liệu từ form
    const formData = Object.fromEntries(new FormData(todoForm));

    // Nếu đang sửa task
    if (editIndex) {
        todoTasks[editIndex] = formData;

        // Thông báo khi đã sửa thành công
        showToast({
            text: "Edit task successfully!",
            backgroundColor: "#0d6efd",
        });
    }
    // Nếu đang thêm task mới
    else {
        // Đánh dấu task chưa hoàn thành
        formData.isCompleted = false;

        // Thêm task mới vào đầu danh sách
        todoTasks.unshift(formData);

        // Thông báo khi đã tạo thành công
        showToast({
            text: "Create task successfully!",
            backgroundColor: "#62ac89",
        });

    }

    // Lưu danh sách task vào bộ nhớ
    saveTasks();

    // Đóng form
    closeForm();

    // Hiển thị lại danh sách task
    const activeTab = localStorage.getItem("activeTab") || "all-tab";
    const tasks = getTasksByTab(activeTab);

    renderTasks(tasks);
};

// Hàm lưu danh sách task vào bộ nhớ trình duyệt
function saveTasks() {
    localStorage.setItem("todoTasks", JSON.stringify(todoTasks));
}

// Hàm lưu trạng thái tab đang chọn
function saveTabActive(tab = "all-tab") {
    localStorage.setItem("activeTab", tab);
}

// Xử lý khi nhấn các nút trong danh sách task
todoList.onclick = function (event) {
    const editBtn = event.target.closest(".edit-btn");
    const deleteBtn = event.target.closest(".delete-btn");
    const completeBtn = event.target.closest(".complete-btn");

    // Nếu nhấn nút sửa
    if (editBtn) {
        const taskIndex = editBtn.dataset.index;
        const task = todoTasks[taskIndex];

        // Đánh dấu đang sửa task này
        editIndex = taskIndex;

        // Điền thông tin task vào form
        for (const key in task) {
            const value = task[key];
            const input = $(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        }

        // Đổi tiêu đề form thành "Edit Task"
        const formTitle = formAdd.querySelector(".modal-title");
        if (formTitle) {
            formTitle.dataset.original = formTitle.textContent;
            formTitle.textContent = "Edit Task";
        }

        // Đổi text nút submit thành "Save Task"
        const submitBtn = formAdd.querySelector(".btn-submit");
        if (submitBtn) {
            submitBtn.dataset.original = submitBtn.textContent;
            submitBtn.textContent = "Save Task";
        }

        // Mở form
        openFormModal();
    }

    // Nếu nhấn nút xóa
    if (deleteBtn) {
        const taskIndex = deleteBtn.dataset.index;
        const task = todoTasks[taskIndex];

        // Hiển thị modal xác nhận trước khi xóa
        openFormDeleteModal(task, taskIndex);
    }


    // Nếu nhấn nút hoàn thành/chưa hoàn thành
    if (completeBtn) {
        const taskIndex = completeBtn.dataset.index;
        const task = todoTasks[taskIndex];

        // Đổi trạng thái hoàn thành
        task.isCompleted = !task.isCompleted;

        // Lưu và hiển thị lại
        saveTasks();
        renderTasks();
    }
};

deleteTaskSubmit.onclick = function () {
    // Xóa task khỏi danh sách,
    todoTasks.splice(deleteIndex, 1);

    // Lưu và hiển thị lại
    saveTasks();
    renderTasks();

    showToast({
        text: "Delete task successfully!",
        backgroundColor: "#62ac89",
    });

    // Close form
    closeFormDelete();
};

// Hàm hiển thị danh sách task ra màn hình
function renderTasks(tasks = todoTasks) {
    // Nếu chưa có task nào
    if (!tasks.length) {
        todoList.innerHTML = `
            <p>Chưa có công việc nào.</p>
        `;
        return;
    }

    // Tạo HTML cho từng task
    const html = tasks
        .map(
            (task, index) => `
        <div class="task-card ${task.color} ${task.isCompleted ? "completed" : ""
                }">
        <div class="task-header">
          <h3 class="task-title">${task.title}</h3>
          <button class="task-menu">
            <i class="fa-solid fa-ellipsis fa-icon"></i>
            <div class="dropdown-menu">
              <div class="dropdown-item edit-btn" data-index="${index}">
                <i class="fa-solid fa-pen-to-square fa-icon"></i>
                Edit
              </div>
              <div class="dropdown-item complete-btn" data-index="${index}">
                <i class="fa-solid fa-check fa-icon"></i>
                ${task.isCompleted ? "Mark as Active" : "Mark as Complete"} 
              </div>
              <div class="dropdown-item delete delete-btn" data-index="${index}">
                <i class="fa-solid fa-trash fa-icon"></i>
                Delete
              </div>
            </div>
          </button>
        </div>
        <p class="task-description">${task.description}</p>
        <div class="task-time">${task.startTime} - ${task.endTime}</div>
      </div>
    `
        )
        .join("");

    // Hiển thị HTML ra màn hình
    todoList.innerHTML = html;
}

tabs.onclick = function (event) {
    const tabButton = event.target.closest(".tab-button");
    // Lấy giá trị tab từ data-tab
    const tabActiveValue = tabButton.dataset.tab;


    if (!tabButton) return;

    // Bỏ các `active` khỏi tất cả tab
    $$(".tab-button").forEach((tab) => tab.classList.remove("active"));

    // Active tab vừa click
    tabButton.classList.add("active");

    // Set localStorage mỗi lần click active 1 tab
    saveTabActive(tabActiveValue);

    // Render đúng khi click vào từng tab
    switch (tabActiveValue) {
        case TAB_KEYS.activeTab:
            const activeTasks = todoTasks.filter(task => !task.isCompleted);
            renderTasks(activeTasks);
            break;

        case "completed-tab":
            const completedTabs = todoTasks.filter(task => task.isCompleted);
            renderTasks(completedTabs);
            break;

        default:
            renderTasks(todoTasks);
            break;
    }
};

function getTasksByTab(tab) {
    switch (tab) {
        case TAB_KEYS.activeTab:
            return todoTasks.filter(task => !task.isCompleted);

        case TAB_KEYS.completedTab:
            return todoTasks.filter(task => task.isCompleted);

        default:
            return todoTasks;
    }
}

function showToast({
    text = "",
    duration = 2000,
    close = true,
    gravity = "top",
    position = "center",
    backgroundColor = "#4CAF50",
    stopOnFocus = true
}) {
    Toastify({
        text,
        duration,
        close,
        gravity,
        position,
        backgroundColor,
        stopOnFocus,
    }).showToast();
}