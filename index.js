const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const chatServer = require("http").Server(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// async function chat(data) {
// 	try {
// 		let info = {};
// 		let { friend_email, chat_room, timestamp, message, user_email } = data;
// 		let alignment = "";

// 		const user = await User.findOne({ email: user_email }).populate();
// 		const friend = await User.findOne({ email: friend_email }).populate();

// 		let chat = await Chat.create({
// 			content: message,
// 			sender: user._id,
// 			receiver: friend._id,
// 			time: timestamp,
// 			room: chat_room,
// 		});

// 		let room = await Room.findOne({
// 			sender: user._id,
// 			receiver: friend._id,
// 		});

// 		if (!room) {
// 			room = await Room.findOne({
// 				sender: friend._id,
// 				receiver: user._id,
// 			});
// 		}

// 		chat.save();
// 		room.chats.push(chat);
// 		room.save();
// 		user.chats.push(chat);
// 		friend.chats.push(chat);
// 		user.save();
// 		friend.save();

// 		let sender = await User.findById(chat.sender).populate();
// 		sender = sender.email;
// 		info = {
// 			message: message,
// 			user_name: user.name,
// 			user_email: user.email,
// 			friend_name: friend.name,
// 			friend_email: friend.email,
// 			alignment: alignment,
// 			sender: sender,
// 			timestamp: timestamp,
// 			chat_room: chat_room,
// 		};
// 		return info;
// 	} catch (err) {
// 		console.log("Error: ", err);
// 	}
// }

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
			const info = await chat(data);
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
