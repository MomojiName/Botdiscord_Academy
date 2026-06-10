// 🟢 ไฟล์นี้เปิดให้คุณเขียนโค้ดและเพิ่มคำสั่งให้บอทได้ตามสบาย!
const { startBot } = require('./core/app.js'); // โหลดระบบแกนหลักที่ถูกล็อคความปลอดภัยไว้

// โหลดไฟล์ลูกเล่นจากโฟลเดอร์ features
const pingFeature = require('./features/ping.js');

startBot((client) => {
    // 1. ลองเขียนคำสั่งพื้นฐานตรงนี้ได้เลย
    client.on('messageCreate', (message) => {
        if (message.author.bot) return;

        // คำสั่ง !hello
        if (message.content === '!hello') {
            message.reply('สวัสดีจ้า! บอทพร้อมทำงานแล้ว 🚀');
        }
    });

    // 2. เรียกใช้งานลูกเล่นจากโฟลเดอร์ features
    pingFeature(client);
    
    console.log("✅ โหลด Custom Features ปลั๊กอินเสริมของคุณเรียบร้อยแล้ว!");
});
