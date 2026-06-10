const { GoogleGenAI } = require('@google/genai');

let ai;

function initAI() {
    if (process.env.GEMINI_API_KEY) {
        try {
            ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            console.log("✅ Google Gemini AI is ready.");
        } catch (error) {
            console.error("❌ Failed to initialize Google Gemini AI:", error);
        }
    } else {
        console.warn("⚠️ GEMINI_API_KEY is not set in .env. AI commands will not work.");
    }
}

async function askGemini(prompt) {
    if (!ai) {
        return "❌ ระบบ AI ยังไม่ได้ตั้งค่า API Key ครับ โปรดติดต่อแอดมินให้ตั้งค่า `GEMINI_API_KEY` ในไฟล์ .env";
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: prompt,
        });

        const text = response.text;
        
        // ลิมิตความยาวของข้อความ Discord อยู่ที่ 2000 ตัวอักษร
        if (text.length > 1950) {
            return text.substring(0, 1950) + "...\n\n*(ข้อความถูกตัดออกเนื่องจากยาวเกินไป)*";
        }
        
        return text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "❌ ขออภัยครับ ระบบ AI เกิดข้อผิดพลาด: `" + (error.message || error) + "`";
    }
}

module.exports = { initAI, askGemini };
