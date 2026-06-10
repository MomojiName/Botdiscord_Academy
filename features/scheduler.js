const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');

function initScheduler(client) {
    const channelId = process.env.WORK_NOTIFY_CHANNEL_ID;
    const traineeRoleId = process.env.TRAINEE_ROLE_ID;

    if (!channelId) return;

    const sendNotify = async (title, message, timeStr) => {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) return;
            const embed = new EmbedBuilder().setTitle(title).setDescription(message + `\n\n**วันนี้ เวลา ${timeStr}**`).setColor('#2F3136');
            const content = `@everyone ${traineeRoleId ? `<@&${traineeRoleId}>` : ''}`;
            await channel.send({ content, embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    };

    cron.schedule('58 8 * * 1-5', () => sendNotify('🌅 ได้เวลาเริ่มงานแล้ว ลุยกันเลย!', 'เตรียมตัวให้พร้อม ขอให้วันนี้เป็นวันที่ Productive สุดๆ ไปเลยนะ!\n**กดเข้าลิงก์ซูมกันได้เลย เวลา 09:00**', '9:00'));
    cron.schedule('58 11 * * 1-5', () => sendNotify('🍱 พักเที่ยงแล้วจ้า! (12:00 - 13:00)', 'พักสายตา พักสมอง ไปหาของอร่อยๆ กินกันได้แล้ว เติมพลังก่อนลุยงานช่วงบ่าย!', '12:00'));
    cron.schedule('58 12 * * 1-5', () => sendNotify('🔥 หมดเวลาพักแล้ว กลับเข้าสู่โหมดลุยงาน! (13:00)', 'ได้เวลามาสานต่อความฝันและเคลียร์งานช่วงบ่ายให้จบ ลุยกันต่อเลยพวกเรา!', '13:00'));
    cron.schedule('58 17 * * 1-5', () => sendNotify('📴 เลิกงานกันได้แล้ว เจ้าพวกบ้างาน!!', 'เก็บของปิดคอม พักผ่อนให้เต็มที่ ขอบคุณสำหรับความเหน็ดเหนื่อยในวันนี้นะทุกคน เจอกันใหม่พรุ่งนี้! 👋', '18:00'));
}
module.exports = initScheduler;
