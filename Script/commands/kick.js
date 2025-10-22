module.exports.config = {
	name: "kick",
	version: "1.0.2", // ভার্সন আপডেট করা হয়েছে
	hasPermssion: 0,
	credits: "CYBER ☢️_𖣘 -BOT ⚠️ 𝑻𝑬𝑨𝑴_ ☢️ and Re-fixed by Gemini",
    description: "the person you need to remove from the group by tag",
	commandCategory: "System", 
	usages: "[tag]", 
	cooldowns: 0,
};

module.exports.languages = {
	"vi": {
		"error": "Đã có lỗi xảy ra, vui lòng thử lại sau",
		"needPermssion": "Cần quyền quản trị viên nhóm\nVui lòng thêm và thử lại!",
		"missingTag": "Bạn phải tag người cần kick"
	},
	"en": {
		"error": "Error! An error occurred. Please try again later!",
		"needPermssion": "Need group admin\nPlease add and try again!",
		"missingTag": "You need tag some person to kick"
	}
}

module.exports.run = async function({ api, event, getText, Threads }) {
	// যাদেরকে কিক করতে হবে তাদের ID গুলো নেওয়া হচ্ছে
	const mention = Object.keys(event.mentions);

	// যদি কেউ ট্যাগ না করা হয়
	if (mention.length === 0) {
		return api.sendMessage(getText("missingTag"), event.threadID, event.messageID);
	}

	try {
		// থ্রেড ডেটা সঠিকভাবে 'await' করা হয়েছে
		const threadInfo = (await Threads.getData(event.threadID)).threadInfo;

		// বট গ্রুপ অ্যাডমিন কিনা তা পরীক্ষা করা হচ্ছে
		if (!threadInfo.adminIDs.some(item => item.id == api.getCurrentUserID())) {
			return api.sendMessage(getText("needPermssion"), event.threadID, event.messageID);
		}

		// কিক করার কমান্ড প্রদানকারী গ্রুপ অ্যাডমিন কিনা তা পরীক্ষা করা হচ্ছে
		if (!threadInfo.adminIDs.some(item => item.id == event.senderID)) {
			// যদি কিককারী অ্যাডমিন না হয়, তবে একটি বার্তা দিয়ে ফাংশন শেষ করা হবে।
			return api.sendMessage("You are not an administrator of this group, so you cannot use this command.", event.threadID, event.messageID);
		}

		// প্রত্যেক ট্যাগ করা ব্যক্তিকে লুপের মাধ্যমে কিক করা হবে
		for (const userID of mention) {
			// কিক করার আগে একটি ছোট বিলম্ব (Delay) যোগ করা হয়েছে
			setTimeout(async () => {
                // কিক করার জন্য API কল
				await api.removeUserFromGroup(userID, event.threadID);
                // কিক সফল হলে একটি বার্তা পাঠানো যেতে পারে
                // api.sendMessage(`Removed user ${userID} from the group.`, event.threadID);
			}, 3000); // 3 সেকেন্ড পর কিক করবে
		}
        
        // কিক প্রসেস শুরু হয়েছে জানিয়ে একটি নিশ্চিতকরণ বার্তা পাঠানো হলো
        api.sendMessage(`Attempting to kick ${mention.length} user(s) in a few moments.`, event.threadID);

	} catch (error) { 
        // কোনো ত্রুটি ঘটলে ত্রুটি বার্তা পাঠানো হবে এবং ত্রুটি কনসোলে দেখানো হবে
        console.error(error);
        return api.sendMessage(getText("error"), event.threadID); 
    }
}
