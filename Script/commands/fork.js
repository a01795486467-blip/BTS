module.exports.config = {
name: "fork",
version: "1.0.0",
hasPermssion: 0,
credits: "rabbi vai",
description: "Send GitHub repo link",
commandCategory: "other",
usages: "fork",
cooldowns: 3,
};

module.exports.run = async function({ api, event }) {
return api.sendMessage(
"🔗 GitHub Repo https://github.com/RABBI-VAI-git/RABBI-VAI-37.git",
event.threadID,
event.messageID
);
};

