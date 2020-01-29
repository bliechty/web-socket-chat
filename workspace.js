const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
let port = process.env.PORT || 8080;
let clientCount = 0;
let users = [

];

app.use(express.static(__dirname + "/public"));

io.on("connection", socket => {
    clientCount++;
    socket.broadcast.emit("chat message", "User connected");

    socket.on("chat message", msg => {
        console.log(`message from ${msg.name}: ${msg.msg}`);
        socket.broadcast.emit("chat message", {
            msg: msg.msg,
            name: msg.name
        });
    });

    socket.on("user-typing", msg => {
        console.log(msg);
        socket.broadcast.emit("user-typing", msg);
    });

    socket.on("disconnect", () => {
        clientCount--;
        console.log("socket disconnected");
    });
});

http.listen(port, () => {
    console.log(`Listening on port ${port}`);
});