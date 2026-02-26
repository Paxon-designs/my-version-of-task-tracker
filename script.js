// ================= CONFIG =================
const STORAGE_KEY = "todo_tasks";
let hasUserInteractedWithAdd = false;

const HINT_CONFIG = {
  baseOffsetX: 16,
  maxOffsetY: 10,
  smooth: 0.15
};

const TRAIL_CONFIG = {
  spawnDistance: 68,
  size: 96,
  rotationRange: 45
};

const CURSOR_PHYSICS = {
  stiffness: 0.009,
  damping: 0.8
};

const trailImages = [
  "assets/trails/TD1.png", "assets/trails/TD2.png", "assets/trails/TD3.png",
  "assets/trails/TD4.png", "assets/trails/TD5.png", "assets/trails/TD6.png",
  "assets/trails/TD7.png", "assets/trails/TD8.png", "assets/trails/TD9.png",
  "assets/trails/TD10.png", "assets/trails/TD11.png"
];

// ================= DOM =================
const cursor = document.querySelector("#idk");
const container = document.querySelector("#container");
const cursorHint = document.querySelector("#cursorHint");
const hintText = cursorHint?.querySelector(".hint-text");
const trailLayer = document.querySelector("#trail-layer");
const ul = document.querySelector("#list");
const btn = document.querySelector("#btn");
const input = document.querySelector("#taskInput");
const clearBtn = document.querySelector("#clearBtn");

// ================= UTIL =================
const randomBetween = (min, max) => Math.random() * (max - min) + min;

// ================= STORAGE SERVICE =================
const StorageService = {
  getTasks() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  },

  saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// ================= TASK UI =================
const TaskUI = {
  render(listEl) {
    listEl.innerHTML = "";
    const tasks = StorageService.getTasks();

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
      listEl.appendChild(li);
    });
  }
};

// ================= CURSOR CONTROLLER =================
class CursorController {
  constructor(cursorEl, physics) {
    this.cursor = cursorEl;
    this.physics = physics;

    this.mouseX = 0;
    this.mouseY = 0;

    this.cx = 0;
    this.cy = 0;
    this.vx = 0;
    this.vy = 0;

    this.hintOffsetY = 0;

    this.animate = this.animate.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    window.addEventListener("mousemove", this.handleMouseMove);
    requestAnimationFrame(this.animate);
  }

  handleMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  // ---------- physics ----------
  updatePhysics() {
    this.vx += (this.mouseX - this.cx) * this.physics.stiffness;
    this.vy += (this.mouseY - this.cy) * this.physics.stiffness;

    this.vx *= this.physics.damping;
    this.vy *= this.physics.damping;

    this.cx += this.vx;
    this.cy += this.vy;
  }

  // ---------- cursor ----------
  updateCursorPosition() {
    this.cursor.style.left = `${this.cx}px`;
    this.cursor.style.top = `${this.cy}px`;
  }

  // ---------- hint anchor ----------
  updateHintAnchor() {
    if (!cursorHint) return;

    cursorHint.style.left = `${this.cx + HINT_CONFIG.baseOffsetX}px`;
    cursorHint.style.top = `${this.cy}px`;
  }

  // ---------- hint motion (hinge effect) ----------
  updateHintMotion() {
    if (!hintText) return;

    const target =
      Math.max(
        -HINT_CONFIG.maxOffsetY,
        Math.min(HINT_CONFIG.maxOffsetY, this.vy * 6)
      );

    this.hintOffsetY +=
      (target - this.hintOffsetY) * HINT_CONFIG.smooth;

    // micro snap when nearly still
    if (Math.abs(this.vy) < 0.01 && Math.abs(this.hintOffsetY) < 0.1) {
      this.hintOffsetY = 0;
    }

    const angle = -this.hintOffsetY * 0.8;
    hintText.style.transform = `rotate(${angle}deg)`;
  }

  // ---------- main loop ----------
  animate() {
    this.updatePhysics();
    this.updateCursorPosition();
    this.updateHintAnchor();
    this.updateHintMotion();

    requestAnimationFrame(this.animate);
  }
}

// ================= TRAIL CONTROLLER =================
class TrailController {
  constructor(layer, config, images) {
    this.layer = layer;
    this.config = config;
    this.images = images;
    this.pool = [];
    this.lastX = 0;
    this.lastY = 0;

    window.addEventListener("mousemove", (e) => {
      this.handleMove(e.clientX, e.clientY);
    });
  }

