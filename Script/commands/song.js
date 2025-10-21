const axios = require("axios");
const fs = require('fs');
const path = require('path'); // Added for better path handling

// --- Helper Functions ---

/**
 * Fetches the base API URL from GitHub.
 * @returns {Promise<string>} The base API URL.
 */
const baseApiUrl = async () => {
  try {
    const base = await axios.get(
      `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`,
    );
    return base.data.api;
  } catch (error) {
    console.error("Error fetching base API URL:", error.message);
    // Fallback or rethrow based on expected bot behavior
    throw new Error("Could not fetch the base API URL.");
  }
};

/**
 * Downloads a file from a URL, saves it to a local path, and returns a readable stream.
 * @param {string} url The URL to download from.
 * @param {string} fileName The name of the file to save (e.g., 'audio.mp3').
 * @returns {Promise<fs.ReadStream>} A readable stream of the downloaded file.
 */
async function dipto(url, fileName) {
  const filePath = path.join(__dirname, fileName);
  try {
    const response = (await axios.get(url, {
      responseType: "arraybuffer"
    })).data;

    fs.writeFileSync(filePath, Buffer.from(response));
    return fs.createReadStream(filePath);
  } catch (err) {
    console.error("Error in dipto (file download):", err.message);
    throw err;
  }
}

/**
 * Downloads a file from a URL as a stream and sets its path property.
 * This is primarily for use with the Facebook API's attachment mechanism.
 * @param {string} url The URL to download from.
 * @param {string} fileName The name of the file to be associated with the stream.
 * @returns {Promise<import('axios').AxiosResponse['data'] & {path: string}>} The response stream with an added 'path' property.
 */
async function diptoSt(url, fileName) {
  try {
    const response = await axios.get(url, {
      responseType: "stream"
    });
    // Set a path for the bot framework to potentially use (often required for streams)
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
  version: "2.1.1", // Updated version
  aliases: ["music", "play"],
  credits: "RAHAT (Fixed by Gemini)", // Added fix credit
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
  const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  const filePath = path.join(__dirname, 'audio.mp3'); // Define path for cleanup

  try {
    const urlYtb = checkurl.test(args[0]);

    // Handle direct YouTube URL
    if (urlYtb) {
      const match = args[0].match(checkurl);
      const videoID = match ? match[1] : null;

      if (!videoID) {
        return api.sendMessage("❌ Could not extract video ID from the provided link.", event.threadID, event.messageID);
      }
      
      const baseUrl = await baseApiUrl();
      const {
        data: {
          title,
          downloadLink,
          quality
        }
      } = await axios.get(
        `${baseUrl}/ytDl3?link=${videoID}&format=mp3`
      );

      // Download and send the audio file
      await api.sendMessage({
        body: `✅ Downloading: ${title}\n• Quality: ${quality}`,
      }, event.threadID, event.messageID);
      
      const audioStream = await dipto(downloadLink, 'audio.mp3'); // Use the fixed dipto

      return api.sendMessage({
        body: title,
        attachment: audioStream
      }, event.threadID, () => {
        // Cleanup after sending
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, event.messageID);
    }

    // Handle search by keyword
    let keyWord = args.join(" ");
    if (!keyWord) {
      return api.sendMessage(`Please provide a song name or YouTube link.\nUsage: ${this.config.usages.replace(/{pn}/g, commandName)}`, event.threadID, event.messageID);
    }

    keyWord = keyWord.includes("?feature=share") ? keyWord.replace("?feature=share", "") : keyWord;
    const maxResults = 6;
    const baseUrl = await baseApiUrl();
    
    // Search for the song
    const searchResponse = (await axios.get(`${baseUrl}/ytFullSearch?songName=${keyWord}`)).data;
    const result = searchResponse.slice(0, maxResults);

    if (result.length === 0)
      return api.sendMessage(`⭕ No search results match the keyword: **${keyWord}**`, event.threadID, event.messageID);
    
    // Format and send the search results
    let msg = "🔎 **Search Results:**\n\n";
    let i = 1;
    const thumbnails = [];
    for (const info of result) {
      // Use the fixed diptoSt to get stream attachments
      thumbnails.push(diptoSt(info.thumbnail, `photo_${i}.jpg`)); 
      msg += `${i++}. **${info.title}**\nTime: ${info.time}\nChannel: ${info.channel.name}\n\n`;
    }

    // Send the list of options with thumbnails
    api.sendMessage({
      body: msg + "Reply to this message with a number (1-6) to listen to the song.",
      attachment: await Promise.all(thumbnails)
    }, event.threadID, (err, info) => {
      if (err) return console.error("Error sending search results:", err);
      // Store reply handler data
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        result
      });
      
      // Cleanup temporary thumbnail streams (this part depends heavily on the bot platform)
      // For simplicity, streams are often not explicitly unlinked here.
      
    }, event.messageID);

  } catch (err) {
    console.error("Error in 'song' run function:", err);
    return api.sendMessage("❌ An error occurred during command execution. Please try again later.", event.threadID, event.messageID);
  }
};

// --- Reply Handler ---

module.exports.handleReply = async ({
  event,
  api,
  handleReply
}) => {
  const filePath = path.join(__dirname, 'audio.mp3');

  // Only process replies from the original author
  if (event.senderID !== handleReply.author) return; 

  try {
    const {
      result
    } = handleReply;
    const choice = parseInt(event.body.trim()); // Trim whitespace

    if (!isNaN(choice) && choice <= result.length && choice > 0) {
      const infoChoice = result[choice - 1];
      const idvideo = infoChoice.id;

      await api.unsendMessage(handleReply.messageID); // Unsend the selection message
      await api.sendMessage(`🎶 Preparing to download **${infoChoice.title}**...`, event.threadID, event.messageID);
      
      const baseUrl = await baseApiUrl();
      const {
        data: {
          title,
          downloadLink,
          quality
        }
      } = await axios.get(`${baseUrl}/ytDl3?link=${idvideo}&format=mp3`);

      // Download the selected audio
      const audioStream = await dipto(downloadLink, 'audio.mp3'); // Use the fixed dipto

      // Send the downloaded audio
      await api.sendMessage({
        body: `✅ **Playing Song:**\n• Title: **${title}**\n• Quality: ${quality}`,
        attachment: audioStream
      }, event.threadID,
      () => {
        // Cleanup after sending
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, event.messageID);
      
    } else {
      // Re-send reply handler to keep the prompt active for a correct reply
      api.sendMessage("❌ Invalid choice. Please enter a number between 1 and 6.", event.threadID, (err, info) => {
        global.client.handleReply.push({
          name: handleReply.name,
          messageID: info.messageID,
          author: event.senderID,
          result
        });
      }, event.messageID);
    }
  } catch (error) {
    // Check if the error is related to file size
    if (error.message && error.message.includes('code 413')) { 
      // 413 Payload Too Large is a common error for large files on some APIs
      api.sendMessage("❌ Sorry, the selected audio is too large (likely over 26MB) and cannot be sent.", event.threadID, event.messageID);
    } else {
      console.error("Error in 'song' handleReply:", error);
      api.sendMessage("⭕ Sorry, an error occurred while processing your request.", event.threadID, event.messageID);
    }
    // Attempt to clean up even on error
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
  }
};
