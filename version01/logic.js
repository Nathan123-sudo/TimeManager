
function scheduleTasks(tasks) {
  const schedule = {};

  tasks.forEach(task => {
    const start = new Date(task.start);
    const end = new Date(task.end);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const dailyHours = (task.estimatedHours / days).toFixed(1);

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      if (!schedule[dateStr]) schedule[dateStr] = [];
      schedule[dateStr].push({
        name: task.name,
        hours: dailyHours,
        category: task.category || "📁 其他任务",
        priority: task.priority || "中",
        timeRange: task.timeRange || ["?", "?"]
      });
    }
  });

  return schedule;
}

function renderSchedule(schedule) {
  const container = document.getElementById("schedule");
  container.innerHTML = "";

  const completedHours = JSON.parse(localStorage.getItem("completedHours") || "{}");

  Object.keys(schedule).sort().forEach(date => {
    const dayBlock = document.createElement("div");
    dayBlock.className = "day-block";

    const title = document.createElement("strong");
    title.textContent = date;
    dayBlock.appendChild(title);

    schedule[date].forEach((item, i) => {
      if (currentCategory && item.category !== currentCategory) return;
      const taskId = `${date}-${item.name}`;
      const done = parseFloat(completedHours[taskId]) || 0;
      const total = parseFloat(item.hours);
      const percent = Math.min(100, Math.round((done / total) * 100));

      let color = "#888";
      if (item.priority === "高") color = "#e74c3c";
      else if (item.priority === "中") color = "#f39c12";
      else if (item.priority === "低") color = "#27ae60";

      const label = document.createElement("label");
      label.innerHTML = `
        <span style="color:${color};font-weight:bold;">[${item.priority}]</span>
        ${item.name} - ${item.hours}小时
        <span style="color:#888">${item.category}</span>
        <span style="color:#3498db;margin-left:8px;">
          ⏰ ${item.timeRange[0]}~${item.timeRange[1]}
        </span>
        <br>
        <progress value="${done}" max="${total}" style="width:120px;vertical-align:middle"></progress>
        <span style="margin-left:8px;">${done}/${total}小时 (${percent}%)</span>
        <input type="number" min="0" max="${total}" step="0.1" value="${done}" style="width:50px;margin-left:8px;" 
          onchange="updateCompletedHours('${taskId}', this.value, ${total})">
        <button onclick="editTask('${item.name}')" style="margin-left:8px;">编辑</button>
        <button onclick="deleteTask('${item.name}')" style="margin-left:4px;color:red;">删除</button>
      `;
      dayBlock.appendChild(document.createElement("br"));
      dayBlock.appendChild(label);
    });

    container.appendChild(dayBlock);
  });
}

function updateCompletedHours(taskId, value, max) {
  let completedHours = JSON.parse(localStorage.getItem("completedHours") || "{}");
  let v = Math.max(0, Math.min(parseFloat(value) || 0, max));
  completedHours[taskId] = v;
  localStorage.setItem("completedHours", JSON.stringify(completedHours));
  renderSchedule(scheduleTasks(JSON.parse(localStorage.getItem("tasks") || "[]")));
  if (typeof renderProgress === "function") renderProgress();
}

function toggleDone(taskId) {
  const completed = JSON.parse(localStorage.getItem("completed") || "{}");
  completed[taskId] = !completed[taskId];
  localStorage.setItem("completed", JSON.stringify(completed));
  renderSchedule(scheduleTasks(JSON.parse(localStorage.getItem("tasks") || "[]")));
}

function editTask(name) {
  location.href = `add_task.html?edit=${encodeURIComponent(name)}`;
}

function deleteTask(name) {
  if (!confirm("确定要删除该任务吗？")) return;
  let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  tasks = tasks.filter(t => t.name !== name);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderSchedule(scheduleTasks(tasks));
  if (typeof renderProgress === "function") renderProgress();
}

let currentCategory = "";

function filterByCategory() {
  currentCategory = document.getElementById("categoryFilter").value;
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const schedule = scheduleTasks(tasks);
  renderSchedule(schedule);
  if (typeof renderProgress === "function") renderProgress();
}
