const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const chatServer = require("http").Server(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function fetchData(info) {
	try {
		let url = "https://the-social-book.herokuapp.com/messages/chatting";
		let response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(info),
		});
		let data = await response.json();
		return data.data.info;
	} catch (err) {
		console.log("Error: ", err);
	}
}

const chatSockets = (chatServer) => {
	const io = require("socket.io")(chatServer, { cors: { origin: "*" } });
	let users = {};
	console.log("New Socket Connection");

	io.sockets.on("connection", function (socket) {
		console.log("New User Connected using Sockets: ", socket.id);
		socket.on("online_status", function (data) {
			users[socket.id] = data.user_email;
			io.emit("user_online", users);
		});
		socket.on("disconnect", function () {
			delete users[socket.id];
			io.emit("user_offline", users);
		});
		socket.on("join_room", function (data) {
			socket.join(data.chat_room);
			io.in(data.chat_room).emit("user_joined", data);
		});
		socket.on("leave_room", function (data) {
			socket.leave(data.chat_room);
			io.in(data.chat_room).emit("user_left", data);
		});
		socket.on("send_message", async function (data) {
			try {
				const info = await fetchData(data);
			} catch (err) {
				console.log("Error: ", err);
			}
			io.in(data.chat_room).emit("receive_message", info);
		});
		socket.on("new_message", function (data) {
			socket.broadcast.emit("new_message_notify", data);
		});
	});
};

chatSockets(chatServer);
chatServer.listen(port, () => {
	console.log("Chat Server is Running Successfully on Port: " + port);
});
