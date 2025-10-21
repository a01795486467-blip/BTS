const axios = require("axios");
const fs = require('fs');
const path = require('path'); // Path পরিচালনার জন্য যোগ করা হয়েছে

// --- Helper Functions ---

/**
 * GitHub থেকে বেস API URL ফেচ করে।
 * ফেইল হলে একটি ফলব্যাক URL রিটার্ন করে।
 * @returns {Promise<string>} বেস API URL.
 */
const baseApiUrl = async () => {
    // ফলব্যাক URL - যদি GitHub থেকে ফেচ করা ব্যর্থ হয়
    const FALLBACK_API_URL = "https://your-fallback-api-url.com"; // <--- আপনার পছন্দের API URL দিন!

    try {
        const base = await axios.get(
            `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`,
            { timeout: 5000 } // ৫ সেকেন্ডের টাইমআউট যোগ করা হয়েছে
        );
        
        // Response ঠিক আছে কিনা তা নিশ্চিত করা
        if (base.data && base.data.api) {
            console.log("✅ API URL fetched successfully from GitHub.");
            return base.data.api;
        } else {
            console.warn("⚠️ GitHub response was invalid. Falling back to default URL.");
            return FALLBACK_API_URL;
        }
    } catch (error) {
        // যদি Fetch করতে এরর হয় (যেমন: নেটওয়ার্ক বা DNS সমস্যা)
        console.error("❌ Error fetching API URL from GitHub. Falling back:", error.message);
        // যদি কোনো কারণে ফেইল হয়, তাহলে ফলব্যাক URL ব্যবহার করবে
        return FALLBACK_API_URL; 
    }
};

/**
 * একটি URL থেকে ফাইল ডাউনলোড করে, লোকাল পাথে সেভ করে, এবং একটি রিডেবল স্ট্রিম রিটার্ন করে।
 * ... (বাকি ফাংশনটি অপরিবর্তিত) ...
 */
async function dipto(url, fileName) {
  const filePath = path.join(__dirname, fileName);
  try {
    // 1. ArrayBuffer হিসাবে ডাউনলোড
    const response = await axios.get(url, {
      responseType: "arraybuffer"
    });

    // 2. লোকাল ফাইলে সেভ
    fs.writeFileSync(filePath, Buffer.from(response.data));
    
    // 3. ReadStream রিটার্ন
    return fs.createReadStream(filePath);
  } catch (err) {
    // ডাউনলোড বা ফাইল সেভিং এরর হলে
    console.error("Error in dipto (file download):", err.message);
    // এরর থ্রো করার আগে নিশ্চিত করুন যে লোকাল ফাইলটি মুছা হয়েছে (যদি আংশিক ডাউনলোড হয়ে থাকে)
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); 
    }
    throw err;
  }
}

/**
 * একটি URL থেকে স্ট্রিম হিসাবে ফাইল ডাউনলোড করে এবং এর path প্রপার্টি সেট করে।
 * ... (বাকি ফাংশনটি অপরিবর্তিত) ...
 */
async function diptoSt(url, fileName) {
  try {
    const response = await axios.get(url, {
      responseType: "stream"
    });
    // বট ফ্রেমওয়ার্ক ব্যবহারের জন্য 'path' প্রপার্টি সেট করা
    response.data.path = fileName; 
    return response.data;
  } catch (err) {
    console.error("Error in diptoSt (stream download):", err.message);
    throw err;
  }
}

// --- Module Configuration ---

module.exports.config = {
  name: "song",
  version: "2.1.3", // ভার্সন আপডেট করা হয়েছে
  aliases: ["music", "play"],
  credits: "RAHAT (Fixed by Gemini)",
  countDown: 5,
  hasPermssion: 0,
  description: "Download audio from YouTube",
  category: "media",
  commandCategory: "media",
  usePrefix: true,
  prefix: true,
  usages: "{pn} [<song name>|<song link>]:" + "\n   Example:" + "\n{pn} chipi chipi chapa chapa"
};

