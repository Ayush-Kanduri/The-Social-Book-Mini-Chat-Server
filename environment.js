const dotenv = require("dotenv").config();

const development = {
	name: "development",
	main_website: process.env.DEVELOPMENT_MAIN_WEBSITE,
	chat_server: process.env.DEVELOPMENT_CHAT_SERVER,
};

const production = {
	name: "production",
	main_website: process.env.MAIN_WEBSITE,
	chat_server: process.env.CHAT_SERVER,
};

module.exports = production;
