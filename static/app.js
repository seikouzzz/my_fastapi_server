const PAGE_SIZE = 5;
const GENDERS = ["男", "女", "未知"];
let currentPage = 1;
let editingUid = null;   // 正在编辑的用户 id
let deletingUid = null;  // 待删除的用户 id

// DOM
const tbody = document.getElementById("user-tbody");
const pageInfo = document.getElementById("page-info");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

const addForm = document.getElementById("add-form");
const addError = document.getElementById("add-error");

const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editError = document.getElementById("edit-error");
const editCancel = document.getElementById("edit-cancel");

const deleteModal = document.getElementById("delete-modal");
const deleteText = document.getElementById("delete-text");
const deleteCancel = document.getElementById("delete-cancel");
const deleteConfirm = document.getElementById("delete-confirm");

// 年龄验证：必须是 0-150 的整数
function validateAge(value) {
  if (!/^\d+$/.test(String(value).trim())) {
    return "年龄必须是 0-150 的整数";
  }
  const age = Number(value);
  if (age < 0 || age > 150) {
    return "年龄必须在 0-150 之间";
  }
  return null;
}

function showError(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}

function hideError(el) {
  el.hidden = true;
  el.textContent = "";
}

// 加载用户列表
async function loadUsers(page = 1) {
  currentPage = page;
  try {
    const res = await fetch(`/users/list?page=${page}&page_size=${PAGE_SIZE}`);
    const data = await res.json();
    const totalPages = data.total_pages ?? 0;
    renderTable(data.users || []);
    pageInfo.textContent = `第 ${page} 页 / 共 ${totalPages} 页`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">加载失败：${err.message}</td></tr>`;
  }
}

// 渲染表格，行结构为 [uid, name, password, age, gender]
function renderTable(users) {
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">暂无数据</td></tr>`;
    return;
  }
  tbody.innerHTML = users
    .map(([uid, name, password, age, gender]) => `
      <tr>
        <td>${uid}</td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(password)}</td>
        <td>${age ?? "-"}</td>
        <td>${escapeHtml(gender ?? "-")}</td>
        <td>
          <div class="actions">
            <button class="secondary" data-action="edit" data-uid="${uid}">编辑</button>
            <button class="danger" data-action="delete" data-uid="${uid}">删除</button>
          </div>
        </td>
      </tr>
    `)
    .join("");
}

// 通过事件委托处理编辑/删除按钮点击
tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const uid = Number(btn.dataset.uid);
  if (btn.dataset.action === "edit") openEdit(uid);
  else if (btn.dataset.action === "delete") openDelete(uid);
});

// 添加用户
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(addForm);
  let age = String(fd.get("age") ?? "").trim();
  if (age === "") age = "0"; // 可选：留空时默认 0
  fd.set("age", age);
  const ageErr = validateAge(age);
  if (ageErr) {
    showError(addError, ageErr);
    return;
  }
  hideError(addError);
  try {
    const res = await fetch(`/users/add?${new URLSearchParams(fd).toString()}`);
    if (!res.ok) throw new Error("请求失败");
    addForm.reset();
    loadUsers(currentPage);
  } catch (err) {
    showError(addError, "添加失败：" + err.message);
  }
});

// 打开编辑弹窗：先获取该用户最新数据
async function openEdit(uid) {
  try {
    const res = await fetch(`/users/${uid}`);
    const data = await res.json();
    const user = data.user;
    if (!user) {
      alert("未找到该用户");
      return;
    }
    editingUid = uid;
    const [, name, password, age, gender] = user;
    editForm.name.value = name ?? "";
    editForm.password.value = password ?? "";
    editForm.age.value = age ?? "";
    setGenderSelect(editForm.gender, gender);
    hideError(editError);
    editModal.hidden = false;
  } catch (err) {
    alert("获取用户失败：" + err.message);
  }
}

// 设置性别下拉：历史数据若不在选项中则动态追加
function setGenderSelect(select, value) {
  if (GENDERS.includes(value)) {
    select.value = value;
  } else if (value) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
    select.value = value;
  } else {
    select.value = "未知";
  }
}

// 提交编辑
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(editForm);
  let age = String(fd.get("age") ?? "").trim();
  if (age === "") age = "0"; // 可选：留空时默认 0
  fd.set("age", age);
  const ageErr = validateAge(age);
  if (ageErr) {
    showError(editError, ageErr);
    return;
  }
  hideError(editError);
  try {
    const res = await fetch(`/users/update/${editingUid}?${new URLSearchParams(fd).toString()}`);
    if (!res.ok) throw new Error("请求失败");
    editModal.hidden = true;
    loadUsers(currentPage);
  } catch (err) {
    showError(editError, "更新失败：" + err.message);
  }
});

editCancel.addEventListener("click", () => {
  editModal.hidden = true;
});

// 删除：弹出自定义白色确认框
function openDelete(uid) {
  deletingUid = uid;
  deleteText.textContent = `确定要删除 ID 为 ${uid} 的用户吗？此操作不可恢复。`;
  deleteModal.hidden = false;
}

deleteConfirm.addEventListener("click", async () => {
  try {
    const res = await fetch(`/users/delete/${deletingUid}`);
    if (!res.ok) throw new Error("请求失败");
    deleteModal.hidden = true;
    loadUsers(currentPage);
  } catch (err) {
    alert("删除失败：" + err.message);
  }
});

deleteCancel.addEventListener("click", () => {
  deleteModal.hidden = true;
});

// 点击遮罩区域关闭弹窗
[deleteModal, editModal].forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target === m) m.hidden = true;
  });
});

// 分页
prevBtn.addEventListener("click", () => loadUsers(currentPage - 1));
nextBtn.addEventListener("click", () => loadUsers(currentPage + 1));

// 简单的转义，防止 XSS
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 初始加载
loadUsers(1);

// 鼠标防复制：禁止右键菜单、复制、剪切
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("copy", (e) => e.preventDefault());
document.addEventListener("cut", (e) => e.preventDefault());
