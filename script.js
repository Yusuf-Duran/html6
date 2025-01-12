/**
 * Class representing a drawing board.
 */
class DrawingBoard {
  /**
   * Create a drawing board.
   * @param {string} canvasId - The ID of the canvas element.
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext("2d");
    this.layers = [];
    this.currentLayer = 0;
    this.previousDrawing = null;
    this.state = {
      tool: "pencil",
      color: document.getElementById("color").value,
      size: parseInt(document.getElementById("size-input").value),
      drawing: false,
      startX: 0,
      startY: 0,
    };
    this.tools = new Tools(this.ctx, this.canvas, this.state);
    this.init();
  }

  /**
   * Initialize the drawing board.
   */
  init() {
    this.addLayer();
    this.attachEventListeners();
    this.updateLayerControls();
    this.updateGallery();
    this.resizeCanvas();
    this.updateColorHistory(this.state.color);
  }

  /**
   * Add a new layer to the drawing board.
   */
  addLayer() {
    const newLayer = document.createElement("canvas");
    newLayer.width = this.canvas.width;
    newLayer.height = this.canvas.height;
    newLayer.classList.add("layer");
    this.layers.push(newLayer);
    this.currentLayer = this.layers.length - 1;
    this.ctx = this.layers[this.currentLayer].getContext("2d");
    this.tools.ctx = this.ctx;
    this.drawLayers();
    this.updateLayerControls();
  }

  /**
   * Delete the current layer from the drawing board.
   */
  deleteLayer() {
    if (this.layers.length > 1) {
      this.layers.splice(this.currentLayer, 1);
      this.currentLayer = Math.max(this.currentLayer - 1, 0);
      this.ctx = this.layers[this.currentLayer].getContext("2d");
      this.tools.ctx = this.ctx;
      this.drawLayers();
      this.updateLayerControls();
    } else {
      this.showNotification("Cannot delete the last layer");
    }
  }

  /**
   * Draw all layers on the main canvas.
   */
  drawLayers() {
    const mainCtx = this.canvas.getContext("2d");
    mainCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.layers.forEach((layer) => {
      mainCtx.drawImage(layer, 0, 0);
    });
  }

  /**
   * Update the layer controls UI.
   */
  updateLayerControls() {
    const layerGrid = document.getElementById("layer-grid");
    layerGrid.innerHTML = "";
    this.layers.forEach((layer, index) => {
      const layerCanvas = document.createElement("canvas");
      layerCanvas.width = 100;
      layerCanvas.height = 100;
      layerCanvas.getContext("2d").drawImage(layer, 0, 0, 100, 100);
      layerCanvas.classList.add("layer-preview");
      if (index === this.currentLayer) {
        layerCanvas.classList.add("active");
      }
      layerCanvas.addEventListener("click", () => {
        this.currentLayer = index;
        this.ctx = this.layers[this.currentLayer].getContext("2d");
        this.tools.ctx = this.ctx;
        this.drawLayers();
        this.updateLayerControls();
      });
      layerGrid.appendChild(layerCanvas);
    });
    document.getElementById("delete-layer").disabled = this.layers.length <= 1;
  }

  /**
   * Show a notification message.
   * @param {string} message - The message to display.
   */
  showNotification(message) {
    const notifications = document.getElementById("notifications");
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
  }

