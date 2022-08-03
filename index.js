const fetch = require("node-fetch");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const chatServer = require("http").Server(app);

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	next();
});
app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST"],
	})
);
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	return res.send("<h1>The Social Book Chat Server</h1>");
});
//Proxy Server
app.post("/fetch", async (req, res) => {
	const { info } = req.body;
	console.log("Inside Proxy Server: ", info);
	try {
		// let url = "http://localhost:8000/api/v1/chats";
		let url = "https://the-social-book.herokuapp.com/api/v1/chats";
		let response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ info }),
		});
		let Data = await response.json();
		Data = Data.data.info;
		console.log("Proxy Fetch Call: ", Data);
		return res.status(200).json({ Data });
	} catch (err) {
		console.log(err);
		return res.json({
			error: err,
		});
	}
});

const chatSockets = (chatServer) => {
	const io = require("socket.io")(chatServer, {
		cors: { origin: "*", methods: ["GET", "POST"] },
	});
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
		socket.on("send_message", async function (Data) {
			let info = Data || {};
			let data = {};
			console.log("PRE - Data: ", info);
			try {
				let url = "https://tsbchatserver.herokuapp.com/fetch";
				let response = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ info }),
				});
				let data = await response.json();
				console.log("Fetch Call: ", data);
			} catch (err) {
				console.log("Error: ", err);
			}
			io.in(Data.chat_room).emit("receive_message", data);
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
