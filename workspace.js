const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
let port = process.env.PORT || 8080;
let userCount = 0;
let users = [];

function removeUser(id) {
    users = users.filter(user => user.id !== id);
}

app.use(express.static(__dirname + "/public"));

io.on("connection", socket => {
    userCount++;
    socket.userName = `user${userCount}`;
    users.push(socket);

    socket.emit("online users", {
        id: socket.id,
        users: users.map(user => {
            return {
                userName: user.userName,
                id: user.id
            };
        })
    });

    socket.broadcast.emit("chat message", `${socket.userName} connected`);

    socket.on("connected", () => {
        socket.emit("connected", socket.userName);
    });

    socket.on("chat message", msg => {
        console.log(`message from ${msg.name}: ${msg.msg}`);
        socket.broadcast.emit("chat message", {
            msg: msg.msg,
            name: msg.name
        });
    });

    socket.on("user-typing", msg => {
        console.log(msg.msg);
        socket.userName = msg.userName;
        socket.broadcast.emit("user-typing", msg.msg);
    });

    socket.on("disconnect", () => {
        removeUser(socket.id);
        socket.broadcast.emit("online users", {
            users: users.map(user => {
                return {
                    userName: user.userName,
                    id: user.id
                };
            })
        });
        console.log("socket disconnected");
    });
});

http.listen(port, () => {
    console.log(`Listening on port ${port}`);
});