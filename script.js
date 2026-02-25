// --- Configuration & State ---
const STORAGE_KEY = "todo_tasks";

const TRAIL_CONFIG = {
  spawnDistance: 68,
  size: 96,
  rotationRange: 45,
  maxPerImage: 2
};

const CURSOR_PHYSICS = {
  stiffness: 0.009  ,
  damping: 0.8
};

const trailImages = [
  "assets/trails/TD1.png", "assets/trails/TD2.png", "assets/trails/TD3.png",
  "assets/trails/TD4.png", "assets/trails/TD5.png", "assets/trails/TD6.png",
  "assets/trails/TD7.png", "assets/trails/TD8.png", "assets/trails/TD9.png",
  "assets/trails/TD10.png", "assets/trails/TD11.png"
];

let shuffledTrail = [];;
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
  // refill and shuffle when empty
  if (shuffledTrail.length === 0) {
    shuffledTrail = [...trailImages].sort(() => Math.random() - 0.5);
  }

  return shuffledTrail.pop();
}

function spawnTrailImage(x, y) {
  const src = getNextTrailImage();
  const img = document.createElement("img");

  img.classList.add("trail-img");

  const baseRotation = randomBetween(
    -TRAIL_CONFIG.rotationRange,
    TRAIL_CONFIG.rotationRange
  );

  Object.assign(img.style, {
    width: `${TRAIL_CONFIG.size}px`,
    left: `${x}px`,
    top: `${y}px`,
    transform: `translate(-50%, -50%) scale(0.6) rotate(${baseRotation}deg)`
  });

  img.src = src;
  trailLayer.appendChild(img);

  // 🔥 POP OUT (next frame so browser registers start state)
  requestAnimationFrame(() => {
    img.style.transition =
      "transform 250ms cubic-bezier(.2,.8,.2,1), opacity 200ms ease-out";
    img.style.opacity = "1";
    img.style.transform = `translate(-50%, -50%) scale(1.15) rotate(${baseRotation}deg)`;
  });

  // 🔻 SHRINK + FADE OUT
  setTimeout(() => {
    img.style.transition =
      "transform 600ms cubic-bezier(.4,0,.2,1), opacity 600ms ease-in";
    img.style.opacity = "0";
    img.style.transform = `translate(-50%, -50%) scale(0.5) rotate(${baseRotation}deg)`;
  }, 250);

  // 💀 remove
  setTimeout(() => {
    img.remove();
  }, 900);
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

container.addEventListener("mouseenter", () =>
  cursor.classList.add("invert")
);

container.addEventListener("mouseleave", () =>
  cursor.classList.remove("invert")
);

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



btn.addEventListener("click", (e) => {
  e.stopPropagation(); // VERY important

  const isActive = btn.classList.toggle("active");

  input.style.display = isActive ? "initial" : "none";

  if (isActive) {
    input.focus();
  } else {
    input.value = "";
  }
});

container.addEventListener("click", (e) => {
  const clickedBtn = btn.contains(e.target);
  const clickedInput = input.contains(e.target);

  if (!clickedBtn && !clickedInput) {
    btn.classList.remove("active");
    input.style.display = "none";
    input.value = "";
  }
});
 
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && input.value.trim()) {
    const tasks = getTasks();

    tasks.push({
      text: input.value.trim(),
      completed: false
    });

    saveTasks(tasks);
    renderTasks();
    
    // Reset UI State
    input.value = "";
    input.focus(); 
  }
});

document.addEventListener("click", (e) => {
  const clickedInsideContainer = container.contains(e.target);

  if (!clickedInsideContainer) {
    btn.classList.remove("active");
    input.style.display = "none";
    input.value = "";
  }
});

input.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Consolidated Clear Button Listener
clearBtn.addEventListener("click", () => {
  clearBtn.classList.toggle("rotate");
  localStorage.removeItem(STORAGE_KEY);
  renderTasks();
});
