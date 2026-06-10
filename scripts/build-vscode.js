const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const esbuild = require('esbuild');
const JavaScriptObfuscator = require('javascript-obfuscator');

async function build() {
    console.log('🚀 Starting SDK-style build for VS Code distribution...');
    const ROOT_DIR = path.join(__dirname, '..');
    const distDir = path.join(ROOT_DIR, 'dist_vscode');
    const coreDir = path.join(distDir, 'core');
    const featuresDir = path.join(distDir, 'features');

    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(coreDir, { recursive: true });
    fs.mkdirSync(featuresDir, { recursive: true });

    // 1. Read .env and parse it
    const envPath = path.join(ROOT_DIR, '.env');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found!');
        process.exit(1);
    }
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    const defineObj = {};
    for (const key in envConfig) {
        defineObj[`process.env.${key}`] = JSON.stringify(envConfig[key]);
    }
    defineObj['process.env.NODE_ENV'] = '"production"';

    // 2. Create a temporary core-entry.js
    const coreEntryCode = `
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const verifyLicense = require("./utils/license");
const { handleCommands } = require("./features/commands");
const { handleAuthInteractions } = require("./features/auth");
const { setupSchedule } = require("./features/schedule");
const { checkSpam } = require("./utils/antiSpam");
const { handleIntroMessageUpdate } = require("./features/intro");
const setupStatus = require("./features/status");

async function startBot(customFeaturesCallback) {
    const isValid = await verifyLicense();
    if (!isValid) return;

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
        ],
        partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });

    client.once("ready", () => {
        console.log(\`Bot Online: \${client.user.tag}\`);
        setupStatus(client);
        setupSchedule(client);
    });

    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;
        if (checkSpam(message)) {
            console.log(\`[AntiSpam] Blocked spam from \${message.author.tag}\`);
            return;
        }
        handleCommands(message, client);
    });

    client.on("interactionCreate", async (interaction) => {
        handleAuthInteractions(interaction, client);
    });

    client.on("messageUpdate", async (oldMessage, newMessage) => {
        handleIntroMessageUpdate(oldMessage, newMessage, client);
    });

    // Load custom user features before login
    if (typeof customFeaturesCallback === 'function') {
        customFeaturesCallback(client);
    }

    client.login(process.env.TOKEN);
}

module.exports = { startBot };
`;
    fs.writeFileSync(path.join(ROOT_DIR, 'core-entry.js'), coreEntryCode);

    console.log('📦 Bundling core logic with esbuild...');
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json')));
    const externals = Object.keys(pkg.dependencies || {});

    // 3. Bundle with esbuild
    await esbuild.build({
        entryPoints: ['core-entry.js'],
        bundle: true,
        platform: 'node',
        target: 'node18',
        outfile: path.join(coreDir, 'bundle.js'),
        define: defineObj,
        external: externals,
    });

    console.log('🔒 Obfuscating core module... (this might take a few seconds)');
    // 4. Obfuscate
    const bundleCode = fs.readFileSync(path.join(coreDir, 'bundle.js'), 'utf8');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(bundleCode, {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        debugProtection: false,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: false,
        renameGlobals: false,
        selfDefending: false,
        simplify: false,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayEncoding: ['rc4'],
        stringArrayIndexShift: true,
        stringArrayWrappersCount: 1,
        stringArrayWrappersType: 'variable',
        unicodeEscapeSequence: false
    });

    fs.writeFileSync(path.join(coreDir, 'app.js'), obfuscationResult.getObfuscatedCode());

    // Clean up temp files
    fs.unlinkSync(path.join(ROOT_DIR, 'core-entry.js'));

    console.log('✅ Obfuscated core module saved to dist_vscode/core/app.js');

    // 5. Create index.js for the tester
    const testerIndexCode = `// 🟢 ไฟล์นี้เปิดให้คุณเขียนโค้ดและเพิ่มคำสั่งให้บอทได้ตามสบาย!
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
`;
    fs.writeFileSync(path.join(distDir, 'index.js'), testerIndexCode);

    // 6. Create features/ping.js for the tester
    const pingCode = `// 🟢 ไฟล์ตัวอย่างสำหรับการสร้างฟังก์ชันลูกเล่นใหม่ๆ ให้บอท
module.exports = function(client) {
    client.on('messageCreate', (message) => {
        if (message.content === '!ping') {
            const timeTaken = Date.now() - message.createdTimestamp;
            message.reply(\`🏓 Pong! ความหน่วง: \${timeTaken}ms\`);
        }
    });
};
`;
    fs.writeFileSync(path.join(featuresDir, 'ping.js'), pingCode);

    // 7. Create package.json
    const distPkg = {
        name: "disbot-sdk",
        version: "1.0.0",
        description: "Bot SDK for VS Code Testing",
        main: "index.js",
        scripts: {
            "start": "node index.js"
        },
        dependencies: pkg.dependencies
    };
    fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(distPkg, null, 2));
    
    // Copy .gitignore
    fs.writeFileSync(path.join(distDir, '.gitignore'), "node_modules/\n.env\n");

    console.log('✅ Created dist_vscode/index.js and dist_vscode/features/');
    console.log('🎉 SDK Build complete! The folder "dist_vscode" is ready to be shared with testers.');
}

build().catch(console.error);
