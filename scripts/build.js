const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const SOURCE_DIR = ROOT_DIR;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TEMP_DIR = path.join(os.tmpdir(), `disbot_build_temp_${Date.now()}`);

const EXCLUDE_LIST = [
    'node_modules', 
    'dist', 
    'dist_vscode',
    'scripts',
    '.env', 
    '.gitignore', 
    'build.js',
    'build-vscode.js',
    'package-lock.json'
];

async function build() {
    console.log(`🚀 [1/4] Preparing temporary build directory at ${TEMP_DIR}...`);
    
    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR);
    fs.mkdirSync(TEMP_DIR);

    const filesInRoot = fs.readdirSync(SOURCE_DIR);
    for (const item of filesInRoot) {
        if (!EXCLUDE_LIST.includes(item)) {
            const srcPath = path.join(SOURCE_DIR, item);
            const destPath = path.join(TEMP_DIR, item);
            fs.copySync(srcPath, destPath);
        }
    }

    console.log("👽 [2/4] Obfuscating source code...");
    
    const filesToObfuscate = [];
    
    function findJsFiles(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                findJsFiles(fullPath);
            } else if (path.extname(fullPath) === '.js') {
                if (file !== 'index.js') {
                    filesToObfuscate.push(fullPath);
                }
            }
        }
    }
    
    findJsFiles(TEMP_DIR);

    for (const file of filesToObfuscate) {
        const fileContent = fs.readFileSync(file, 'utf8');
        const obfuscationResult = JavaScriptObfuscator.obfuscate(fileContent, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: false, 
            disableConsoleOutput: false,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,
            selfDefending: true,
            simplify: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayCallsTransformThreshold: 0.5,
            stringArrayEncoding: ['base64'],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 1,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersParametersMaxCount: 2,
            stringArrayWrappersType: 'variable',
            stringArrayThreshold: 0.75,
            unicodeEscapeSequence: false
        });
        
        fs.writeFileSync(file, obfuscationResult.getObfuscatedCode());
    }

    console.log("📦 [3/4] Packaging executable...");
    
    try {
        const pkgJsonPath = path.join(TEMP_DIR, 'package.json');
        const pkgData = require(path.join(SOURCE_DIR, 'package.json'));
        
        pkgData.main = 'index.js'; 
        pkgData.bin = 'index.js'; 
        
        pkgData.pkg = {
            scripts: ["**/*.js", "features/**/*.js", "utils/**/*.js", "database/**/*.js"],
            assets: [
                "node_modules/@supabase/**/*",
                "node_modules/discord.js/**/*",
                ".env"
            ],
            targets: ["node18-win-x64"]
        };
        
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgData, null, 2));

        const srcNodeModules = path.join(SOURCE_DIR, 'node_modules');
        const destNodeModules = path.join(TEMP_DIR, 'node_modules');
        console.log("   -> Copying node_modules (this might take a moment)...");
        if (fs.existsSync(srcNodeModules)) {
            fs.copySync(srcNodeModules, destNodeModules);
        } else {
            console.log("   -> Running npm install in temp dir...");
            execSync('npm install --production', { cwd: TEMP_DIR, stdio: 'inherit' });
        }

        execSync(`npx pkg . --out-path "${DIST_DIR}"`, { cwd: TEMP_DIR, stdio: 'inherit' });
        
        const pkgName = pkgData.name || 'disbot10';
        const generatedExe = path.join(DIST_DIR, `${pkgName}.exe`);
        const finalExe = path.join(DIST_DIR, 'Disbot.exe');
        
        if (fs.existsSync(finalExe)) {
            try { fs.removeSync(finalExe); } catch(e) {}
        }

        if (fs.existsSync(generatedExe)) {
            try { 
                fs.renameSync(generatedExe, finalExe); 
                console.log(`✅ สำเร็จ! ไฟล์เปลี่ยนชื่อเป็น ${finalExe} แล้ว`);
            } catch(e) {
                console.log(`⚠️ ไม่สามารถเปลี่ยนชื่อไฟล์เป็น Disbot.exe ได้ (ไฟล์อาจถูกใช้งานอยู่) แต่คุณสามารถใช้ไฟล์ ${pkgName}.exe ได้เลยครับ`);
            }
        } else {
            console.log("⚠️ ไม่พบไฟล์ .exe ที่สร้างเสร็จ ให้ลองหาในโฟลเดอร์ dist ดูครับ");
        }

    } catch (err) {
        console.error("❌ บิ้วไฟล์ .exe ไม่สำเร็จ:", err.message);
    }

    console.log("🧹 [4/4] Cleaning up temporary files...");
    
    try {
        fs.removeSync(TEMP_DIR);
    } catch (e) {
        console.log(`⚠️ ไม่สามารถลบโฟลเดอร์ ${TEMP_DIR} ได้ชั่วคราว (อาจถูกล็อก)`);
    }

    console.log("\n✅==================================================✅");
    console.log("   เสร็จสมบูรณ์! ไฟล์ .exe ของคุณอยู่ในโฟลเดอร์ 'dist'");
    console.log("✅==================================================✅\n");
}

build();
