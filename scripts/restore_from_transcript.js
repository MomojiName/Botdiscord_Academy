const fs = require('fs');
const transcript = fs.readFileSync('C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\4edad4cf-5eeb-4440-94cf-a0bded542596\\.system_generated\\logs\\transcript.jsonl', 'utf8').split('\n');

const filesToRestore = ['features/music.js', 'features/ai.js', 'features/commands.js', 'features/scheduler.js', 'utils/license.js', 'package.json'];
const fileContents = {};

for (const line of transcript) {
    if (!line) continue;
    try {
        const step = JSON.parse(line);
        
        // Check tool responses for view_file
        if (step.source === 'SYSTEM' && step.type === 'TOOL_RESPONSE') {
            for (const resp of step.tool_responses || []) {
                if (resp.name === 'view_file' && resp.output) {
                    const output = resp.output;
                    for (const target of filesToRestore) {
                        if (output.includes(`file:///f:/Disbot10/${target}`) && output.includes('The above content shows the entire, complete file contents')) {
                            // Extract lines
                            const lines = output.split('\n');
                            let content = [];
                            let capturing = false;
                            for (const l of lines) {
                                if (l.includes('The following code has been modified')) {
                                    capturing = true;
                                    continue;
                                }
                                if (l.includes('The above content shows')) {
                                    capturing = false;
                                    break;
                                }
                                if (capturing) {
                                    // Remove line number prefix "1: "
                                    const match = l.match(/^\d+:\s?(.*)$/);
                                    if (match) {
                                        content.push(match[1]);
                                    } else {
                                        content.push(l); // Fallback
                                    }
                                }
                            }
                            if (content.length > 0) {
                                fileContents[target] = content.join('\n');
                            }
                        }
                    }
                }
            }
        }
    } catch(e) {}
}

for (const [file, content] of Object.entries(fileContents)) {
    const fullPath = `f:/Disbot10/${file}`;
    fs.mkdirSync(fullPath.substring(0, fullPath.lastIndexOf('/')), { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log(`Restored ${file} (${content.length} bytes)`);
}
