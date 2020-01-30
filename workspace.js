const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
let port = process.env.PORT || 8080;
let userCount = 0;
let users = [];
let timeout;

function removeUser(id) {
    users = users.filter(user => user.id !== id);
}

function printOnlineUsers() {
    for (let user of users) {
        user.emit("online users", {
            id: user.id,
            users: users.map(user => {
                return {
                    userName: user.userName,
                    id: user.id
                };
            })
        });
    }
}

app.use(express.static(__dirname + "/public"));

io.on("connection", socket => {
    userCount++;
    socket.userName = `user${userCount}`;
    users.push(socket);

    printOnlineUsers();

    socket.broadcast.emit("chat message", `${socket.userName} connected`);

    socket.on("connected", () => {
        socket.emit("connected", socket.userName);
    });

    socket.on("change name", userName => {
        if (users.some(user => user.userName === userName)) {
            socket.emit("change name error", `You or someone else already has the name ${userName}`);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                socket.emit("change name error", "");
            }, 3000);
        } else {
            socket.userName = userName;
            printOnlineUsers();
        }
    });

    socket.on("chat message", msg => {
        console.log(`message from ${msg.name} to ${msg.toWho}: ${msg.msg}`);
        if (msg.toWho === "all") {
            socket.broadcast.emit("chat message", {
                msg: msg.msg,
                name: msg.name
            });
        } else {
            const user = users.filter(user => user.userName === msg.toWho)[0];
            user.emit("chat message", `*Whisper from ${socket.userName}: ${msg.msg}*`);
        }
    });

    socket.on("user-typing", msg => {
        if (msg.msg === "yes") {
            if (msg.toWho === "all") {
                socket.broadcast.emit("user-typing", `${socket.userName} is typing...`);
            } else {
                const user = users.filter(user => user.userName === msg.toWho)[0];
                user.emit("user-typing", `${socket.userName} is typing...`);
            }
        } else if (msg.msg === "no") {
            socket.broadcast.emit("user-typing", "");
        }
    });

    socket.on("disconnect", () => {
        removeUser(socket.id);
        printOnlineUsers();
        socket.broadcast.emit();
    });
});

http.listen(port, () => {
    console.log(`Listening on port ${port}`);
});