  /**
   * Attach event listeners to the canvas and other UI elements.
   */
  attachEventListeners() {
    const canvas = this.canvas;
    canvas.addEventListener("mousedown", (e) => this.startDrawing(e));
    canvas.addEventListener("mousemove", (e) => this.draw(e));
    canvas.addEventListener("mouseup", (e) => this.stopDrawing(e));
    canvas.addEventListener("mouseleave", (e) => this.stopDrawing(e));
    canvas.addEventListener("touchstart", (e) => this.startDrawing(e));
    canvas.addEventListener("touchmove", (e) => this.draw(e));
    canvas.addEventListener("touchend", (e) => this.stopDrawing(e));
    canvas.addEventListener("dragover", (e) => this.handleDragOver(e));
    canvas.addEventListener("dragleave", () => this.handleDragLeave());
    canvas.addEventListener("drop", (e) => this.handleDrop(e));

    document
      .getElementById("clear")
      .addEventListener("click", () => this.clearCanvas());
    document
      .getElementById("save")
      .addEventListener("click", () => this.saveDrawing());
    document
      .getElementById("add-layer")
      .addEventListener("click", () => this.addLayer());
    document
      .getElementById("delete-layer")
      .addEventListener("click", () => this.deleteLayer());
    document
      .getElementById("color")
      .addEventListener("input", (e) => this.changeColor(e));
    document
      .getElementById("size-input")
      .addEventListener("input", (e) => this.changeSize(e));
    window.addEventListener("resize", () => this.resizeCanvas());
    window.addEventListener("orientationchange", () => this.resizeCanvas());

    const toolButtons = document.querySelectorAll(".draw-modes button");
    toolButtons.forEach((button) => {
      button.addEventListener("click", () =>
        this.setTool(button.getAttribute("data-tool"))
      );
    });

    const toggleButton = document.querySelector(".toggle-tools");
    const toolsElement = document.querySelector(".tools");
    toggleButton.addEventListener("click", () => {
      toolsElement.classList.toggle("visible");
      toggleButton.innerHTML = toolsElement.classList.contains("visible")
        ? '<img src="assets/arrow_left.svg" alt="Close image tools tab" />'
        : '<img src="assets/arrow_right.svg" alt="Open image tools tab" />';
    });

    const toggleBottomButton = document.querySelector(
      ".toggle-bottom-controls"
    );
    const bottomControlsElement = document.querySelector(".bottom-controls");
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
      toggleLayerSettingsButton.innerHTML =
        layerSettingsElement.classList.contains("visible")
          ? '<img src="assets/arrow_right.svg" alt="Close layer settings tab" />'
          : '<img src="assets/arrow_left.svg" alt="Open layer settings tab" />';
    });
  }

  /**
   * Start drawing on the canvas.
   * @param {Event} e - The event object.
   */
  startDrawing(e) {
    this.state.drawing = true;
    this.tools[this.state.tool].start(e);
  }

  /**
   * Draw on the canvas.
   * @param {Event} e - The event object.
   */
  draw(e) {
    if (this.state.drawing) {
      this.tools[this.state.tool].move(e);
      this.drawLayers();
      this.updateLayerControls();
    }
  }

  /**
   * Stop drawing on the canvas.
   * @param {Event} e - The event object.
   */
  stopDrawing(e) {
    if (!this.state.drawing) return;
    this.tools[this.state.tool].end(e);
    this.state.drawing = false;
    this.drawLayers();
    this.updateLayerControls();
  }

  /**
   * Clear the canvas.
   */
  clearCanvas() {
    this.layers.forEach((layer) => {
      layer
        .getContext("2d")
        .clearRect(0, 0, this.canvas.width, this.canvas.height);
    });
    this.drawLayers();
  }

  /**
   * Save the current drawing.
   */
  saveDrawing() {
    const name = document.getElementById("save-name").value.trim();
    if (!name) {
      this.showNotification("Please enter a name for your drawing!");
      return;
    }

    const layersData = this.layers.map((layer) => layer.toDataURL());
    const drawings = JSON.parse(localStorage.getItem("drawings") || "[]");
    drawings.push({ name, layers: layersData });
    localStorage.setItem("drawings", JSON.stringify(drawings));
    this.updateGallery();
    this.showNotification("Drawing saved!");
  }

  /**
   * Load a saved drawing.
   * @param {Object} drawing - The drawing object to load.
   */
  loadDrawing(drawing) {
    const imgToLoad = new Image();
    imgToLoad.src = drawing.layers[0];
    imgToLoad.onload = () => {
      this.layers = drawing.layers.map((layerData) => {
        const layer = document.createElement("canvas");
        layer.width = this.canvas.width;
        layer.height = this.canvas.height;
        const layerCtx = layer.getContext("2d");
        const img = new Image();
        img.src = layerData;
        img.onload = () => {
          layerCtx.drawImage(img, 0, 0);
          this.drawLayers();
          this.updateLayerControls();
        };
        return layer;
      });
      this.currentLayer = 0;
      this.ctx = this.layers[this.currentLayer].getContext("2d");
      this.tools.ctx = this.ctx;
      this.drawLayers();
      this.updateLayerControls();
    };
  }

  /**
   * Update the gallery with saved drawings.
   */
  updateGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";
    const drawings = JSON.parse(localStorage.getItem("drawings") || "[]");
    drawings.forEach((drawing, index) => {
      const item = document.createElement("div");
      item.className = "gallery-item";

      const img = document.createElement("img");
      img.src = drawing.layers[0];
      img.alt = drawing.name;
      img.addEventListener("click", () => this.loadDrawing(drawing));

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        drawings.splice(index, 1);
        localStorage.setItem("drawings", JSON.stringify(drawings));
        this.updateGallery();
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
  }

  /**
   * Change the drawing color.
   * @param {Event} e - The event object.
   */
  changeColor(e) {
    this.state.color = e.target.value;
    this.updateColorHistory(e.target.value);
  }

  /**
   * Change the drawing size.
   * @param {Event} e - The event object.
   */
  changeSize(e) {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      this.state.size = value;
    }
  }

  /**
   * Resize the canvas to fit the window.
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.drawLayers();
  }

  /**
   * Handle drag over event on the canvas.
   * @param {Event} e - The event object.
   */
  handleDragOver(e) {
    e.preventDefault();
    this.canvas.classList.add("dragover");
  }

  /**
   * Handle drag leave event on the canvas.
   */
  handleDragLeave() {
    this.canvas.classList.remove("dragover");
  }

  /**
   * Handle drop event on the canvas.
   * @param {Event} e - The event object.
   */
  handleDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.handleFiles(files);
    }
  }

  /**
   * Handle file input for the canvas.
   * @param {FileList} files - The files to handle.
   */
  handleFiles(files) {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        this.drawLayers();
      };
    };
    reader.readAsDataURL(file);
  }

  /**
   * Update the color history UI.
   * @param {string} color - The color to add to the history.
   */
  updateColorHistory(color) {
    const colorHistory = document.getElementById("color-history");
    const historyColors = Array.from(colorHistory.children).map(
      (div) => div.style.backgroundColor
    );
    if (!historyColors.includes(color)) {
      if (historyColors.length >= 5) {
        colorHistory.removeChild(colorHistory.lastChild);
      }
      const colorDiv = document.createElement("div");
      colorDiv.style.backgroundColor = color;
      colorDiv.addEventListener("click", () => {
        document.getElementById("color").value = color;
        this.state.color = color;
      });
      colorHistory.insertBefore(colorDiv, colorHistory.firstChild);
    } else {
      const existingColorDiv = Array.from(colorHistory.children).find(
        (div) => div.style.backgroundColor === color
      );
      colorHistory.removeChild(existingColorDiv);
      colorHistory.insertBefore(existingColorDiv, colorHistory.firstChild);
    }
  }

  /**
   * Set the current drawing tool.
   * @param {string} tool - The tool to set.
   */
  setTool(tool) {
    this.state.tool = tool;
    const toolButtons = document.querySelectorAll(".draw-modes button");
    toolButtons.forEach((button) => button.classList.remove("active"));
    document
      .querySelector(`button[data-tool="${tool}"]`)
      .classList.add("active");
  }

  /**
   * Draw a star on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} x - The x-coordinate of the center of the star.
   * @param {number} y - The y-coordinate of the center of the star.
   * @param {number} points - The number of points on the star.
   * @param {number} outerRadius - The outer radius of the star.
   * @param {number} innerRadius - The inner radius of the star.
   */
  drawStar(ctx, x, y, points, outerRadius, innerRadius) {
    ctx.lineWidth = this.state.size;
    ctx.strokeStyle = this.state.color;
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
  }
}

