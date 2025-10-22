const fs = require("fs");
const dataFile = __dirname + "/cache/banwordData.json";

if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));

const loadData = () => JSON.parse(fs.readFileSync(dataFile));
const saveData = (data) => fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

module.exports.config = {
  name: "banword",
  version: "4.0",
  hasPermssion: 0,
  credits: "Md saim",
  description: "Animated stylish banword system for Mirai bot",
  commandCategory: "group",
  usages: "[on/off/add/remove/list]",
  cooldowns: 2,
};

const warn = {};
const emojis = ["⚡", "🔥", "💣", "🚫", "😈", "💀", "🤐", "🧨", "⚔️", "👿"];
const funnyLines = [
  "ভাই একটু ভদ্র হন 😅",
  "এমন কথা বলে মেয়েরা ভয় পায় 😳",
  "ভাই! ভাষা একটু clean রাখেন 🤭",
  "নিষিদ্ধ শব্দ alert চলছে 🚫",
  "তুমি কি FBI-এর নজরে পড়তে চাও? 😏",
  "এই শব্দটা আমাদের সিস্টেম পছন্দ করেনি 🤖",
  "চুপিচুপি এমন কথা বলা ঠিক না 😐",
  "ভালো ব্যবহার করো, সবাই তোমাকে ভালোবাসবে 😇",
  "Warning warning! শব্দ বোমা শনাক্ত 💣",
  "ভাই এমন কথা শুনে আমার RAM hang হয়ে গেল 🤯",
];

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body } = event;
  if (!body) return;

  const data = loadData();
  if (!data[threadID] || !data[threadID].enabled) return;

  const words = data[threadID].words || [];
  const text = body.toLowerCase();

  for (const word of words) {
    if (text.includes(word)) {
      try {
        await api.unsendMessage(messageID);
      } catch {}

      if (!warn[threadID]) warn[threadID] = {};
      if (!warn[threadID][senderID]) warn[threadID][senderID] = 0;
      warn[threadID][senderID]++;

      const count = warn[threadID][senderID];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const line = funnyLines[Math.floor(Math.random() * funnyLines.length)];

      if (count < 3) {
        return api.sendMessage(
          `${emoji}━━━[ ⚠️ সতর্কতা ${count}/3 ]━━━${emoji}\n` +
            `🚫 নিষিদ্ধ শব্দ শনাক্ত!\n💬 Word: "${word}"\n\n💡 ${line}\n\n👑 Credit: Md saim`,
          threadID
        );
      } else {
        warn[threadID][senderID] = 0;
        try {
          await api.removeUserFromGroup(senderID, threadID);
          return api.sendMessage(
            `💥━━━[ BAN ALERT ]━━━💥\n👤 ${senderID} কে ৩ বার নিষিদ্ধ শব্দ ব্যবহারের জন্য গ্রুপ থেকে বাদ দেওয়া হয়েছে!\n\n👑 Credit: Md saim`,
            threadID
          );
        } catch {
          return api.sendMessage(
            `⚠️ ${senderID} কে রিমুভ করা যায়নি (Admin প্রয়োজন)।\n👑 Credit: Md saim`,
            threadID
          );
        }
      }
    }
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID } = event;
  const data = loadData();

  if (!data[threadID])
    data[threadID] = { enabled: false, words: ["fuck", "sex", "bitch", "nude"] };

  const option = args[0]?.toLowerCase();
  const group = data[threadID];

  switch (option) {
    case "on":
      group.enabled = true;
      saveData(data);
      return api.sendMessage(
        `⚡━━━[ SYSTEM ON ]━━━⚡\n🟢 Banword System সক্রিয় হয়েছে!\nসব নিষিদ্ধ শব্দ auto delete হবে 🔥\n👑 Credit: Md saim`,
        threadID
      );

    case "off":
      group.enabled = false;
      saveData(data);
      return api.sendMessage(
        `🔕━━━[ SYSTEM OFF ]━━━🔕\n❌ Banword System বন্ধ করা হয়েছে!\n👑 Credit: Md saim`,
        threadID
      );

    case "add":
      const newWord = args.slice(1).join(" ").toLowerCase();
      if (!newWord)
        return api.sendMessage("❗ উদাহরণ: /banword add spam", threadID);
      if (group.words.includes(newWord))
        return api.sendMessage(`⚠️ "${newWord}" আগে থেকেই তালিকায় আছে।`, threadID);
      group.words.push(newWord);
      saveData(data);
      return api.sendMessage(
        `🌈 "${newWord}" সফলভাবে নিষিদ্ধ তালিকায় যোগ হয়েছে!\n👑 Credit: Md saim`,
        threadID
      );

    case "remove":
      const delWord = args.slice(1).join(" ").toLowerCase();
      if (!delWord)
        return api.sendMessage("❗ উদাহরণ: /banword remove spam", threadID);
      const idx = group.words.indexOf(delWord);
      if (idx === -1)
        return api.sendMessage(`❌ "${delWord}" তালিকায় নেই।`, threadID);
      group.words.splice(idx, 1);
      saveData(data);
      return api.sendMessage(
        `🗑️ "${delWord}" নিষিদ্ধ তালিকা থেকে সরানো হয়েছে!\n👑 Credit: Md saim`,
        threadID
      );

    case "list":
      return api.sendMessage(
        `📜━━━[ BANWORD LIST ]━━━📜\n${group.words.join(", ")}\n\nStatus: ${
          group.enabled ? "🟢 ON" : "🔴 OFF"
        }\n👑 Credit: Md saim`,
        threadID
      );

    default:
      return api.sendMessage(
        `🌈━━━[ BANWORD MENU ]━━━🌈
🟢 /banword on — চালু করো  
🔴 /banword off — বন্ধ করো  
✨ /banword add <word> — শব্দ যোগ  
🗑️ /banword remove <word> — শব্দ বাদ  
📜 /banword list — নিষিদ্ধ তালিকা দেখো  

👑 Developer: Md saim`,
        threadID
      );
  }
};
