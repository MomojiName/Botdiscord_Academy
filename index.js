require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const http = require('http');

// Simple Web Server for Cloud Hosting Port Binding
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Discord Bot is Online! 🚀');
});
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`✅ Web server is running on port ${port} (Required for Cloud Hosting)`);
});

global.WebSocket = require('ws');

// 🟢 ไฟล์นี้เปิดให้คุณเขียนโค้ดและเพิ่มคำสั่งให้บอทได้ตามสบาย!
const { startBot } = require('./core/app.js'); // โหลดระบบแกนหลักที่ถูกล็อคความปลอดภัยไว้

// โหลดไฟล์ลูกเล่นจากโฟลเดอร์ features
const pingFeature = require('./features/ping.js');
const initMusic = require('./features/music.js');
const initCommands = require('./features/commands.js');
const { initAI } = require('./features/ai.js');
const initScheduler = require('./features/scheduler.js');

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
    initMusic(client);
    initCommands(client);
    initAI();
    initScheduler(client);
    
    console.log("✅ โหลด Custom Features ปลั๊กอินเสริมของคุณเรียบร้อยแล้ว!");
});
