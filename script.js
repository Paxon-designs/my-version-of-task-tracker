// ================= CONFIG =================
const STORAGE_KEY = "todo_tasks";

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
const trailLayer = document.querySelector("#trail-layer");
const ul = document.querySelector("ul");
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

    this.animate = this.animate.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    window.addEventListener("mousemove", this.handleMouseMove);
    requestAnimationFrame(this.animate);
  }

  handleMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  animate() {
    this.vx += (this.mouseX - this.cx) * this.physics.stiffness;
    this.vy += (this.mouseY - this.cy) * this.physics.stiffness;
    this.vx *= this.physics.damping;
    this.vy *= this.physics.damping;

    this.cx += this.vx;
    this.cy += this.vy;

    this.cursor.style.left = `${this.cx}px`;
    this.cursor.style.top = `${this.cy}px`;

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
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const dist = Math.hypot(dx, dy);

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

    // POP IN
    requestAnimationFrame(() => {
      img.style.transition =
        "transform 250ms cubic-bezier(.2,.8,.2,1), opacity 200ms ease-out";
      img.style.opacity = "1";
      img.style.transform = `translate(-50%, -50%) scale(1.15) rotate(${rotation}deg)`;
    });

    // SHRINK OUT
    setTimeout(() => {
      img.style.transition =
        "transform 600ms cubic-bezier(.4,0,.2,1), opacity 600ms ease-in";
      img.style.opacity = "0";
      img.style.transform = `translate(-50%, -50%) scale(0.5) rotate(${rotation}deg)`;
    }, 250);

    // REMOVE
    setTimeout(() => img.remove(), 900);
  }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  TaskUI.render(ul);

  // controllers
  new CursorController(cursor, CURSOR_PHYSICS);
  new TrailController(trailLayer, TRAIL_CONFIG, trailImages);
});

// ================= UI INTERACTIONS =================

// blend mode toggle
container.addEventListener("mouseenter", () =>
  cursor.classList.add("invert")
);

container.addEventListener("mouseleave", () =>
  cursor.classList.remove("invert")
);

// list interactions
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

// add button
btn.addEventListener("click", (e) => {
  e.stopPropagation();

  const isActive = btn.classList.toggle("active");
  input.style.display = isActive ? "initial" : "none";

  if (isActive) input.focus();
  else input.value = "";
});

// container click collapse
container.addEventListener("click", (e) => {
  const clickedBtn = btn.contains(e.target);
  const clickedInput = input.contains(e.target);

  if (!clickedBtn && !clickedInput) {
    btn.classList.remove("active");
    input.style.display = "none";
    input.value = "";
  }
});

// enter to add
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && input.value.trim()) {
    const tasks = StorageService.getTasks();

    tasks.push({
      text: input.value.trim(),
      completed: false
    });

    StorageService.saveTasks(tasks);
    TaskUI.render(ul);

    input.value = "";
    input.focus();
  }
});

// outside click collapse
document.addEventListener("click", (e) => {
  if (!container.contains(e.target)) {
    btn.classList.remove("active");
    input.style.display = "none";
    input.value = "";
  }
});

// prevent bubbling
input.addEventListener("click", (e) => e.stopPropagation());

// clear all
clearBtn.addEventListener("click", () => {
  clearBtn.classList.toggle("rotate");
  StorageService.clear();
  TaskUI.render(ul);
});