/**
 * Class representing drawing tools.
 */
class Tools {
  /**
   * Create drawing tools.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   * @param {Object} state - The state object.
   */
  constructor(ctx, canvas, state) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.state = state;
    this.previousDrawing = null;
  }

  /**
   * Get the position of the event relative to the canvas.
   * @param {Event} e - The event object.
   * @returns {Object} The x and y coordinates.
   */
  #getPosition(e) {
    if (!this.canvas) {
      console.error("Canvas is undefined");
      return { x: 0, y: 0 };
    }
    const rect = this.canvas.getBoundingClientRect();
    let x, y;

    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else if (e.clientX && e.clientY) {
      x = e.clientX;
      y = e.clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      x = e.changedTouches[0].clientX;
      y = e.changedTouches[0].clientY;
    } else {
      return { x: 0, y: 0 };
    }

    return { x: x - rect.left, y: y - rect.top };
  }

  /**
   * Draw a star on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} x - The x-coordinate of the center of the star.
   * @param {number} y - The y-coordinate of the center of the star.
   * @param {number} points - The number of points on the star.
   * @param {number} outerRadius - The outer radius of the star.
   * @param {number} innerRadius - The inner radius of the star.
   */
  #drawStar(ctx, x, y, points, outerRadius, innerRadius) {
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
  }

  pencil = {
    start: () => {
      this.ctx.beginPath();
    },
    move: (e) => {
      if (!this.state.drawing) return;
      const { x, y } = this.#getPosition(e);
      this.ctx.lineWidth = this.state.size;
      this.ctx.strokeStyle = this.state.color;
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    },
    end: () => {
      this.ctx.beginPath();
    },
  };

  rectangle = {
    start: (e) => {
      const { x, y } = this.#getPosition(e);
      this.state.startX = x;
      this.state.startY = y;
      this.previousDrawing = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    },
    move: (e) => {
      if (this.previousDrawing) {
        this.ctx.putImageData(this.previousDrawing, 0, 0);
      }
      const { x, y } = this.#getPosition(e);
      const width = x - this.state.startX;
      const height = y - this.state.startY;
      this.ctx.lineWidth = this.state.size;
      this.ctx.strokeStyle = this.state.color;
      this.ctx.strokeRect(this.state.startX, this.state.startY, width, height);
    },
    end: (e) => {
      if (this.previousDrawing) {
        this.ctx.putImageData(this.previousDrawing, 0, 0);
      }
      this.previousDrawing = null;
      const { x, y } = this.#getPosition(e);
      const width = x - this.state.startX;
      const height = y - this.state.startY;
      this.ctx.lineWidth = this.state.size;
      this.ctx.strokeStyle = this.state.color;
      this.ctx.strokeRect(this.state.startX, this.state.startY, width, height);
    },
  };

  circle = {
    start: (e) => {
      const { x, y } = this.#getPosition(e);
      this.state.startX = x;
      this.state.startY = y;
      this.previousDrawing = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    },
    move: (e) => {
      if (this.previousDrawing) {
        this.ctx.putImageData(this.previousDrawing, 0, 0);
      }
      const { x, y } = this.#getPosition(e);
      const radius = Math.sqrt(
        Math.pow(x - this.state.startX, 2) + Math.pow(y - this.state.startY, 2)
      );
      this.ctx.lineWidth = this.state.size;
      this.ctx.strokeStyle = this.state.color;
      this.ctx.beginPath();
      this.ctx.arc(
        this.state.startX,
        this.state.startY,
        radius,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
    },
    end: (e) => {
      if (this.previousDrawing) {
        this.ctx.putImageData(this.previousDrawing, 0, 0);
      }
      this.previousDrawing = null;
      const { x, y } = this.#getPosition(e);
      const radius = Math.sqrt(
        Math.pow(x - this.state.startX, 2) + Math.pow(y - this.state.startY, 2)
      );
      this.ctx.lineWidth = this.state.size;
      this.ctx.strokeStyle = this.state.color;
      this.ctx.beginPath();
      this.ctx.arc(
        this.state.startX,
        this.state.startY,
        radius,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
    },
  };

  eraser = {
    start: () => {
      this.ctx.beginPath();
    },
    move: (e) => {
      if (!this.state.drawing) return;
      const { x, y } = this.#getPosition(e);
      this.ctx.lineWidth = this.state.size;
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    },
    end: () => {
      this.ctx.beginPath();
    },
  };

  line = {
    start: (e) => {
      const { x, y } = this.#getPosition(e);
      this.state.startX = x;
      this.state.startY = y;
      this.previousDrawing = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    },
    move: (e) => {
      if (this.previousDrawing) {
        this.ctx.putImageData(this.previousDrawing, 0, 0);
      }
      const { x, y } = this.#getPosition(e);
      this.ctx.lineWidth = this.state.size;
      this.ctx.strokeStyle = this.state.color;
      this.ctx.beginPath();
      this.ctx.moveTo(this.state.startX, this.state.startY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    },
    end: (e) => {
      if (this.previousDrawing) {
        this.ctx.putImageData(this.previousDrawing, 0, 0);
      }
      this.previousDrawing = null;
      const { x, y } = this.#getPosition(e);
      this.ctx.lineWidth = this.state.size;
      this.ctx.strokeStyle = this.state.color;
      this.ctx.beginPath();
      this.ctx.moveTo(this.state.startX, this.state.startY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    },
  };

  triangle = {
    start: (e) => {
      const { x, y } = this.#getPosition(e);
      this.state.startX = x;
      this.state.startY = y;
      this.previousDrawing = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    },
    move: (e) => {
      if (this.previousDrawing) {
        this.ctx.putImageData(this.previousDrawing, 0, 0);
      }
      const { x, y } = this.#getPosition(e);
      const width = x - this.state.startX;
      const height = y - this.state.startY;
      this.ctx.lineWidth = this.state.size;
      this.ctx.strokeStyle = this.state.color;
      this.ctx.beginPath();
      this.ctx.moveTo(this.state.startX, this.state.startY);
      this.ctx.lineTo(
        this.state.startX + width / 2,
        this.state.startY + height
      );
      this.ctx.lineTo(
        this.state.startX - width / 2,
        this.state.startY + height
      );
      this.ctx.closePath();
      this.ctx.stroke();
    },
    end: (e) => {
      if (this.previousDrawing) {
        this.ctx.putImageData(this.previousDrawing, 0, 0);
      }
      this.previousDrawing = null;
      const { x, y } = this.#getPosition(e);
      const width = x - this.state.startX;
      const height = y - this.state.startY;
      this.ctx.lineWidth = this.state.size;
      this.ctx.strokeStyle = this.state.color;
      this.ctx.beginPath();
      this.ctx.moveTo(this.state.startX, this.state.startY);
      this.ctx.lineTo(
        this.state.startX + width / 2,
        this.state.startY + height
      );
      this.ctx.lineTo(
        this.state.startX - width / 2,
        this.state.startY + height
      );
      this.ctx.closePath();
      this.ctx.stroke();
    },
  };

  star = {
    start: (e) => {
      const { x, y } = this.#getPosition(e);
      this.state.startX = x;
      this.state.startY = y;
      this.previousDrawing = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    },
    move: (e) => {
      if (this.previousDrawing) {
        this.ctx.putImageData(this.previousDrawing, 0, 0);
      }
      const { x, y } = this.#getPosition(e);
      const radius = Math.sqrt(
        Math.pow(x - this.state.startX, 2) + Math.pow(y - this.state.startY, 2)
      );
      this.#drawStar(
        this.ctx,
        this.state.startX,
        this.state.startY,
        5,
        radius,
        radius / 2
      );
    },
    end: (e) => {
      if (this.previousDrawing) {
        this.ctx.putImageData(this.previousDrawing, 0, 0);
      }
      this.previousDrawing = null;
      const { x, y } = this.#getPosition(e);
      const radius = Math.sqrt(
        Math.pow(x - this.state.startX, 2) + Math.pow(y - this.state.startY, 2)
      );
      this.#drawStar(
        this.ctx,
        this.state.startX,
        this.state.startY,
        5,
        radius,
        radius / 2
      );
    },
  };
}

new DrawingBoard("drawing-board");
