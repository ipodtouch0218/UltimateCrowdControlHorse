const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// HTTP
const app = express();
app.set("view engine", "ejs");
app.set("views", __dirname + "\\views");
app.use(express.static("public"))
app.get("/", (req, res) => res.render("home", { title: 'Title!!!', message: 'Hello World!' }));

const httpServer = http.createServer(app);
const handleListen = () => console.log("listening on localhost:3000");

// Sockets
const socketServer = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

let test = 1;

socketServer.on("connection", (socket) => {
    socket.emit("setlevel", "waterfall");

    socket.on("test", () => {
        // On "test" received...
        socket.emit("setlevel", "waterfall");
        socket.broadcast.emit("setlevel", "waterfall");
    });
});

// Initialization
httpServer.listen(3000, handleListen);