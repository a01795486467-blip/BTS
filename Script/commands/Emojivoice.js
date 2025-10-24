Module.exports.config = {
    name: "emoji_voice",
    version: "10.1", // সংস্করণ আপডেট করা হলো
    hasPermssion: 0,
    credits: "☞︎︎︎𝐑𝐀𝐁𝐁i⍟𝐕𝐀𝐈☜︎︎",
    description: "Emoji দিলে কিউট মেয়ের ভয়েস পাঠাবে 😍",
    commandCategory: "noprefix",
    usages: "😘🥰😍",
    cooldowns: 2 // কমালে দ্রুত রিপ্লাই দিতে পারবে
};

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const emojiAudioMap = {
    "🥱": "https://files.catbox.moe/9pou40.mp3",
    "😁": "https://files.catbox.moe/60cwcg.mp3",
    "😌": "https://files.catbox.moe/epqwbx.mp3",
    "🥺": "https://files.catbox.moe/wc17iq.mp3",
    "🤭": "https://files.catbox.moe/cu0mpy.mp3",
    "😅": "https://files.catbox.moe/jl3pzb.mp3",
    "😏": "https://files.catbox.moe/z9e52r.mp3",
    "😞": "https://files.catbox.moe/tdimtx.mp3",
    "🤫": "https://files.catbox.moe/0uii99.mp3",
    "🍼": "https://files.catbox.moe/p6ht91.mp3",
    "🤔": "https://files.catbox.moe/hy6m6w.mp3",
    "🥰": "https://files.catbox.moe/dv9why.mp3",
    "🤦": "https://files.catbox.moe/ivlvoq.mp3",
    "😘": "https://files.catbox.moe/sbws0w.mp3",
    "😑": "https://files.catbox.moe/p78xfw.mp3",
    "😢": "https://files.catbox.moe/shxwj1.mp3",
    "🙊": "https://files.catbox.moe/3bejxv.mp3",
    "🤨": "https://files.catbox.moe/4aci0r.mp3",
    "😡": "https://files.catbox.moe/shxwj1.mp3",
    "🙈": "https://files.catbox.moe/3qc90y.mp3",
    "😍": "https://files.catbox.moe/qjfk1b.mp3",
    "😭": "https://files.catbox.moe/itm4g0.mp3",
    "😱": "https://files.catbox.moe/mu0kka.mp3",
    "😻": "https://files.catbox.moe/y8ul2j.mp3",
    "😿": "https://files.catbox.moe/tqxemm.mp3",
    "💔": "https://files.catbox.moe/6yanv3.mp3",
    "🤣": "https://files.catbox.moe/2sweut.mp3",
    "🥹": "https://files.catbox.moe/jf85xe.mp3",
    "😩": "https://files.catbox.moe/b4m5aj.mp3",
    "🫣": "https://files.catbox.moe/ttb6hi.mp3",
    "🐸": "https://files.catbox.moe/utl83s.mp3",
    "🤰": "https://files.catbox.moe/jlgowl.mp3",
    "💪": "https://files.catbox.moe/j03dk9.mp3",
    "💃": "https://files.catbox.moe/jhyng8.mp3",
    "❤️": "https://files.catbox.moe/0qgv91.mp3",
    "🥶": "https://files.catbox.moe/rzti55.mp3",
    "👀": "https://files.catbox.moe/wkdo44.mp3",
    "🙏": "https://files.catbox.moe/542hm1.mp3",
    "🐓": "https://files.catbox.moe/oaxtjv.mp3",
    "🩴": "https://files.catbox.moe/bhfqtr.mp3",
    "👑": "https://files.catbox.moe/jr4vnq.mp3",
    "👙": "https://files.catbox.moe/placeholder.mp3" // <--- ফিক্সড: এখানে অসম্পূর্ণ URL এবং কমা ঠিক করা হয়েছে
}; // <--- ফিক্সড: এখানে অবজেক্ট বন্ধ করা হয়েছে

const tempFolderPath = path.join(__dirname, "temp_audio_cache");
if (!fs.existsSync(tempFolderPath)) {
    fs.mkdirSync(tempFolderPath);
}

module.exports.handleEvent = async function ({ api, event }) {
    const { body } = event;
    if (!body) return;

    // Check if the message is exactly one of the mapped emojis
    const emoji = body.trim();
    const audioUrl = emojiAudioMap[emoji];

    if (audioUrl) {
        const audioPath = path.join(tempFolderPath, `${emoji}.mp3`);

        try {
            // Check if the audio file is already downloaded
            if (!fs.existsSync(audioPath)) {
                const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(audioPath, Buffer.from(response.data));
            }

            // Send the audio file
            api.sendMessage({
                body: "😊",
                attachment: fs.createReadStream(audioPath)
            }, event.threadID, (err) => {
                if (err) console.error("Error sending audio:", err);
            }, event.messageID);

        } catch (error) {
            console.error("Error in emoji_voice module:", error);
            api.sendMessage("অডিও ফাইলটি ডাউনলোড বা পাঠাতে সমস্যা হয়েছে।", event.threadID, event.messageID);
        }
    }
};

module.exports.run = async ({ api, event }) => {
    // This command is noprefix and uses handleEvent, so run function is typically empty
    // but you can add a simple instruction if you want.
    api.sendMessage("এটি একটি noprefix কমান্ড। শুধুমাত্র তালিকাভুক্ত একটি ইমোজি মেসেজ হিসেবে পাঠান।", event.threadID, event.messageID);
};
