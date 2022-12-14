const fetch = require("node-fetch");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const env = require("./environment");
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
	return res.status(200).send("<h1>The Social Book Chat Server</h1>");
});
//Proxy Server
app.post("/fetch", async (req, res) => {
	const { info } = req.body;
	const information = info || {};
	try {
		let url = `${env.main_website}/api/v1/chats`;
		let response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ information }),
		});
		let Data = await response.json();
		Data = Data.data.info;
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
			try {
				let response = await fetch("/fetch", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ info }),
				});
				data = await response.json();
			} catch (err) {
				console.log("Error: ", err);
			}
			await io.in(Data.chat_room).emit("receive_message", data.Data);
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
