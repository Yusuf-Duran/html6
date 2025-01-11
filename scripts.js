const canvas = document.getElementById("drawing-board");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("color");
const sizeInput = document.getElementById("size-input");
const clearButton = document.getElementById("clear");
const saveButton = document.getElementById("save");
const saveNameInput = document.getElementById("save-name");
const gallery = document.getElementById("gallery");
const toolButtons = document.querySelectorAll(".draw-modes button");
const addLayerBtn = document.getElementById("add-layer");
const deleteLayerBtn = document.getElementById("delete-layer");
const layerGrid = document.getElementById("layer-grid");
const notifications = document.getElementById("notifications");
const colorHistory = document.getElementById("color-history");

const showNotification = (message) => {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notifications.appendChild(notification);
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notifications.removeChild(notification);
    }, 500);
  }, 2000);
};

const drawLayers = () => {
  const mainCtx = canvas.getContext("2d");
  mainCtx.clearRect(0, 0, canvas.width, canvas.height);
  layers.forEach((layer) => {
    mainCtx.drawImage(layer, 0, 0);
  });
};

const updateLayerControls = () => {
  layerGrid.innerHTML = "";
  layers.forEach((layer, index) => {
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = 100;
    layerCanvas.height = 100;
    layerCanvas.getContext("2d").drawImage(layer, 0, 0, 100, 100);
    layerCanvas.classList.add("layer-preview");
    if (index === currentLayer) {
      layerCanvas.classList.add("active");
    }
    layerCanvas.addEventListener("click", () => {
      currentLayer = index;
      ctx = layers[currentLayer].getContext("2d");
      drawLayers();
      updateLayerControls();
    });
    layerGrid.appendChild(layerCanvas);
  });
  deleteLayerBtn.disabled = layers.length <= 1;
};

const addLayer = () => {
  const newLayer = document.createElement("canvas");
  newLayer.width = canvas.width;
  newLayer.height = canvas.height;
  newLayer.classList.add("layer");
  layers.push(newLayer);
  currentLayer = layers.length - 1;
  ctx = layers[currentLayer].getContext("2d");
  drawLayers();
  updateLayerControls();
};

const deleteLayer = () => {
  if (layers.length > 1) {
    layers.pop();
    currentLayer = layers.length - 1;
    ctx = layers[currentLayer].getContext("2d");
    drawLayers();
    updateLayerControls();
  } else {
    showNotification("Cannot delete the last layer");
  }
};

let previousDrawing = null;
let layers = [];
let currentLayer = 0;
addLayer();

