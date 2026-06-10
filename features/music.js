const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const play = require('play-dl');

const queue = new Map();

async function initMusic(client) {
    // 🍪 YouTube Authentication System (Bypass 429)
    if (process.env.YOUTUBE_COOKIE) {
        const rawCookie = process.env.YOUTUBE_COOKIE.replace(/"/g, '');
        play.setToken({
            youtube: { cookie: rawCookie }
        }).catch(err => console.log("play-dl cookie error:", err));
    }

    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild) return;

        const args = message.content.split(' ');
        const command = args[0].toLowerCase();

        if (command === '!play') {
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.reply('❌ คุณต้องอยู่ในห้องเสียงก่อนครับ!');

            const query = args.slice(1).join(' ');
            if (!query) return message.reply('❌ โปรดระบุชื่อเพลงที่ต้องการเล่นด้วยครับ เช่น `!play เพลงเศร้า`');

            const waitMsg = await message.reply('🔍 กำลังค้นหาเพลง...');

            try {
                const yt_info = await play.search(query, { limit: 1 });
                if (!yt_info || yt_info.length === 0) return waitMsg.edit('❌ หาเพลงไม่เจอครับ ลองพิมพ์ชื่อใหม่ดูนะ');
                
                const song = {
                    title: yt_info[0].title,
                    url: yt_info[0].url,
                    thumbnail: yt_info[0].thumbnails?.[0]?.url,
                    duration: yt_info[0].durationRaw
                };

                let serverQueue = queue.get(message.guild.id);

                if (!serverQueue) {
                    const queueConstruct = {
                        textChannel: message.channel,
                        voiceChannel: voiceChannel,
                        connection: null,
                        songs: [],
                        player: createAudioPlayer(),
                        playing: true
                    };
                    queue.set(message.guild.id, queueConstruct);
                    queueConstruct.songs.push(song);

                    try {
                        const connection = joinVoiceChannel({
                            channelId: voiceChannel.id,
                            guildId: message.guild.id,
                            adapterCreator: message.guild.voiceAdapterCreator,
                        });
                        queueConstruct.connection = connection;
                        connection.subscribe(queueConstruct.player);

                        playSong(message.guild, queueConstruct.songs[0]);
                        waitMsg.edit(`🎶 กำลังเริ่มเล่น: **${song.title}**`);
                    } catch (err) {
                        console.error(err);
                        queue.delete(message.guild.id);
                        return waitMsg.edit('❌ ไม่สามารถเข้าห้องเสียงได้ครับ');
                    }
                } else {
                    serverQueue.songs.push(song);
                    return waitMsg.edit(`✅ เพิ่มคิวแล้ว: **${song.title}**`);
                }
            } catch (error) {
                console.error(error);
                return waitMsg.edit('❌ เกิดข้อผิดพลาดในการเล่นเพลงครับ (บางทีอาจจะติดลิมิตการค้นหาจาก YouTube)');
            }
        }

        if (command === '!skip') {
            const serverQueue = queue.get(message.guild.id);
            if (!message.member.voice.channel) return message.reply('❌ คุณต้องอยู่ในห้องเสียงก่อนครับ');
            if (!serverQueue) return message.reply('❌ ไม่มีเพลงให้ข้ามครับ');
            
            serverQueue.player.stop();
            message.reply('⏭️ ข้ามเพลงเรียบร้อย');
        }

        if (command === '!stop') {
            const serverQueue = queue.get(message.guild.id);
            if (!message.member.voice.channel) return message.reply('❌ คุณต้องอยู่ในห้องเสียงก่อนครับ');
            if (!serverQueue) return message.reply('❌ ไม่มีเพลงกำลังเล่นอยู่ครับ');

            serverQueue.songs = [];
            serverQueue.player.stop();
            serverQueue.connection.destroy();
            queue.delete(message.guild.id);
            message.reply('🛑 หยุดเล่นและเคลียร์คิวเรียบร้อย');
        }
    });
}

async function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        if (serverQueue.connection) serverQueue.connection.destroy();
        queue.delete(guild.id);
        return;
    }

    try {
        const stream = await play.stream(song.url, { discordPlayerCompatibility: true });
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        
        serverQueue.player.play(resource);

        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
            serverQueue.songs.shift();
            playSong(guild, serverQueue.songs[0]);
        });
        
        serverQueue.player.on('error', error => {
            console.error('Error in AudioPlayer:', error);
            serverQueue.songs.shift();
            playSong(guild, serverQueue.songs[0]);
        });

    } catch (error) {
        console.error('Error streaming song:', error);
        serverQueue.textChannel.send(`❌ เล่นเพลงนี้ไม่ได้ครับ: ${song.title}`);
        serverQueue.songs.shift();
        playSong(guild, serverQueue.songs[0]);
    }
}

module.exports = initMusic;
