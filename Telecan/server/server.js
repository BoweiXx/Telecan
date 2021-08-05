const fs = require("fs");
const express = require("express");
const app = express();
app.use(express.static("../client"));
app.get("*", (res, req) => {
    req.sendFile(__dirname + "../client/index.html");
});
const http = require("http");
const { json } = require("express");
const { time, dir } = require("console");

const httpServer = http.createServer(app);
httpServer.listen(8080 || process.env.PORT, () => {
    console.log(`Listening to PORT ${process.env.PORT || 8080}`)
});
let currentUsers = [];
let gameData = [];
let sessionTime = 0;
let sessionNum;
let tempGameData;
// let topicRandomArray = [];
// let socketArray = [];
// let timeOfCallbacks = 0;
const io = require("socket.io")(httpServer);
io.sockets.on("connection", (socket) => {
    console.log(`We have a new client: ${socket.id}`);
    socket.on("disconnect", () => {
        console.log(`${socket.id} has disconnected`);
        if (currentUsers && gameData) {
            for (let i = 0; i < currentUsers.length; i++) {
                if (socket.id == currentUsers[i].userID) {
                    currentUsers.splice(i, 1);
                }
            }
        }
        io.emit("updateUserList", currentUsers);
    });
    //communication through socket
    socket.on("sendUsername", data => {
        // console.log(data);
        currentUsers.push(data);
        io.emit("updateUserList", currentUsers);
        // console.log(currentUsers);
    });
    socket.on("startGame", () => {
        let playerNum = currentUsers.length;
        const totalTime = 480000; //8min total
        sessionNum = playerNum * 2;
        let timer = Math.floor(totalTime / (sessionNum * 2));
        let sessionInfo = {
            sessionNum: sessionNum,
            timer: timer
        }
        io.emit("getGameData", sessionInfo);
    });
    //prep
    socket.on("session", data => {
        gameData.push(data);
        // console.log(gameData);
        if (gameData.length == currentUsers.length) {
            io.emit("ready", true);
            tempGameData = [...gameData];
        }
    });
    socket.on("askForMore", (data) => {
        sessionTime++;
        // let tempSocket = socket.id;
        if (sessionTime == sessionNum * 2) {
            io.emit("endGameSession", gameData);
        }
        switch (data.type) {
            case "text":
                let tempTextData = [...gameData];
                for (let i = 0; i < tempTextData.length; i++) {
                    if (socket.id = gameData[i].userID) {
                        // console.log(`sending text to ${socket.id}`);
                        let randomTextSelector = Math.floor(Math.random() * gameData.length);
                        let dataTosend = searchKeyObject("description", gameData[randomTextSelector]);
                        // console.log(dataTosend);
                        socket.emit("getDescription", dataTosend);
                        gameData[i][`description${sessionTime}`] = data.description;
                    }
                }
                // console.log("get request for text");
                break;
            case "draw":
                let tempImageData = [...gameData];
                for (let i = 0; i < gameData.length; i++) {
                    // console.log(i);
                    let thisFrameName = `frame${sessionTime}`
                    // if (JSON.stringify(socket.id)= JSON.stringify(gameData[i].userID)) {
                    gameData[i][thisFrameName] = data.image;
                    // console.log(gameData);
                    // }
                    io.to(socket.id).emit("getImageData", data.image);
                }
                console.log("get request for image");
                break;
            case "topic":
                for (let i = 0; i <tempGameData.length; i++) {
                    if (searchKeyObject("topic", tempGameData[i]) && socket.id != tempGameData[i].userID) {
                        console.log("get request for topic")
                        let randomSelector = Math.floor(Math.random() * (tempGameData.length));
                        io.to(socket.id).emit("getTopic", tempGameData[randomSelector].topic);
                        tempGameData.splice(randomSelector, 1);
                        console.log(tempGameData);
                    }else if(searchKeyObject("topic", tempGameData[i]) && socket.id == tempGameData[i].userID) {
                        io.to(socket.id).emit("getTopic", false);
                    }
                }
                break;
            default:
                break;
        }
    });
})
/*
TODO:
1. After each client connect to the server and register, send their socket id and usernames
2. On server side, save as array of objects
3. create a factory function, when the game start, create an object for each client, includes:
    3.1. Username
    3.2. topic
    3.3. descriptions
    3.4. Imagedata
    3.5. description2..
    3.6. Imagedata2..
4. When one turn finished, send the object back to server, and the server redistribute the objects
5. When the session finished, send object to the server, store in a server
6. Create a factory function, package all the information as one object, send to all clients (this step is not clear yet)
7. When all people are disconnected, clear garbage
*/

function searchKeyObject(nameKey, obj) {
    nameKey = nameKey.toLowerCase();
    const keys = Object.keys(obj);
    const wantedKey = keys.find(key => key.toLowerCase().includes(nameKey));
    return wantedKey ? obj[wantedKey] : false;
}