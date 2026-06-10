const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\4edad4cf-5eeb-4440-94cf-a0bded542596\\.system_generated\\logs\\transcript.jsonl', 'utf8').split('\n');

for (const line of lines) {
    if (!line) continue;
    try {
        const step = JSON.parse(line);
        if (step.tool_calls) {
            for (const call of step.tool_calls) {
                if (call.name === 'write_to_file') {
                    console.log('write_to_file target:', call.args.TargetFile);
                    return; // exit after first
                }
            }
        }
    } catch(e) {}
}
