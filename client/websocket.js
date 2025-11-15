(function(window){
let socket = null;
function connect(opts = {}) {
socket = io();
socket.on('connect', () => {
console.log('connected', socket.id);
});
return socket;
}
window.WS = { connect };
})(window);
