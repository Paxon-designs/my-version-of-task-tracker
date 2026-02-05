// --- Configuration & State ---
const STORAGE_KEY = "todo_tasks";

const TRAIL_CONFIG = {
  spawnDistance: 120,
  size: 96,
  rotationRange: 45,
  maxPerImage: 2
};

const CURSOR_PHYSICS = {
  stiffness: 0.08,
  damping: 0.8
};

const trailImages = [
  "assets/trails/TD1.png", "assets/trails/TD2.png", "assets/trails/TD3.png",
  "assets/trails/TD4.png", "assets/trails/TD5.png", "assets/trails/TD6.png",
  "assets/trails/TD7.png", "assets/trails/TD8.png", "assets/trails/TD9.png",
  "assets/trails/TD10.png", "assets/trails/TD11.png"
];

let trailIndex = 0;
let lastSpawnX = 0, lastSpawnY = 0;
let mouseX = 0, mouseY = 0;
let cx = 0, cy = 0;
let vx = 0, vy = 0;

const activeTrailImages = new Map();

// --- DOM Elements ---
const cursor = document.querySelector("#idk");
const container = document.querySelector("#container");
const trailLayer = document.querySelector("#trail-layer");
const ul = document.querySelector("ul");
const btn = document.querySelector("#btn");
const input = document.querySelector("#taskInput");
const clearBtn = document.querySelector("#clearBtn");

// --- Task Logic ---
const getTasks = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
const saveTasks = (tasks) => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

function renderTasks() {
  ul.innerHTML = "";
  const tasks = getTasks();

  tasks.forEach((task) => {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("strike-through");

    const text = document.createElement("span");
    text.textContent = task.text;
    text.classList.add("task-text");

    const del = document.createElement("span");
    del.textContent = "✕";
    del.classList.add("delete");

    li.append(text, del);
    ul.appendChild(li);
  });
}

// --- Trail & Cursor Logic ---
const randomBetween = (min, max) => Math.random() * (max - min) + min;
const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

function getNextTrailImage() {
  const src = trailImages[trailIndex];
  trailIndex = (trailIndex + 1) % trailImages.length;
  return src;
}

function spawnTrailImage(x, y) {
  const src = getNextTrailImage();
  const img = document.createElement("img");

  Object.assign(img.style, {
    position: "fixed",
    width: `${TRAIL_CONFIG.size}px`,
    left: `${x}px`,
    top: `${y}px`,
    transform: `translate(-50%, -50%) rotate(${randomBetween(-TRAIL_CONFIG.rotationRange, TRAIL_CONFIG.rotationRange)}deg)`
  });
  
  img.src = src;
  trailLayer.appendChild(img);

  if (!activeTrailImages.has(src)) activeTrailImages.set(src, []);
  const instances = activeTrailImages.get(src);
  instances.push(img);

  if (instances.length > TRAIL_CONFIG.maxPerImage) {
    instances.shift().remove();
  }
}

function animateCursor() {
  vx += (mouseX - cx) * CURSOR_PHYSICS.stiffness;
  vy += (mouseY - cy) * CURSOR_PHYSICS.stiffness;
  vx *= CURSOR_PHYSICS.damping;
  vy *= CURSOR_PHYSICS.damping;
  cx += vx;
  cy += vy;

  cursor.style.left = `${cx}px`;
  cursor.style.top = `${cy}px`;
  requestAnimationFrame(animateCursor);
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", renderTasks);

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (distance(mouseX, mouseY, lastSpawnX, lastSpawnY) > TRAIL_CONFIG.spawnDistance) {
    spawnTrailImage(mouseX, mouseY);
    lastSpawnX = mouseX;
    lastSpawnY = mouseY;
  }
});

animateCursor();

container.addEventListener("mouseenter", () => cursor.style.mixBlendMode = "difference");
container.addEventListener("mouseleave", () => cursor.style.mixBlendMode = "normal");

// Consolidated UL Click Listener (Handles Delete AND Toggle)
ul.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  
  const index = [...ul.children].indexOf(li);
  const tasks = getTasks();

  if (e.target.classList.contains("delete")) {
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderTasks();
  } else {
    tasks[index].completed = !tasks[index].completed;
    saveTasks(tasks);
    li.classList.toggle("strike-through");
  }
});

btn.addEventListener("click", () => {
  const isActive = btn.classList.toggle("active");
  input.style.display = isActive ? "initial" : "none";
  if (isActive) input.focus();
  else input.value = "";
});

input.addEventListener("keydown", (e) => {
  const val = input.value.trim();
  if (e.key === "Enter" && val) {
    const tasks = getTasks();
    tasks.push({ text: val, completed: false });
    saveTasks(tasks);
    input.value = "";
    renderTasks();
  }
});

// Consolidated Clear Button Listener
clearBtn.addEventListener("click", () => {
  clearBtn.classList.toggle("rotate");
  localStorage.removeItem(STORAGE_KEY);
  renderTasks();
});
