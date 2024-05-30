var path = require('path');
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// HTTP
const app = express();
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname, 'public')));
app.get("/", (req, res) => res.render("home"));
app.use("/:room", (req, res) => res.render("home", { room: req.params.room }));

const httpServer = http.createServer(app);
const handleListen = () => console.log("Started; listening on :" + port);

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

    socket.on("disconnect", (reason) => {
        gameData[socket.room] = null;
        webSockets.to(socket.room).emit("updateAllPlaceables", []);
        webSockets.to(socket.room).emit("changeLevel", null);
    });

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
                coinSettings: {
                    minCoins: 100,
                    totalCoins: 1000,
                    minPrice: 25,
                    maxPrice: 100,
                    unlimitedCoins: false,
                },
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

        let coins = -1;
        if (!gameData[socket.room].unlimitedCoins) {
            if (gameData[socket.room].clients.length <= 0) {
                coins = gameData[socket.room].coinSettings.totalCoins;
            } else {
                coins = Math.ceil(Math.max(gameData[socket.room].coinSettings.minCoins, gameData[socket.room].coinSettings.totalCoins / gameData[socket.room].clients.length));
            }
        }
        setAllClientsCoins(coins);
        webSockets.to(socket.room).emit("setCoins", coins);
        gameData[socket.room].coinsPerClient = coins;
    });

    socket.on("endGame", () => {
        gameData[socket.room].level = null;
        gameData[socket.room].coinsPerClient = 0;
        setAllClientsCoins(0);

        webSockets.to(socket.room).emit("endGame");
        webSockets.to(socket.room).emit("setCoins", 0);
        webSockets.to(socket.room).emit("setCooldown", 0);
    });

    socket.on("placeResult", (client, result, cooldown) => {
        let ourClientIndex = gameData[socket.room].clients.findIndex(e => e.ids.includes(client));
        let ourClientData = gameData[socket.room].clients[ourClientIndex];
        if (result) {
            ourClientData.coins -= 10;
            ourClientData.cooldown = new Date().getTime() + (cooldown * 1000);
            for (const clientSocket of ourClientData.sockets) {
                clientSocket.emit("setCoins", ourClientData.coins);
                clientSocket.emit("setCooldown", ourClientData.cooldown);
            }
            gameData[socket.room].clients[ourClientIndex] = ourClientData;
        }
        for (const clientSocket of ourClientData.sockets) {
            clientSocket.emit("placeResult", result);
        }
    });

    socket.on("canPlaceItems", (canPlaceItems) => {
        gameData[socket.room].canPlaceItems = canPlaceItems;
        webSockets.to(socket.room).emit("canPlaceItems", canPlaceItems);
    })

    socket.on("setCoinSettings", (minCoins, totalCoins, minPrice, maxPrice, unlimitedCoins) => {
        gameData[socket.room].coinSettings.minCoins = minCoins;
        gameData[socket.room].coinSettings.totalCoins = totalCoins;
        gameData[socket.room].coinSettings.minPrice = minPrice;
        gameData[socket.room].coinSettings.maxPrice = maxPrice;
        gameData[socket.room].coinSettings.unlimitedCoins = unlimitedCoins;
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
                coinSettings: {
                    minCoins: 100,
                    totalCoins:  1000,
                    minPrice: 25,
                    maxPrice: 100,
                    unlimitedCoins: false,
                },
                coinsPerClient: 50,
            };
            gameData[room] = data;
        }

        socket.emit("changeLevel", gameData[room].level);
        socket.emit("updateAllPlaceables", gameData[room].placeables);
        socket.emit("canPlaceItems", gameData[socket.room].canPlaceItems);

        let ourRoomDataIndex = data.clients.findIndex(e => e.ip == socket.ip);
        if (ourRoomDataIndex < 0) {
            ourRoomData = {
                "ip": socket.handshake.ip,
                "ids": [socket.id],
                "sockets": [socket],
                "coins": data.coinsPerClient,
            };
            gameData[room].clients.push(ourRoomData);
        } else {
            gameData[room].clients[ourRoomDataIndex].ids.push(socket.id);
            gameData[room].clients[ourRoomDataIndex].sockets.push(socket);
        }

        socket.emit("setCoins", ourRoomData.coins)
        socket.emit("setCooldown", ourRoomData.cooldown);
    });

    socket.on("disconnect", () => {
        if (gameData[socket.room]) {
            gameData[socket.room].clients = gameData[socket.room].clients.filter(c => c.socket != socket);
        }
    });

    socket.on("placeItem", (obj, posX, posY, rotation, flipX, flipY) => {

        let roomData = gameData[socket.room];
        let clientData = roomData.clients.find(e => e.ip == socket.ip);
        if (!roomData.canPlaceItems || clientData.coins < 10 || (clientData.cooldown && clientData.cooldown > new Date().getTime())) {
            socket.emit("placeResult", false);
            return;
        }

        socketServer.to(socket.room).emit("placeItem", socket.id, obj, posX, posY, rotation, flipX, flipY);
    });
});


// Initialization
let port = process.env.PORT || 3000;
httpServer.listen(port, handleListen);