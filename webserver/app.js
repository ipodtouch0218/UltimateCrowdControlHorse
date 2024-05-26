const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// HTTP
const app = express();
app.set("view engine", "ejs");
app.set("views", __dirname + "\\views");
app.use(express.static("public"))
app.get("/", (req, res) => res.render("home"));
app.use("/:room", (req, res) => res.render("home", { room: req.params.room }));

const httpServer = http.createServer(app);
const handleListen = () => console.log("listening on localhost:3000");

// Sockets
const socketServer = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

const gameSockets = socketServer.of("/game");
const webSockets = socketServer.of("/web");

socketServer.on("connection", (socket) => {
    console.log("incoming GAME (no namespace) connection from " + socket.id);

    socket.on("updatePlaceables", (placeables) => {
        console.log("Placeable update! " + socket.room + ": " + placeables);
        gameSockets.broadcast.emit("updatePlaceables", placeables);
    })
})

gameSockets.on("connection", (socket) => {
    console.log("New incoming game connection from " + socket.id);

    socket.on("updatePlaceables", (placeables) => {
        console.log("Placeable update! " + socket.room + ": " + placeables);
    })
});

webSockets.on("connection", (socket) => {
    console.log("New incoming webclient connection from " + socket.id);

    socket.on("join", (room) => {
        console.log("Webclient " + socket.id + " joined room " + room)
        socket.join(room);
        socket.emit("joinedroom", room);
    })
});


// Initialization
httpServer.listen(3000, handleListen);