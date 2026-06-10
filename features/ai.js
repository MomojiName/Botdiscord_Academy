const { GoogleGenAI } = require('@google/genai');

let ai;
function initAI() {
    if (process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log('✅ AI System Initialized');
    }
}

async function askGemini(prompt, attachments = []) {
    if (!ai) return "❌ ระบบ AI ยังไม่ได้ตั้งค่า API Key";
    
    try {
        const parts = [];
        if (prompt) parts.push({ text: prompt });
        else if (attachments.length > 0) parts.push({ text: "อธิบายรูปภาพเหล่านี้ให้หน่อยครับ" });

        for (const attachment of attachments) {
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                const res = await fetch(attachment.url);
                const buffer = await res.arrayBuffer();
                parts.push({
                    inlineData: {
                        data: Buffer.from(buffer).toString('base64'),
                        mimeType: attachment.contentType
                    }
                });
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: parts,
        });

        let text = response.text;
        if (text && text.length > 1950) text = text.substring(0, 1950) + "...\n\n*(ข้อความถูกตัดออกเนื่องจากยาวเกินไป)*";
        return text || "✅ ประมวลผลสำเร็จแต่ไม่มีข้อความตอบกลับ";
    } catch (error) {
        console.error(error);
        return "❌ ข้อผิดพลาด AI: " + error.message;
    }
}

module.exports = { initAI, askGemini };
