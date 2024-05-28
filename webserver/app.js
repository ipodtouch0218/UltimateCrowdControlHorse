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

const gameData = {};

const gameSockets = socketServer.of("/game");
const webSockets = socketServer.of("/web");

socketServer.on("connection", (socket) => {
    console.log("New incoming game connection from " + socket.id);

    socket.on("join", (room) => {
        socket.join(room);
        socket.emit("joinedroom", room);
        socket.room = room;
        gameData[room] = {
            "host": socket,
            "placeables": [],
            "level": null,
        };
    })

    socket.on("updatePlaceables", (placeables) => {
        webSockets.to(socket.room).emit("updatePlaceables", placeables);
        gameData[socket.room].placeables = placeables;
    })

    socket.on("changeLevel", (newLevelName) => {
        webSockets.to(socket.room).emit("changeLevel", newLevelName);
        socket.level = newLevelName;
        gameData[socket.room].level = newLevelName;
    })
});

webSockets.on("connection", (socket) => {
    console.log("New incoming webclient connection from " + socket.id);

    socket.on("join", (room) => {
        socket.join(room);
        socket.emit("joinedroom", room);
        socket.room = room;

        if (gameData[room] != undefined) {
            socket.emit("changeLevel", gameData[room].level);
            socket.emit("updatePlaceables", gameData[room].placeables);
        }
    })
});


// Initialization
httpServer.listen(3000, handleListen);