  getNextImage() {
    if (this.pool.length === 0) {
      this.pool = [...this.images].sort(() => Math.random() - 0.5);
    }
    return this.pool.pop();
  }

  handleMove(x, y) {
    const dist = Math.hypot(x - this.lastX, y - this.lastY);

    if (dist > this.config.spawnDistance) {
      this.spawn(x, y);
      this.lastX = x;
      this.lastY = y;
    }
  }

  spawn(x, y) {
    const img = document.createElement("img");
    const rotation = randomBetween(
      -this.config.rotationRange,
      this.config.rotationRange
    );

    img.classList.add("trail-img");
    img.src = this.getNextImage();

    Object.assign(img.style, {
      width: `${this.config.size}px`,
      left: `${x}px`,
      top: `${y}px`,
      transform: `translate(-50%, -50%) scale(0.6) rotate(${rotation}deg)`
    });

    this.layer.appendChild(img);

    requestAnimationFrame(() => {
      img.style.transition =
        "transform 250ms cubic-bezier(.2,.8,.2,1), opacity 200ms ease-out";
      img.style.opacity = "1";
      img.style.transform =
        `translate(-50%, -50%) scale(1.15) rotate(${rotation}deg)`;
    });

    setTimeout(() => {
      img.style.transition =
        "transform 600ms cubic-bezier(.4,0,.2,1), opacity 600ms ease-in";
      img.style.opacity = "0";
      img.style.transform =
        `translate(-50%, -50%) scale(0.5) rotate(${rotation}deg)`;
    }, 250);

    setTimeout(() => img.remove(), 900);
  }
}

// ================= HINT VISIBILITY =================
let hintTimeout;

function updateCursorHintVisibility(isInsideContainer) {
  const hasTasks = StorageService.getTasks().length > 0;

  if (!cursorHint || !hintText) return;

  if (hasTasks) {
    cursorHint.classList.remove("visible");
    return;
  }

  clearTimeout(hintTimeout);

  if (isInsideContainer) {
    hintText.textContent = hasUserInteractedWithAdd
      ? "Type your task"
      : "Click + to add";

    hintTimeout = setTimeout(() => {
      cursorHint.classList.add("visible");
    }, 120);
  } else {
    cursorHint.classList.remove("visible");
  }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  TaskUI.render(ul);

  new CursorController(cursor, CURSOR_PHYSICS);
  new TrailController(trailLayer, TRAIL_CONFIG, trailImages);
});

// ================= UI INTERACTIONS =================
container.addEventListener("mouseenter", () => {
  cursor.classList.add("invert");
  updateCursorHintVisibility(true);
});

container.addEventListener("mouseleave", () => {
  cursor.classList.remove("invert");
  updateCursorHintVisibility(false);
});

ul.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;

  const index = [...ul.children].indexOf(li);
  const tasks = StorageService.getTasks();

  if (e.target.classList.contains("delete")) {
    tasks.splice(index, 1);
    StorageService.saveTasks(tasks);
    TaskUI.render(ul);
  } else {
    tasks[index].completed = !tasks[index].completed;
    StorageService.saveTasks(tasks);
    li.classList.toggle("strike-through");
  }
});

btn.addEventListener("click", (e) => {
  e.stopPropagation();

  hasUserInteractedWithAdd = true;
  updateCursorHintVisibility(true);

  const isActive = btn.classList.toggle("active");
  input.style.display = isActive ? "initial" : "none";

  if (isActive) input.focus();
  else input.value = "";
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
    const tasks = StorageService.getTasks();

    tasks.push({
      text: input.value.trim(),
      completed: false
    });

    StorageService.saveTasks(tasks);
    TaskUI.render(ul);

    hasUserInteractedWithAdd = true;
    cursorHint?.classList.remove("visible");
    updateCursorHintVisibility(true);

    input.value = "";
    input.focus();
  }
});

document.addEventListener("click", (e) => {
  if (!container.contains(e.target)) {
    btn.classList.remove("active");
    input.style.display = "none";
    input.value = "";
  }
});

input.addEventListener("click", (e) => e.stopPropagation());

clearBtn.addEventListener("click", () => {
  clearBtn.classList.toggle("rotate");
  StorageService.clear();
  TaskUI.render(ul);
  updateCursorHintVisibility(container.matches(":hover"));
});
