require('dotenv').config();
const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});

// Peer
const { ExpressPeerServer } = require("peer");
const { traceDeprecation } = require("process");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

//First command that redirects the user to the homepage
app.get("/", (req, rsp) => {
  rsp.render("index");
});

//Command that creates a room with a random room ID
app.get("/roomdef", (req, res)=>{
  res.redirect(`/${uuidv4()}`);
});

//Command that opens the chat room with a specific user entered room id
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

//when someone connects to the server
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, username) => {
    socket.join(roomId);//join the room
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, username);
    });
  });
});

server.listen(process.env.PORT || 3030);