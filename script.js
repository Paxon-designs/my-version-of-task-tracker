document.addEventListener("DOMContentLoaded", renderTasks);

const cursor = document.querySelector("#idk");
const container = document.querySelector("#container");
const trailLayer = document.querySelector("#trail-layer");

const ul = document.querySelector("ul");
const btn = document.querySelector("#btn");
const input = document.querySelector("#taskInput");

function getTasks() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}


const TRAIL_CONFIG = {
  spawnDistance: 100,
  size: 96,
  rotationRange: 45,
  maxPerImage: 2
};

const CURSOR_PHYSICS = {
  stiffness: 0.08,
  damping: 0.8
};

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

const trailImages = [
  "assets/trails/TD1.png",
  "assets/trails/TD2.png",
  "assets/trails/TD3.png",
  "assets/trails/TD4.png",
  "assets/trails/TD5.png",
  "assets/trails/TD6.png",
  "assets/trails/TD7.png",
  "assets/trails/TD8.png",
  "assets/trails/TD9.png",
  "assets/trails/TD10.png",
  "assets/trails/TD11.png"
];

let trailIndex = 0;
let lastSpawnX = 0;
let lastSpawnY = 0;

// key: image path → value: [img, img]
const activeTrailImages = new Map();

function getNextTrailImage() {
  const src = trailImages[trailIndex];
  trailIndex = (trailIndex + 1) % trailImages.length;
  return src;
}

function spawnTrailImage(x, y) {
  const src = getNextTrailImage();

  const img = document.createElement("img");
  img.src = src;
  img.style.position = "fixed";
  img.style.width = `${TRAIL_CONFIG.size}px`;
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;
  img.style.transform =
    `translate(-50%, -50%) rotate(${randomBetween(
      -TRAIL_CONFIG.rotationRange,
      TRAIL_CONFIG.rotationRange
    )}deg)`;

  trailLayer.appendChild(img);

  if (!activeTrailImages.has(src)) {
    activeTrailImages.set(src, []);
  }

  const instances = activeTrailImages.get(src);
  instances.push(img);

  if (instances.length > TRAIL_CONFIG.maxPerImage) {
    instances.shift().remove();
  }
}

let mouseX = 0, mouseY = 0;
let cx = 0, cy = 0;
let vx = 0, vy = 0;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (distance(mouseX, mouseY, lastSpawnX, lastSpawnY) > TRAIL_CONFIG.spawnDistance) {
    spawnTrailImage(mouseX, mouseY);
    lastSpawnX = mouseX;
    lastSpawnY = mouseY;
  }
});

function animateCursor() {
  const dx = mouseX - cx;
  const dy = mouseY - cy;

  vx += dx * CURSOR_PHYSICS.stiffness;
  vy += dy * CURSOR_PHYSICS.stiffness;

  vx *= CURSOR_PHYSICS.damping;
  vy *= CURSOR_PHYSICS.damping;

  cx += vx;
  cy += vy;

  cursor.style.left = cx + "px";
  cursor.style.top = cy + "px";

  requestAnimationFrame(animateCursor);
}

animateCursor();

container.addEventListener("mouseenter", () => {
  cursor.style.mixBlendMode = "difference";
});

container.addEventListener("mouseleave", () => {
  cursor.style.mixBlendMode = "normal";
});

ul.addEventListener("click", (e) => {
  if (!e.target.classList.contains("delete")) return;

  const taskText = e.target.previousSibling.textContent;
  let tasks = getTasks();

  
  tasks = tasks.filter(task => task !== taskText);
  saveTasks(tasks);

  renderTasks();
});

ul.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete")) return;

  const li = e.target.closest("li");
  if (!li) return;

  li.classList.toggle("strike-through");
});



btn.addEventListener("click", () => {
  btn.classList.toggle("active");
  input.style.display = btn.classList.contains("active") ? "initial" : "none";
  if (btn.classList.contains("active")) input.focus();
  else input.value = "";
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && input.value.trim()) {
    const tasks = getTasks();
    tasks.push(input.value.trim());
    saveTasks(tasks);

    input.value = "";
    input.style.display = "none";
    btn.classList.remove("active");

    renderTasks();
  }
});

const STORAGE_KEY = "todo_tasks";

function renderTasks() {
  ul.innerHTML = "";

  const tasks = getTasks();

  tasks.forEach(task => {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = task;
    text.classList.add("task-text");

    const del = document.createElement("span");
    del.textContent = "✕";
    del.classList.add("delete");

    li.append(text, del);
    ul.appendChild(li);
  });
}

const clearBtn = document.querySelector("#clearBtn");

clearBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderTasks();
});

clearBtn.addEventListener("click", () => {
  clearBtn.classList.toggle("rotate");

  // clear storage + UI
  localStorage.removeItem("todo_tasks");
  renderTasks();
});
