const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const drawingState = require('./drawing-state');
const rooms = require('./rooms');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
cors: { origin: '*' }
});
const CLIENT_DIR = path.join(__dirname, '..', 'client');
app.use(express.static(CLIENT_DIR));
io.on('connection', (socket) => {
console.log('socket connected', socket.id);

socket.on('join', ({ roomId, userName }) => {
socket.join(roomId);
rooms.add(roomId, socket.id);
socket.data.roomId = roomId;
socket.data.userName = userName || 'Anon';

const history = drawingState.getHistory(roomId);
socket.emit('state:init', history);

socket.to(roomId).emit('user:join', { socketId: socket.id, name:
socket.data.userName });
});

socket.on('stroke:stream', (payload) => {
const { roomId } = payload;
socket.to(roomId).emit('stroke:stream', payload);
});

socket.on('stroke:commit', (payload) => {

const { roomId, stroke } = payload;

stroke.timestamp = Date.now();
drawingState.pushStroke(roomId, stroke);

socket.to(roomId).emit('stroke:commit', { stroke });
});
socket.on('undo', ({ roomId }) => {
const removed = drawingState.popStroke(roomId);
if (removed) {
io.to(roomId).emit('undo', { strokeId: removed.id });
}
});
socket.on('redo', ({ roomId }) => {
const strok = drawingState.redoStroke(roomId);
if (strok) {
io.to(roomId).emit('redo', { stroke: strok });
}
});
socket.on('clear', ({ roomId }) => {
drawingState.clear(roomId);
io.to(roomId).emit('clear');
});
socket.on('cursor', ({ roomId, cursor }) => {

socket.to(roomId).emit('cursor', { socketId: socket.id, cursor });
});
socket.on('disconnect', () => {
const roomId = socket.data.roomId;
if (roomId) {
rooms.remove(roomId, socket.id);
socket.to(roomId).emit('user:left', { socketId: socket.id });
}
});
});
const PORT = process.env.PORT || 3000;
console.log("Serving from:", CLIENT_DIR);

server.listen(PORT, () => console.log('Server listening on', PORT));