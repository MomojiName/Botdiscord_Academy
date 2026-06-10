const fs = require('fs');

const lines = fs.readFileSync('C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\4edad4cf-5eeb-4440-94cf-a0bded542596\\.system_generated\\logs\\transcript.jsonl', 'utf8').split('\n');

const virtualFS = {};

for (const line of lines) {
    if (!line) continue;
    try {
        const step = JSON.parse(line);
        // We only care about steps before my disaster (let's say step 1300)
        if (step.step_index > 1250) break; 
        
        if (step.tool_calls) {
            for (const call of step.tool_calls) {
                if (call.name === 'write_to_file') {
                    let target = call.args.TargetFile.replace(/\\/g, '/').toLowerCase();
                    if (target.includes('disbot10/features/')) {
                        const content = call.args.CodeContent;
                        virtualFS[target] = content;
                    }
                } else if (call.name === 'multi_replace_file_content') {
                    let target = call.args.TargetFile.replace(/\\/g, '/').toLowerCase();
                    if (virtualFS[target] && call.args.ReplacementChunks) {
                        let fileContent = virtualFS[target];
                        let chunks;
                        try {
                            chunks = typeof call.args.ReplacementChunks === 'string' ? JSON.parse(call.args.ReplacementChunks) : call.args.ReplacementChunks;
                        } catch(e) { continue; }
                        
                        for (const chunk of chunks) {
                            if (fileContent.includes(chunk.TargetContent)) {
                                fileContent = fileContent.replace(chunk.TargetContent, chunk.ReplacementContent);
                            }
                        }
                        virtualFS[target] = fileContent;
                    }
                } else if (call.name === 'replace_file_content') {
                    let target = call.args.TargetFile.replace(/\\/g, '/').toLowerCase();
                    if (virtualFS[target] && call.args.TargetContent && call.args.ReplacementContent) {
                        let fileContent = virtualFS[target];
                        if (fileContent.includes(call.args.TargetContent)) {
                            fileContent = fileContent.replace(call.args.TargetContent, call.args.ReplacementContent);
                        }
                        virtualFS[target] = fileContent;
                    }
                }
            }
        }
    } catch(e) {}
}

for (const [filepath, content] of Object.entries(virtualFS)) {
    const filename = filepath.split('/').pop();
    const savePath = `f:/Disbot10/features/${filename}`;
    fs.writeFileSync(savePath, content);
    console.log(`Reconstructed ${filename}: ${content.length} bytes`);
}
