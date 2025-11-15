🎨 Collaborative Real-Time Drawing App

A multi-user real-time drawing application built with Node.js, WebSockets (Socket.IO), HTML5 Canvas, and Vanilla JavaScript.
Multiple users can draw simultaneously on the same canvas with full real-time synchronization.

🚀 Features
✏️ Drawing Tools

Brush with customizable color

Adjustable stroke width

Smooth real-time drawing

High-frequency mouse event handling

Touch support for mobile devices

🔄 State Management

*Undo / Redo (synchronized for all users)
*Clear Canvas (shared across users)
*Each stroke is tracked, stored, committed, and replayed correctly
*Supports remote + local stroke rendering

🧑‍🤝‍🧑 Multi-User Features

*Join a room using a custom room ID
*Enter your name before joining
*Real-time detection of other users
*Live cursor tracking with user names
*Works across multiple browser windows

🌐 Real-Time Communication

*Built using Socket.IO over WebSockets
*Batched stroke streaming with low latency
*Event-driven architecture for streaming + commit updates
