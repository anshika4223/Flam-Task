(function () {
    const canvasEl = document.getElementById("board");
    const canvasApp = CanvasModule.makeCanvas(canvasEl);

    const colorInput = document.getElementById("color");
    const widthInput = document.getElementById("width");
    const undoBtn = document.getElementById("undo");
    const redoBtn = document.getElementById("redo");
    const clearBtn = document.getElementById("clear");
    const joinBtn = document.getElementById("join");
    const roomIdInput = document.getElementById("roomId");
    const nameInput = document.getElementById("name");

    let socket = null;
    let roomId = "default";
    let userName = "";

    
    // Brush Options
 
    colorInput.addEventListener("change", () =>
        canvasApp.setOptions({ color: colorInput.value })
    );

    widthInput.addEventListener("input", () =>
        canvasApp.setOptions({ width: Number(widthInput.value) })
    );

   
    // Drawing State
   
    let drawing = false;
    let currentStrokeId = null;
    let pointBuffer = [];
    const BUFFER_MAX = 25;
    let lastEmit = 0;

    function genId() {
        return "s_" + Math.random().toString(36).slice(2, 9);
    }

    function getCanvasPos(e) {
        const rect = canvasEl.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    
    // START DRAW

    function startDraw(e) {
        if (!socket) return;

        drawing = true;
        currentStrokeId = genId();

        const pt = getCanvasPos(e);
        canvasApp.beginLocalStroke(currentStrokeId, pt);
        pointBuffer = [pt];

        socket.emit("stroke:stream", {
            roomId,
            strokeId: currentStrokeId,
            stroke: {
                id: currentStrokeId,
                userId: socket.id,
                color: colorInput.value,
                width: Number(widthInput.value),
                points: [pt],
            },
        });
    }


    // CONTINUE DRAW
    
    function continueDraw(e) {
        if (!drawing) return;

        const pt = getCanvasPos(e);
        pointBuffer.push(pt);
        canvasApp.addLocalPoints(currentStrokeId, [pt]);

        const now = Date.now();
        if (pointBuffer.length >= BUFFER_MAX || now - lastEmit > 40) {
            socket.emit("stroke:stream", {
                roomId,
                strokeId: currentStrokeId,
                stroke: {
                    id: currentStrokeId,
                    userId: socket.id,
                    color: colorInput.value,
                    width: Number(widthInput.value),
                    points: pointBuffer.slice(),
                },
            });

            pointBuffer = [];
            lastEmit = now;
        }

        socket.emit("cursor", {
            roomId,
            cursor: { x: pt.x, y: pt.y, name: userName },
        });
    }

   
    // END DRAW

    function endDraw() {
        if (!drawing) return;
        drawing = false;

        if (pointBuffer.length > 0) {
            socket.emit("stroke:stream", {
                roomId,
                strokeId: currentStrokeId,
                stroke: {
                    id: currentStrokeId,
                    userId: socket.id,
                    color: colorInput.value,
                    width: Number(widthInput.value),
                    points: pointBuffer.slice(),
                },
            });
        }

        const s = canvasApp.inProgress.get(currentStrokeId);
        const finalPoints = s ? s.points : pointBuffer.slice();

     
        socket.emit("stroke:commit", {
            roomId,
            stroke: {
                id: currentStrokeId,
                userId: socket.id,
                color: colorInput.value,
                width: Number(widthInput.value),
                points: finalPoints,
            },
        });

      
        canvasApp.commitLocalStroke(currentStrokeId);

        pointBuffer = [];
        currentStrokeId = null;
    }

    // Mouse Event
  
    canvasEl.addEventListener("mousedown", startDraw);
    window.addEventListener("mousemove", continueDraw);
    window.addEventListener("mouseup", endDraw);

    // Touch Event
    canvasEl.addEventListener("touchstart", (e) => {
        e.preventDefault();
        startDraw(e.touches[0]);
    });

    canvasEl.addEventListener("touchmove", (e) => {
        e.preventDefault();
        continueDraw(e.touches[0]);
    });

    canvasEl.addEventListener("touchend", (e) => {
        e.preventDefault();
        endDraw(e.changedTouches[0]);
    });

   
    // JOIN ROOM
 
    joinBtn.addEventListener("click", () => {
        roomId = roomIdInput.value.trim() || "default";
        userName = nameInput.value.trim() || "Anon";

        socket = WS.connect();

        socket.on("connect", () => {
            socket.emit("join", { roomId, userName });
        });

        socket.on("state:init", (history) => {
            canvasApp.loadHistory(history);
        });

        socket.on("stroke:stream", ({ strokeId, stroke }) => {
            canvasApp.applyRemoteStream(strokeId, stroke);
        });

        socket.on("stroke:commit", ({ stroke }) => {
            canvasApp.applyRemoteCommit(stroke);
        });

        socket.on("undo", ({ strokeId }) => canvasApp.applyUndo(strokeId));
        socket.on("redo", ({ stroke }) => canvasApp.applyRedo(stroke));
        socket.on("clear", () => canvasApp.clear());

        // Cursors
        const cursorsContainer = document.getElementById("cursors");
        const cursors = new Map();

        socket.on("cursor", ({ socketId, cursor }) => {
            let el = cursors.get(socketId);

            if (!el) {
                el = document.createElement("div");
                el.className = "cursor";
                cursorsContainer.appendChild(el);
                cursors.set(socketId, el);
            }

            el.style.left = cursor.x + "px";
            el.style.top = cursor.y + "px";
            el.textContent = cursor.name || "User";
        });

        socket.on("user:left", ({ socketId }) => {
            const el = cursors.get(socketId);
            if (el) el.remove();
            cursors.delete(socketId);
        });

        undoBtn.onclick = () => socket.emit("undo", { roomId });
        redoBtn.onclick = () => socket.emit("redo", { roomId });
        clearBtn.onclick = () => socket.emit("clear", { roomId });
    });
})();