const tools = {
  pencil: {
    start: () => {
      console.log("Pencil started");
    },
    move: (e) => {
      if (!state.drawing) return;
      const { x, y } = getPosition(e);
      console.log(`Drawing pencil to (${x}, ${y})`);
      ctx.lineWidth = state.size;
      ctx.strokeStyle = state.color;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    end: () => {
      console.log("Pencil ended");
      ctx.beginPath();
    },
  },
  rectangle: {
    start: (e) => {
      const { x, y } = getPosition(e);
      state.startX = x;
      state.startY = y;
      console.log(`Rectangle start at (${x}, ${y})`);
      previousDrawing = ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    move: (e) => {
      if (previousDrawing) {
        ctx.putImageData(previousDrawing, 0, 0);
      }
      const { x, y } = getPosition(e);
      const width = x - state.startX;
      const height = y - state.startY;
      console.log(
        `Rectangle preview from (${state.startX}, ${state.startY}) to (${x}, ${y})`
      );
      ctx.lineWidth = state.size;
      ctx.strokeStyle = state.color;
      ctx.strokeRect(state.startX, state.startY, width, height);
    },
    end: (e) => {
      if (previousDrawing) {
        ctx.putImageData(previousDrawing, 0, 0);
      }
      previousDrawing = null;
      const { x, y } = getPosition(e);
      const width = x - state.startX;
      const height = y - state.startY;
      console.log(
        `Rectangle drawn from (${state.startX}, ${state.startY}) to (${x}, ${y})`
      );
      ctx.lineWidth = state.size;
      ctx.strokeStyle = state.color;
      ctx.strokeRect(state.startX, state.startY, width, height);
    },
  },
  circle: {
    start: (e) => {
      const { x, y } = getPosition(e);
      state.startX = x;
      state.startY = y;
      console.log(`Circle start at (${x}, ${y})`);
      previousDrawing = ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    move: (e) => {
      if (previousDrawing) {
        ctx.putImageData(previousDrawing, 0, 0);
      }
      const { x, y } = getPosition(e);
      const radius = Math.sqrt(
        Math.pow(x - state.startX, 2) + Math.pow(y - state.startY, 2)
      );
      console.log(`Circle preview with radius: ${radius}`);
      ctx.lineWidth = state.size;
      ctx.strokeStyle = state.color;
      ctx.beginPath();
      ctx.arc(state.startX, state.startY, radius, 0, Math.PI * 2);
      ctx.stroke();
    },
    end: (e) => {
      if (previousDrawing) {
        ctx.putImageData(previousDrawing, 0, 0);
      }
      previousDrawing = null;
      const { x, y } = getPosition(e); // Ensure this is using the last known valid position
      const radius = Math.sqrt(
        Math.pow(x - state.startX, 2) + Math.pow(y - state.startY, 2)
      );
      console.log(`Circle drawn with radius: ${radius}`);
      ctx.lineWidth = state.size;
      ctx.strokeStyle = state.color;
      ctx.beginPath();
      ctx.arc(state.startX, state.startY, radius, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  eraser: {
    start: () => {
      console.log("Eraser started");
    },
    move: (e) => {
      if (!state.drawing) return;
      const { x, y } = getPosition(e);
      console.log(`Erasing at (${x}, ${y})`);
      ctx.lineWidth = state.size;
      ctx.strokeStyle = "#ffffff";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    end: () => {
      console.log("Eraser ended");
      ctx.beginPath();
    },
  },
  line: {
    start: (e) => {
      const { x, y } = getPosition(e);
      state.startX = x;
      state.startY = y;
      previousDrawing = ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    move: (e) => {
      if (previousDrawing) {
        ctx.putImageData(previousDrawing, 0, 0);
      }
      const { x, y } = getPosition(e);
      ctx.lineWidth = state.size;
      ctx.strokeStyle = state.color;
      ctx.beginPath();
      ctx.moveTo(state.startX, state.startY);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    end: (e) => {
      if (previousDrawing) {
        ctx.putImageData(previousDrawing, 0, 0);
      }
      previousDrawing = null;
      const { x, y } = getPosition(e);
      ctx.lineWidth = state.size;
      ctx.strokeStyle = state.color;
      ctx.beginPath();
      ctx.moveTo(state.startX, state.startY);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
  },
  triangle: {
    start: (e) => {
      const { x, y } = getPosition(e);
      state.startX = x;
      state.startY = y;
      previousDrawing = ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    move: (e) => {
      if (previousDrawing) {
        ctx.putImageData(previousDrawing, 0, 0);
      }
      const { x, y } = getPosition(e);
      const width = x - state.startX;
      const height = y - state.startY;
      ctx.lineWidth = state.size;
      ctx.strokeStyle = state.color;
      ctx.beginPath();
      ctx.moveTo(state.startX, state.startY);
      ctx.lineTo(state.startX + width / 2, state.startY + height);
      ctx.lineTo(state.startX - width / 2, state.startY + height);
      ctx.closePath();
      ctx.stroke();
    },
    end: (e) => {
      if (previousDrawing) {
        ctx.putImageData(previousDrawing, 0, 0);
      }
      previousDrawing = null;
      const { x, y } = getPosition(e);
      const width = x - state.startX;
      const height = y - state.startY;
      ctx.lineWidth = state.size;
      ctx.strokeStyle = state.color;
      ctx.beginPath();
      ctx.moveTo(state.startX, state.startY);
      ctx.lineTo(state.startX + width / 2, state.startY + height);
      ctx.lineTo(state.startX - width / 2, state.startY + height);
      ctx.closePath();
      ctx.stroke();
    },
  },
  star: {
    start: (e) => {
      const { x, y } = getPosition(e);
      state.startX = x;
      state.startY = y;
      previousDrawing = ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    move: (e) => {
      if (previousDrawing) {
        ctx.putImageData(previousDrawing, 0, 0);
      }
      const { x, y } = getPosition(e);
      const radius = Math.sqrt(
        Math.pow(x - state.startX, 2) + Math.pow(y - state.startY, 2)
      );
      drawStar(ctx, state.startX, state.startY, 5, radius, radius / 2);
    },
    end: (e) => {
      if (previousDrawing) {
        ctx.putImageData(previousDrawing, 0, 0);
      }
      previousDrawing = null;
      const { x, y } = getPosition(e);
      const radius = Math.sqrt(
        Math.pow(x - state.startX, 2) + Math.pow(y - state.startY, 2)
      );
      drawStar(ctx, state.startX, state.startY, 5, radius, radius / 2);
    },
  },
};

const drawStar = (ctx, x, y, points, outerRadius, innerRadius) => {
  ctx.lineWidth = state.size;
  ctx.strokeStyle = state.color;
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    ctx.lineTo(
      x + outerRadius * Math.cos((i * 2 * Math.PI) / points),
      y + outerRadius * Math.sin((i * 2 * Math.PI) / points)
    );
    ctx.lineTo(
      x + innerRadius * Math.cos(((i + 0.5) * 2 * Math.PI) / points),
      y + innerRadius * Math.sin(((i + 0.5) * 2 * Math.PI) / points)
    );
  }
  ctx.closePath();
  ctx.stroke();
};
const state = {
  tool: "pencil",
  color: colorPicker.value,
  size: parseInt(sizeInput.value),
  drawing: false,
  startX: 0,
  startY: 0,
};

const getPosition = (e) => {
  console.log(e);
  const rect = canvas.getBoundingClientRect();
  let x, y;

  if (e.touches && e.touches.length > 0) {
    // Handle touch events
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else if (e.clientX && e.clientY) {
    // Handle mouse events
    x = e.clientX;
    y = e.clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    x = e.changedTouches[0].clientX;
    y = e.changedTouches[0].clientY;
  } else {
    return { x: 0, y: 0 }; // Return 0,0 if no valid position found
  }

  return { x: x - rect.left, y: y - rect.top };
};

const setTool = (tool) => {
  console.log(`Tool set to: ${tool}`);
  state.tool = tool;
  toolButtons.forEach((button) => button.classList.remove("active"));
  document.querySelector(`button[data-tool="${tool}"]`).classList.add("active");
};

const startDrawing = (e) => {
  console.log("Drawing started");
  state.drawing = true;
  tools[state.tool].start(e);
};

const draw = (e) => {
  if (state.drawing) {
    console.log("Drawing...");
    tools[state.tool].move(e);
    drawLayers();
    updateLayerControls();
  }
};

const stopDrawing = (e) => {
  if (!state.drawing) return;
  console.log("Drawing stopped");
  tools[state.tool].end(e);
  state.drawing = false;
  drawLayers();
  updateLayerControls();
};

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startDrawing(e);
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  draw(e);
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  stopDrawing(e);
});

clearButton.addEventListener("click", () => {
  console.log("Canvas cleared");
  layers.forEach((layer) => {
    layer.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  });
  drawLayers();
});

const saveDrawing = () => {
  const name = saveNameInput.value.trim();
  if (!name) {
    showNotification("Please enter a name for your drawing!");
    return;
  }

  const layersData = layers.map((layer) => layer.toDataURL());
  const drawings = JSON.parse(localStorage.getItem("drawings") || "[]");
  drawings.push({ name, layers: layersData });
  localStorage.setItem("drawings", JSON.stringify(drawings));
  updateGallery();
  showNotification("Drawing saved!");
};

const loadDrawing = (drawing) => {
  const imgToLoad = new Image();
  imgToLoad.src = drawing.layers[0];
  imgToLoad.onload = () => {
    layers = drawing.layers.map((layerData) => {
      const layer = document.createElement("canvas");
      layer.width = canvas.width;
      layer.height = canvas.height;
      const layerCtx = layer.getContext("2d");
      const img = new Image();
      img.src = layerData;
      img.onload = () => {
        layerCtx.drawImage(img, 0, 0);
        drawLayers();
        updateLayerControls();
      };
      return layer;
    });
    currentLayer = 0;
    ctx = layers[currentLayer].getContext("2d");
    drawLayers();
    updateLayerControls();
  };
};

const updateGallery = () => {
  console.log("Updating gallery...");
  gallery.innerHTML = "";
  const drawings = JSON.parse(localStorage.getItem("drawings") || "[]");
  drawings.forEach((drawing, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.src = drawing.layers[0];
    img.alt = drawing.name;
    img.addEventListener("click", () => {
      console.log("Loading image from gallery");
      loadDrawing(drawing);
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      console.log("Deleting drawing from gallery");
      drawings.splice(index, 1);
      localStorage.setItem("drawings", JSON.stringify(drawings));
      updateGallery();
    });
    item.addEventListener("mouseenter", () => item.appendChild(deleteButton));
    item.addEventListener("mouseleave", () => item.removeChild(deleteButton));
    item.style.position = "relative";
    const label = document.createElement("span");
    label.textContent = drawing.name;

    item.appendChild(img);
    item.appendChild(label);
    gallery.appendChild(item);
  });
};

saveButton.addEventListener("click", saveDrawing);

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTool(button.getAttribute("data-tool"));
  });
});

colorPicker.addEventListener("input", (e) => {
  console.log(`Color changed to: ${e.target.value}`);
  state.color = e.target.value;
});

sizeInput.addEventListener("input", (e) => {
  const value = parseInt(e.target.value);
  if (!isNaN(value) && value > 0) {
    state.size = value;
    sizeSelect.value = value;
  }
});

addLayerBtn.addEventListener("click", addLayer);
deleteLayerBtn.addEventListener("click", deleteLayer);

const toggleButton = document.querySelector(".toggle-tools");
const toolsElement = document.querySelector(".tools");
const toggleBottomButton = document.querySelector(".toggle-bottom-controls");
const bottomControlsElement = document.querySelector(".bottom-controls");

toggleButton.addEventListener("click", () => {
  toolsElement.classList.toggle("visible");
  toggleButton.innerHTML = toolsElement.classList.contains("visible")
    ? '<img src="assets/arrow_left.svg" alt="Close image tools tab" />'
    : '<img src="assets/arrow_right.svg" alt="Open image tools tab" />';
});

toggleBottomButton.addEventListener("click", () => {
  bottomControlsElement.classList.toggle("visible");
  toggleBottomButton.innerHTML = bottomControlsElement.classList.contains(
    "visible"
  )
    ? '<img src="assets/arrow_right.svg" alt="Close image save tab" />'
    : '<img src="assets/arrow_left.svg" alt="Open image save tab" />';
});

const toggleLayerSettingsButton = document.querySelector(
  ".toggle-layer-settings"
);
const layerSettingsElement = document.querySelector(".layer-settings");

toggleLayerSettingsButton.addEventListener("click", () => {
  layerSettingsElement.classList.toggle("visible");
  toggleLayerSettingsButton.innerHTML = layerSettingsElement.classList.contains(
    "visible"
  )
    ? '<img src="assets/arrow_right.svg" alt="Close layer settings tab" />'
    : '<img src="assets/arrow_left.svg" alt="Open layer settings tab" />';
});

const maxHistory = 5;

const updateColorHistory = (color) => {
  const historyColors = Array.from(colorHistory.children).map(
    (div) => div.style.backgroundColor
  );
  if (!historyColors.includes(color)) {
    if (historyColors.length >= maxHistory) {
      colorHistory.removeChild(colorHistory.lastChild);
    }
    const colorDiv = document.createElement("div");
    colorDiv.style.backgroundColor = color;
    colorDiv.addEventListener("click", () => {
      colorPicker.value = color;
      state.color = color;
    });
    colorHistory.insertBefore(colorDiv, colorHistory.firstChild);
  } else {
    const existingColorDiv = Array.from(colorHistory.children).find(
      (div) => div.style.backgroundColor === color
    );
    colorHistory.removeChild(existingColorDiv);
    colorHistory.insertBefore(existingColorDiv, colorHistory.firstChild);
  }
};

colorPicker.addEventListener("input", (e) => {
  const color = e.target.value;
  state.color = color;
  updateColorHistory(color);
});

// Add initial color to history
updateColorHistory(colorPicker.value);

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawLayers();
};

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

// Initial canvas size adjustment
resizeCanvas();

updateLayerControls();
updateGallery();
