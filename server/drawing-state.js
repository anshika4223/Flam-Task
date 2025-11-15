class DrawingState {
constructor() {

this.rooms = new Map();
}
ensureRoom(roomId) {
if (!this.rooms.has(roomId)) {
this.rooms.set(roomId, { history: [], redo: [] });
}
return this.rooms.get(roomId);
}
pushStroke(roomId, stroke) {
const room = this.ensureRoom(roomId);
room.history.push(stroke);

room.redo = [];
}
popStroke(roomId) {
const room = this.ensureRoom(roomId);
const stroke = room.history.pop();
if (stroke) {
room.redo.push(stroke);
}
return stroke;
}
redoStroke(roomId) {
const room = this.ensureRoom(roomId);
const stroke = room.redo.pop();
2
if (stroke) {
room.history.push(stroke);
}
return stroke;
}
getHistory(roomId) {
const room = this.ensureRoom(roomId);
return room.history.slice(); 
}
clear(roomId) {
const room = this.ensureRoom(roomId);
room.history = [];
room.redo = [];
}
}
module.exports = new DrawingState();