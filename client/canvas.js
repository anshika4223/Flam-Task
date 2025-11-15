(function (window) {
    const exports = {};

    function makeCanvas(el) {
        const canvas = el;
        const ctx = canvas.getContext('2d');

        function resizeToFit() {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
            ctx.scale(dpr, dpr);
            redrawAll();
        }

        let strokes = [];               
        const strokeMap = new Map();    
        let inProgress = new Map();     

        exports.inProgress = inProgress;

        let current = {
            color: "#000",
            width: 4,
        };

      

        function drawStroke(s) {
            if (!s || !s.points || s.points.length === 0) return;

            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width;

            ctx.beginPath();
            ctx.moveTo(s.points[0].x, s.points[0].y);

            for (let i = 1; i < s.points.length; i++) {
                ctx.lineTo(s.points[i].x, s.points[i].y);
            }

            ctx.stroke();
        }

        function redrawAll() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const s of strokes) drawStroke(s);
            for (const [, s] of inProgress) drawStroke(s);
        }

    

        exports.setOptions = (opts) => (current = { ...current, ...opts });

        exports.beginLocalStroke = (id, pt) => {
            const s = {
                id,
                color: current.color,
                width: current.width,
                points: [pt],
            };
            inProgress.set(id, s);
            redrawAll();
        };

        exports.addLocalPoints = (id, pts) => {
            const s = inProgress.get(id);
            if (!s) return;
            s.points.push(...pts);
            redrawAll();
        };

        exports.commitLocalStroke = (id) => {
            const s = inProgress.get(id);
            if (!s) return;

            strokes.push(s);
            strokeMap.set(s.id, s);

            inProgress.delete(id);
            redrawAll();
        };

        
        exports.applyRemoteStream = (id, partial) => {
            let s = inProgress.get(id);

            if (!s) {
                s = {
                    id: partial.id,
                    color: partial.color,
                    width: partial.width,
                    points: [],
                };
                inProgress.set(id, s);
            }

            s.points.push(...partial.points);
            redrawAll();
        };

        exports.applyRemoteCommit = (stroke) => {
            strokes.push(stroke);
            strokeMap.set(stroke.id, stroke);
            inProgress.delete(stroke.id);
            redrawAll();
        };

        exports.applyUndo = (id) => {
            strokes = strokes.filter((s) => s.id !== id);
            strokeMap.delete(id);
            inProgress.delete(id);
            redrawAll();
        };

        exports.applyRedo = (stroke) => {
            strokes.push(stroke);
            strokeMap.set(stroke.id, stroke);
            redrawAll();
        };

        exports.clear = () => {
            strokes = [];
            strokeMap.clear();
            inProgress.clear();
            redrawAll();
        };

        exports.loadHistory = (history) => {
            strokes = history;
            inProgress.clear();
            strokeMap.clear();
            for (const s of strokes) strokeMap.set(s.id, s);
            redrawAll();
        };

        exports.el = canvas;
        exports.ctx = ctx;
        exports.resize = resizeToFit;

        window.addEventListener("resize", resizeToFit);
        setTimeout(resizeToFit, 50);
        resizeToFit();

        return exports;
    }

    window.CanvasModule = { makeCanvas };
})(window);
