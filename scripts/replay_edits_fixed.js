const fs = require('fs');

const lines = fs.readFileSync('C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\4edad4cf-5eeb-4440-94cf-a0bded542596\\.system_generated\\logs\\transcript.jsonl', 'utf8').split('\n');

const virtualFS = {};

for (const line of lines) {
    if (!line) continue;
    try {
        const step = JSON.parse(line);
        // Only reconstruct up to step 1056 where it was complete
        if (step.step_index > 1100) break;
        
        if (step.tool_calls) {
            for (const call of step.tool_calls) {
                try {
                    if (call.name === 'write_to_file') {
                        let target = JSON.parse(call.args.TargetFile).replace(/\\/g, '/').toLowerCase();
                        if (target.includes('disbot10/features/')) {
                            const content = JSON.parse(call.args.CodeContent);
                            virtualFS[target] = content;
                        }
                    } else if (call.name === 'multi_replace_file_content') {
                        let target = JSON.parse(call.args.TargetFile).replace(/\\/g, '/').toLowerCase();
                        if (virtualFS[target] && call.args.ReplacementChunks) {
                            let fileContent = virtualFS[target];
                            let chunks = JSON.parse(call.args.ReplacementChunks);
                            
                            for (const chunk of chunks) {
                                if (fileContent.includes(chunk.TargetContent)) {
                                    fileContent = fileContent.replace(chunk.TargetContent, chunk.ReplacementContent);
                                }
                            }
                            virtualFS[target] = fileContent;
                        }
                    } else if (call.name === 'replace_file_content') {
                        let target = JSON.parse(call.args.TargetFile).replace(/\\/g, '/').toLowerCase();
                        if (virtualFS[target] && call.args.TargetContent && call.args.ReplacementContent) {
                            let fileContent = virtualFS[target];
                            const tCont = JSON.parse(call.args.TargetContent);
                            const rCont = JSON.parse(call.args.ReplacementContent);
                            if (fileContent.includes(tCont)) {
                                fileContent = fileContent.replace(tCont, rCont);
                            }
                            virtualFS[target] = fileContent;
                        }
                    }
                } catch(e) {
                    // console.error("Error parsing args at step " + step.step_index, e);
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
