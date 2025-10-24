Module.exports.config = {
    name: "emoji_voice",
    version: "10.2", // সংস্করণ আপডেট করা হলো
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
    "👙": "https://files.catbox.moe/placeholder.mp3"
};

// --- ফিক্সড লজিক শুরু ---

// একটি রেগুলার এক্সপ্রেশন যা শুধুমাত্র ইমোজি ক্যারেক্টার এবং স্পেস ছাড়া আর কিছু আছে কিনা তা পরীক্ষা করে।
// এটি জটিল হতে পারে, তাই আমরা সহজ পদ্ধতি ব্যবহার করব:

const tempFolderPath = path.join(__dirname, "temp_audio_cache");
if (!fs.existsSync(tempFolderPath)) {
    fs.mkdirSync(tempFolderPath);
}

module.exports.handleEvent = async function ({ api, event }) {
    const { body } = event;
    if (!body) return;

    // 1. মেসেজের শুরুতে এবং শেষে থাকা সমস্ত সাদা স্থান (spaces, tabs, newlines) মুছে ফেলা।
    const trimmedBody = body.trim();
    
    // 2. ম্যাপে শুধুমাত্র সেই ইমোজিগুলো আছে কিনা তা নিশ্চিত করা। 
    // যদি মেসেজে একাধিক ইমোজি বা অন্য কোনো টেক্সট থাকে, তবে এটি কাজ করবে না।
    const emoji = trimmedBody; // যেহেতু আমরা noprefix ব্যবহার করছি, পুরো মেসেজ বডিটাই emoji হিসেবে ধরি।
    const audioUrl = emojiAudioMap[emoji];

    // Check if the message is a single emoji that is in our map
    if (audioUrl) {
        // অতিরিক্ত চেক: মেসেজটি যেন শুধুমাত্র একটি ইমোজি-ই হয়, কোনো অতিরিক্ত টেক্সট বা স্পেস যেন না থাকে।
        // যদিও trim() করা হয়েছে, একাধিক ইমোজি থাকলেও এটি ট্রিগার করবে না কারণ emojiAudioMap-এ শুধুমাত্র single emoji key আছে।

        const audioPath = path.join(tempFolderPath, `${emoji.replace(/[\uD800-\uDBFF\uDC00-\uDFFF]/g, '')}.mp3`); // ফাইলপাথে ইমোজি এনকোডিং সমস্যা এড়াতে পরিষ্কার করা হলো
        
        try {
            // Check if the audio file is already downloaded
            if (!fs.existsSync(audioPath)) {
                // অডিও ফাইলটি ডাউনলোড করা
                const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(audioPath, Buffer.from(response.data));
            }

            // Send the audio file
            api.sendMessage({
                // ভয়েস পাঠানোর সময় এটি "audio" হিসেবেই যাবে।
                // আপনি চাইলে একটি ক্যাপশন যোগ করতে পারেন: body: "আপনার কিউট ভয়েস! 😊",
                attachment: fs.createReadStream(audioPath)
            }, event.threadID, (err) => {
                // ডাউনলোড করা ফাইলটি পাঠানো নিশ্চিত করার জন্য কোনো ত্রুটি থাকলে তা দেখানো
                if (err) console.error("Error sending audio:", err);
            }, event.messageID);

        } catch (error) {
            console.error("Error in emoji_voice module:", error);
            // যদি অডিও ডাউনলোড করতে সমস্যা হয় (যেমন URL কাজ না করলে)
            api.sendMessage("অডিও ফাইলটি ডাউনলোড বা পাঠাতে সমস্যা হয়েছে। URL টি হয়তো মেয়াদ উত্তীর্ণ।", event.threadID, event.messageID);
        }
    }
};

module.exports.run = async ({ api, event }) => {
    // This command is noprefix and uses handleEvent, so run function is typically empty
    // but you can add a simple instruction if you want.
    api.sendMessage("এটি একটি noprefix কমান্ড। শুধুমাত্র তালিকাভুক্ত একটি ইমোজি মেসেজ হিসেবে পাঠান। যেমন: 🥰", event.threadID, event.messageID);
};