// --- Run Function (Main Command Logic) ---

module.exports.run = async ({
  api,
  args,
  event,
  commandName,
  message
}) => {
  // YouTube URL রেজেক্স (regex)
  const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  const filePath = path.join(__dirname, 'audio.mp3'); // লোকাল ফাইল পাথ

  // নিশ্চিতকরণের জন্য লোকাল ফাইল ক্লিনআপ ফাংশন
  const cleanup = () => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Failed to delete local file:", e.message);
      }
    }
  };

  try {
    const urlYtb = checkurl.test(args[0]);

    // যদি সরাসরি YouTube URL হয়
    if (urlYtb) {
      const match = args[0].match(checkurl);
      const videoID = match ? match[1] : null;

      if (!videoID) {
        return api.sendMessage("❌ প্রদত্ত লিঙ্ক থেকে ভিডিও ID বের করা যায়নি।", event.threadID, event.messageID);
      }
      
      const baseUrl = await baseApiUrl();
      
      // API থেকে ডাউনলোড লিঙ্ক এবং তথ্য ফেচ
      const response = await axios.get(
        `${baseUrl}/ytDl3?link=${videoID}&format=mp3`
      );
      
      const { title, downloadLink, quality } = response.data;

      // ডাউনলোডিং মেসেজ
      await api.sendMessage({
        body: `✅ ডাউনলোড হচ্ছে: ${title}\n• Quality: ${quality}`,
      }, event.threadID, event.messageID);
      
      // dipto ফাংশন ব্যবহার করে ডাউনলোড এবং স্ট্রিম তৈরি
      const audioStream = await dipto(downloadLink, 'audio.mp3'); 

      // অডিও ফাইল সেন্ড এবং ক্লিনআপ
      return api.sendMessage({
        body: title,
        attachment: audioStream
      }, event.threadID, () => {
        cleanup(); // মেসেজ সেন্ড হওয়ার পর ক্লিনআপ
      }, event.messageID);
    }

    // যদি কিওয়ার্ড দিয়ে সার্চ করা হয়
    let keyWord = args.join(" ");
    if (!keyWord) {
      return api.sendMessage(`অনুগ্রহ করে গান বা YouTube লিঙ্ক দিন।\nব্যবহার: ${this.config.usages.replace(/{pn}/g, commandName)}`, event.threadID, event.messageID);
    }

    keyWord = keyWord.includes("?feature=share") ? keyWord.replace("?feature=share", "") : keyWord;
    const maxResults = 6;
    const baseUrl = await baseApiUrl();
    
    // গান সার্চ করা
    const searchResponse = (await axios.get(`${baseUrl}/ytFullSearch?songName=${encodeURIComponent(keyWord)}`)).data;
    const result = searchResponse.slice(0, maxResults);

    if (result.length === 0)
      return api.sendMessage(`⭕ "${keyWord}" কিওয়ার্ডের সাথে কোনো ফলাফল মেলেনি।`, event.threadID, event.messageID);
    
    // সার্চ রেজাল্ট ফরম্যাট এবং থাম্বনেইল স্ট্রিম ডাউনলোড
    let msg = "🔎 **অনুসন্ধানের ফলাফল:**\n\n";
    let i = 1;
    const thumbnails = [];
    for (const info of result) {
      // diptoSt ব্যবহার করে স্ট্রিম অ্যাটাচমেন্ট তৈরি
      thumbnails.push(diptoSt(info.thumbnail, `photo_${i}.jpg`)); 
      msg += `${i++}. **${info.title}**\nসময়: ${info.time}\nচ্যানেল: ${info.channel.name}\n\n`;
    }

    // অপশনগুলো থাম্বনেইল সহ সেন্ড করা
    api.sendMessage({
      body: msg + "গানটি শোনার জন্য এই মেসেজে রিপ্লাই দিয়ে একটি সংখ্যা (1-6) লিখুন।",
      attachment: await Promise.all(thumbnails)
    }, event.threadID, (err, info) => {
      if (err) return console.error("Error sending search results:", err);
      // রিপ্লাই হ্যান্ডলারের তথ্য সেভ করা
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        result
      });
      
    }, event.messageID);

  } catch (err) {
    console.error("Error in 'song' run function:", err);
    // API রেসপন্স এরর হলে
    if (err.response && err.response.status === 404) {
         return api.sendMessage("❌ API বা সার্ভার থেকে কোনো ডেটা পাওয়া যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।", event.threadID, event.messageID);
    }
    // ফলব্যাক URL ব্যবহারের পরেও যদি কোনো এরর হয়
    return api.sendMessage("❌ কমান্ড কার্যকরে একটি সাধারণ ত্রুটি হয়েছে। সমস্যাটি নেটওয়ার্ক বা API এর হতে পারে।", event.threadID, event.messageID);
  } 
};

