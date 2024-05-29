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
    console.log("New incoming GAME connection from " + socket.id);

    /*
    socket.on("disconnect", (reason) => {
        gameData[socket.room] = null;
        webSockets.to(socket.room).emit("updateAllPlaceables", []);
        webSockets.to(socket.room).emit("changeLevel", null);
    });
    */

    socket.on("join", (room) => {
        socket.join(room);
        socket.emit("joinedroom", room);
        socket.room = room;

        let data = gameData[room];
        if (!data) {
            data = {
                level: null,
                placeables: [],
                clients: [],
                coinsPerClient: 50,
            };
            gameData[room] = data;
        }
    });

    socket.on("updatePlaceables", (placeables) => {
        // Add (or update) serialized placeables
        let ids = placeables.map(p => p.id);
        gameData[socket.room].placeables = gameData[socket.room].placeables.filter(e => !ids.includes(e.id));
        gameData[socket.room].placeables = gameData[socket.room].placeables.concat(placeables);
        // Forward to client
        webSockets.to(socket.room).emit("updatePlaceables", placeables);
    });

    socket.on("removePlaceables", (ids) => {
        // Remove placeables with the specified IDs
        gameData[socket.room].placeables = gameData[socket.room].placeables.filter(e => !ids.includes(e.id));
        // Forward to client
        webSockets.to(socket.room).emit("removePlaceables", ids);
    });

    socket.on("updateAllPlaceables", (placeables) => {
        // Overwrite our current placeables array
        gameData[socket.room].placeables = placeables;
        // Forward to client
        webSockets.to(socket.room).emit("updateAllPlaceables", placeables);
    });

    socket.on("changeLevel", (newLevelName) => {
        // Change our level
        gameData[socket.room].level = newLevelName;
        // Forward to client
        webSockets.to(socket.room).emit("changeLevel", newLevelName);
    });

    function setAllClientsCoins(coins) {
        for (let i = 0; i < gameData[socket.room].clients.length; i++) {
            gameData[socket.room].clients[i].coins = coins;
        }
    }

    socket.on("startGame", (newLevelName) => {
        gameData[socket.room].level = newLevelName;
        webSockets.to(socket.room).emit("changeLevel", newLevelName);

        gameData[socket.room].coinsPerClient = Math.min(50, 1000 / gameData[socket.room].clients.length);
        setAllClientsCoins(gameData[socket.room].coinsPerClient);
        webSockets.to(socket.room).emit("setCoins", gameData[socket.room].coinsPerClient);
    });

    socket.on("endGame", () => {
        gameData[socket.room].level = null;
        gameData[socket.room].coinsPerClient = 0;
        setAllClientsCoins(0);

        webSockets.to(socket.room).emit("endGame");
        webSockets.to(socket.room).emit("setCoins", 0);
    });

    socket.on("placeResult", (client, result) => {
        let ourClientIndex = gameData[socket.room].clients.findIndex(e => e.id == client);
        let ourClientData = gameData[socket.room].clients[ourClientIndex];
        if (result) {
            ourClientData.coins -= 10;
            ourClientData.socket.emit("setCoins", ourClientData.coins);
            gameData[socket.room].clients[ourClientIndex];
        }
        ourClientData.socket.emit("placeResult", result);
    })
});

webSockets.on("connection", (socket) => {
    console.log("New incoming CLIENT connection from " + socket.id);

    socket.on("join", (room) => {
        socket.join(room);
        socket.emit("joinedroom", room);
        socket.room = room;

        let data = gameData[room];
        if (!data) {
            data = {
                level: null,
                placeables: [],
                clients: [],
                coinsPerClient: 50,
            };
            gameData[room] = data;
        }

        socket.emit("changeLevel", gameData[room].level);
        socket.emit("updateAllPlaceables", gameData[room].placeables);

        let ourRoomData = data.clients.find(e => e.id == socket.id);
        if (!ourRoomData) {
            ourRoomData = {
                "id": socket.id,
                "socket": socket,
                "coins": data.coinsPerClient,
            };
            data.clients.push(ourRoomData);
        }

        socket.emit("setCoins", ourRoomData.coins)
    });

    socket.on("placeItem", (obj, posX, posY, rotation, flipX, flipY) => {

        let clientData = gameData[socket.room].clients.find(e => e.id == socket.id);
        if (clientData.coins < 10) {
            socket.emit("placeResult", false);
            return;
        }

        socketServer.to(socket.room).emit("placeItem", socket.id, obj, posX, posY, rotation, flipX, flipY);
    });
});


// Initialization
httpServer.listen(3000, handleListen);