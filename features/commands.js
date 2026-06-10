const { askGemini } = require('./ai.js');

function initCommands(client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        // คำสั่ง !ask
        if (message.content.startsWith('!ask')) {
            const prompt = message.content.replace('!ask', '').trim();
            const attachments = message.attachments.map(a => a);
            
            if (!prompt && attachments.length === 0) {
                return message.reply("❓ พิมพ์คำถามต่อท้ายคำสั่งด้วยครับ เช่น `!ask ขอสูตรทำไข่เจียว`");
            }

            const waitMsg = await message.reply("⏳ กำลังคิด...");
            const response = await askGemini(prompt, attachments);
            await waitMsg.edit(response);
        }

        // คำสั่งอื่นๆ สามารถเพิ่มได้ที่นี่
        if (message.content === '!help') {
            message.reply('**คู่มือการใช้งานบอท**\n- `!ask <คำถาม>` - คุยกับ AI\n- `!play <เพลง>` - เล่นเพลงจาก YouTube\n- `!stop` - หยุดเพลง\n- `!skip` - ข้ามเพลง');
        }
    });
}

module.exports = initCommands;
