// 🟢 ไฟล์ตัวอย่างสำหรับการสร้างฟังก์ชันลูกเล่นใหม่ๆ ให้บอท
module.exports = function(client) {
    client.on('messageCreate', (message) => {
        if (message.content === '!ping') {
            const timeTaken = Date.now() - message.createdTimestamp;
            message.reply(`🏓 Pong! ความหน่วง: ${timeTaken}ms`);
        }
    });
};
