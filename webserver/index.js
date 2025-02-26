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
const gameClients = {};

const webSockets = socketServer.of("/web");

function hashCode(string) {
    var hash = 0;
    for (var i = 0; i < string.length; i++) {
        var code = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + code;
        hash = hash & hash;
    }
    return hash;
}
function generateAnonymousRoomCode(seed) {
    let hash = Math.abs(hashCode(seed)).toString(26);
    let result = ""
    for (let i = 0; i < hash.length; i++) {
        let x = hash.charCodeAt(i);
        if (x >= 48 && x <= 58) {
            result += String.fromCharCode(x + 17);
        } else {
            result += String.fromCharCode(x + 10);
        }
    }
    result = result.toUpperCase();
    while (result.length < 6) {
        result += 'Z';
    }
    return result.substring(0, 6);
}

socketServer.on("connection", (socket) => {

    socket.on("disconnect", (reason) => {
        gameData[socket.room] = null;
        webSockets.to(socket.room).emit("updateAllPlaceables", []);
        webSockets.to(socket.room).emit("changeLevel", null);
    });

    socket.on("join", (room) => {

        let addr = null;
        let forwarded = socket.handshake.headers['x-forwarded-for']
        if (forwarded) {
            addr = forwarded.split(":")[0];
        } else {
            addr = socket.handshake.address;
        }
        room = room.toUpperCase();
        room = generateAnonymousRoomCode(addr + room);

        console.log("New incoming GAME connection from " + socket.id + ", room " + room + " [" + addr + "]");

        socket.join(room);
        socket.emit("joinedroom", room);
        socket.room = room;

        let data = gameData[room];
        if (!data) {
            data = {
                level: null,
                placeables: [],
                prices: {},
                clients: [],
                coinSettings: {
                    minCoins: 100,
                    totalCoins: 1000,
                    minPrice: 25,
                    maxPrice: 100,
                    unlimitedCoins: false,
                },
                coinsPerClient: null,
            };
            gameData[room] = data;
        }

        webSockets.to(socket.room).emit("hostConnected");
    });

    socket.on("updatePlaceables", (placeables) => {
        // Add (or update) serialized placeables
        let ids = placeables.map(p => p.id);
        gameData[socket.room].placeables = gameData[socket.room].placeables.filter(e => !ids.includes(e.id));
        gameData[socket.room].placeables = gameData[socket.room].placeables.concat(placeables);
        // Forward to client
        // webSockets.to(socket.room).emit("updatePlaceables", placeables);
        webSockets.to(socket.room).emit("updateAllPlaceables", gameData[socket.room].placeables);
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
        if (gameClients[socket.room]) {
            for (let i = 0; i < gameClients[socket.room].length; i++) {
                gameClients[socket.room][i].coins = coins;
            }
        }
    }

    socket.on("startGame", (newLevelName) => {
        console.log("GAME STARTING " + socket.room);
        gameData[socket.room].level = newLevelName;
        webSockets.to(socket.room).emit("changeLevel", newLevelName);

        let coins = -1;
        if (!gameData[socket.room].unlimitedCoins) {
            if (!gameClients[socket.room] || gameClients[socket.room].length <= 0) {
                coins = gameData[socket.room].coinSettings.totalCoins;
            } else {
                coins = Math.ceil(Math.max(gameData[socket.room].coinSettings.minCoins, gameData[socket.room].coinSettings.totalCoins / gameClients[socket.room].length));
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
        let ourClientIndex = gameClients[socket.room].findIndex(e => e.ids.includes(client));
        let ourClientData = gameClients[socket.room][ourClientIndex];
        if (result) {
            if (gameData[socket.room].unlimitedCoins) {
                ourClientData.coins -= gameData[socket.room].prices[ourClientData.placing];
            }
            ourClientData.cooldown = new Date().getTime() + (cooldown * 1000);
            for (const clientSocket of ourClientData.sockets) {
                clientSocket.emit("setCoins", ourClientData.coins);
                clientSocket.emit("setCooldown", ourClientData.cooldown);
            }
            ourClientData.placing = null;
            gameClients[socket.room][ourClientIndex] = ourClientData;
        }
        for (const clientSocket of ourClientData.sockets) {
            clientSocket.emit("placeResult", result);
        }
    });

    socket.on("canPlaceItems", (canPlaceItems) => {
        gameData[socket.room].canPlaceItems = canPlaceItems;
        webSockets.to(socket.room).emit("canPlaceItems", canPlaceItems);
    });

    socket.on("setCoinSettings", (minCoins, totalCoins, minPrice, maxPrice, unlimitedCoins, coinsPerRound) => {
        gameData[socket.room].coinSettings.minCoins = minCoins;
        gameData[socket.room].coinSettings.totalCoins = totalCoins;
        gameData[socket.room].coinSettings.minPrice = minPrice;
        gameData[socket.room].coinSettings.maxPrice = maxPrice;
        gameData[socket.room].coinSettings.unlimitedCoins = unlimitedCoins;
        gameData[socket.room].coinSettings.coinsPerRound = coinsPerRound;

        let coins = -1;
        if (!gameData[socket.room].unlimitedCoins) {
            if (!gameClients[socket.room] || gameClients[socket.room].length <= 0) {
                coins = gameData[socket.room].coinSettings.totalCoins;
            } else {
                coins = Math.ceil(Math.max(gameData[socket.room].coinSettings.minCoins, gameData[socket.room].coinSettings.totalCoins / gameClients[socket.room].length));
            }
        }
        setAllClientsCoins(coins);
        webSockets.to(socket.room).emit("setCoins", coins);
    });

    socket.on("setPrices", (weights, minWeight, maxWeight) => {
        const minPrice = gameData[socket.room].coinSettings.minPrice;
        const rangePrice = gameData[socket.room].coinSettings.maxPrice - minPrice;

        const rangeWeight = maxWeight - minWeight;

        gameData[socket.room].prices = {};
        for (const weight of weights) {
            let price = ((1 - (weight.Weight - minWeight) / rangeWeight) * rangePrice) + minPrice;

            price = Math.round(price / 5) * 5; // Round (down) to the nearest 5.

            gameData[socket.room].prices[weight.Name] = price;
        }

        webSockets.to(socket.room).emit("setPrices", gameData[socket.room].prices);
    });

    socket.on("toEditMode", () => {
        // Grant additional coins...
        for (let i = 0; i < gameClients[socket.room].length; i++) {
            gameClients[socket.room][i].coins += gameData[socket.room].coinSettings.coinsPerRound;
            for (const clientSocket of gameClients[socket.room][i].sockets) {
                clientSocket.emit("setCoins", gameClients[socket.room][i].coins);
            }
        }
    });
});

webSockets.on("connection", (socket) => {
    let forwarded = socket.handshake.headers['x-forwarded-for']
    if (forwarded) {
        socket.ipaddress = forwarded.split(":")[0];
    } else {
        socket.ipaddress = socket.handshake.address;
    }
    console.log("New incoming CLIENT connection from " + socket.id + " IP " + socket.ipaddress);

    socket.on("join", (room) => {
        room = room.toUpperCase();
        socket.join(room);
        socket.emit("joinedroom", Boolean(gameData[room]));
        socket.room = room;

        if (!gameClients[room]) {
            gameClients[room] = [];
        }

        let ourRoomDataIndex = gameClients[room].findIndex(e => e.ip == socket.ipaddress);
        if (ourRoomDataIndex < 0) {
            ourRoomData = {
                "ip": socket.ipaddress,
                "ids": [socket.id],
                "sockets": [socket],
                "coins": 500,
                "cooldown": 0,
            };
            if (gameData[room] && gameData[room].coinsPerClient != null) {
                ourRoomData.coins = gameData[room].coinsPerClient;
            }
            ourRoomDataIndex = gameClients[room].length;
            gameClients[room].push(ourRoomData);
        } else {
            gameClients[room][ourRoomDataIndex].ids.push(socket.id);
            gameClients[room][ourRoomDataIndex].sockets.push(socket);
        }

        if (gameData[room]) {
            const roomData = gameData[room];
            socket.emit("changeLevel", roomData.level);
            socket.emit("updateAllPlaceables", roomData.placeables);
            socket.emit("canPlaceItems", roomData.canPlaceItems);
            socket.emit("setPrices", roomData.prices);
        }

        socket.emit("setCoins", gameClients[room][ourRoomDataIndex].coins)
        socket.emit("setCooldown", gameClients[room][ourRoomDataIndex].cooldown);
        webSockets.to(socket.room).emit("updateConnectedUsers", gameClients[socket.room].length);
    });

    socket.on("disconnect", () => {
        console.log("CLIENT disconnected " + socket.id + " IP " + socket.ipaddress + ", was in " + socket.room);
        if (gameData[socket.room]) {
            gameClients[socket.room] = gameClients[socket.room].filter(c => c.socket != socket);
            socketServer.to(socket.room).emit("updateConnectedUsers", gameClients[socket.room].length);
        }
    });

    socket.on("placeItem", (obj, posX, posY, rotation, flipX, flipY) => {
        let roomData = gameData[socket.room];
        let clientIndex = gameClients[socket.room].findIndex(e => e.ip == socket.ipaddress);
        let clientData = gameClients[socket.room][clientIndex];

        const price = roomData.prices[obj];

        if (!price || !roomData.canPlaceItems || clientData.coins < price || (clientData.cooldown && clientData.cooldown > new Date().getTime())) {
            socket.emit("placeResult", false);
            return;
        }

        socketServer.to(socket.room).emit("placeItem", socket.id, obj, posX, posY, rotation, flipX, flipY);
        gameClients[socket.room][clientIndex].placing = obj;
    });
});


// Initialization
let port = process.env.PORT || 3000;
httpServer.listen(port, handleListen);