// --- Reply Handler ---

module.exports.handleReply = async ({
  event,
  api,
  handleReply
}) => {
  const filePath = path.join(__dirname, 'audio.mp3');
  
  // নিশ্চিতকরণের জন্য লোকাল ফাইল ক্লিনআপ ফাংশন
  const cleanup = () => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Failed to delete local file:", e.message);
      }
    }
  };

  // কেবল মূল ব্যবহারকারীর রিপ্লাই প্রক্রিয়া করবে
  if (event.senderID !== handleReply.author) return; 

  try {
    const {
      result
    } = handleReply;
    const choice = parseInt(event.body.trim()); // রিপ্লাইয়ের সংখ্যা

    if (!isNaN(choice) && choice <= result.length && choice > 0) {
      const infoChoice = result[choice - 1];
      const idvideo = infoChoice.id;

      await api.unsendMessage(handleReply.messageID); // সিলেকশন মেসেজ আনসেন্ড করা
      await api.sendMessage(`🎶 **${infoChoice.title}** ডাউনলোড করার প্রস্তুতি চলছে...`, event.threadID, event.messageID);
      
      const baseUrl = await baseApiUrl();
      const response = await axios.get(`${baseUrl}/ytDl3?link=${idvideo}&format=mp3`);
      
      const { title, downloadLink, quality } = response.data;

      // নির্বাচিত অডিও ডাউনলোড
      const audioStream = await dipto(downloadLink, 'audio.mp3'); 

      // ডাউনলোড করা অডিও সেন্ড
      await api.sendMessage({
        body: `✅ **গান চলছে:**\n• Title: **${title}**\n• Quality: ${quality}`,
        attachment: audioStream
      }, event.threadID,
      () => {
        cleanup(); // মেসেজ সেন্ড হওয়ার পর ক্লিনআপ
      }, event.messageID);
      
    } else {
      // ভুল সিলেকশন
      api.sendMessage("❌ ভুল সিলেকশন। অনুগ্রহ করে 1 থেকে 6 এর মধ্যে একটি সংখ্যা লিখুন।", event.threadID, (err, info) => {
        // রিপ্লাই হ্যান্ডলার সচল রাখা
        global.client.handleReply.push({
          name: handleReply.name,
          messageID: info.messageID,
          author: event.senderID,
          result
        });
      }, event.messageID);
    }
  } catch (error) {
    // এরর হ্যান্ডলিং
    cleanup(); // এরর হলেও ফাইল মুছা

    if (error.message && error.message.includes('code 413')) { 
      // 413 Payload Too Large এরর (সম্ভবত ফাইল সাইজ খুব বড়)
      api.sendMessage("❌ দুঃখিত, নির্বাচিত অডিওটি অনেক বড় (সম্ভবত 26MB এর বেশি) হওয়ায় পাঠানো যাচ্ছে না।", event.threadID, event.messageID);
    } else {
      console.error("Error in 'song' handleReply:", error);
      api.sendMessage("⭕ দুঃখিত, আপনার অনুরোধ প্রক্রিয়া করার সময় একটি ত্রুটি হয়েছে।", event.threadID, event.messageID);
    }
  }
};
