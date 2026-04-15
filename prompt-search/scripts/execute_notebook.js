const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function executeNotebook(notebookPath, parameters) {
    return new Promise((resolve, reject) => {
        const timeoutMs = process.env.NOTEBOOK_TIMEOUT_MS || 300000; // Bumped to 5 minutes for LLM loading
        
        // Windows-friendly temp paths
        const tempDir = os.tmpdir();
        const outputPath = path.join(tempDir, `output-${Date.now()}.ipynb`);
        const responseFilePath = path.join(tempDir, 'llm_response.json');

        // Clean up old response file if it exists so we don't read stale data
        if (fs.existsSync(responseFilePath)) {
            fs.unlinkSync(responseFilePath);
        }

        // Build parameters for the -p flag (Universal Papermill style)
        // This passes each key-value pair individually
        const paramArgs = [];
        for (const [key, value] of Object.entries(parameters)) {
            paramArgs.push('-p', key, typeof value === 'object' ? JSON.stringify(value) : value);
        }

        const args = [
            '-m', 'papermill',
            notebookPath,
            outputPath,
            ...paramArgs,
            '--kernel', 'python3',
            '--log-output',
            '--no-progress-bar'
        ];

        const pythonProcess = spawn('python', args, {
            env: { ...process.env, PYTHONPATH: path.resolve(__dirname, '../../src') }
        });

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', (data) => { stdoutData += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { stderrData += data.toString(); });

        const timeout = setTimeout(() => {
            pythonProcess.kill();
            reject(new Error('Notebook execution timed out after 5 minutes'));
        }, timeoutMs);

        pythonProcess.on('close', (code) => {
            clearTimeout(timeout);
            
            // Clean up the temporary notebook file
            if (fs.existsSync(outputPath)) { fs.unlinkSync(outputPath); }

            if (code !== 0) {
                return reject(new Error(`Papermill failed (Code ${code}): ${stderrData}`));
            }

            try {
                // 1. Check the OS-specific temp directory for the JSON
                if (fs.existsSync(responseFilePath)) {
                    const fileContent = fs.readFileSync(responseFilePath, 'utf8');
                    resolve(JSON.parse(fileContent));
                } else {
                    // 2. Fallback: Parse from stdout
                    const jsonMatch = stdoutData.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        resolve(JSON.parse(jsonMatch[0]));
                    } else {
                        reject(new Error("Response file missing and no JSON found in stdout. Check if your notebook writes to /tmp/llm_response.json correctly."));
                    }
                }
            } catch (err) {
                reject(new Error(`Failed to parse notebook output: ${err.message}`));
            }
        });
    });
}

module.exports = { executeNotebook };