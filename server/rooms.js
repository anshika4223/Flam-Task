class Rooms {
constructor() {
this.rooms = new Map();
}
add(roomId, socketId) {
if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Set());
this.rooms.get(roomId).add(socketId);
}
remove(roomId, socketId) {
if (!this.rooms.has(roomId)) return;
this.rooms.get(roomId).delete(socketId);
if (this.rooms.get(roomId).size === 0) this.rooms.delete(roomId);
}
list(roomId) {
if (!this.rooms.has(roomId)) return [];
3
return Array.from(this.rooms.get(roomId));
}
}
module.exports = new Rooms();