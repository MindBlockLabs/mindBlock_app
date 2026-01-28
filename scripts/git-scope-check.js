#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const minimatch = require('minimatch').minimatch || require('minimatch');

const SCOPE_FILE = '.scope-lock.json';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// 1. Check if scope lock exists
if (!fs.existsSync(SCOPE_FILE)) {
    process.exit(0);
}

const scopeConfig = JSON.parse(fs.readFileSync(SCOPE_FILE, 'utf8'));

if (!scopeConfig.enforce) {
    console.log(`${CYAN}ℹ️ Scope enforcement disabled in config.${RESET}`);
    process.exit(0);
}

// 2. Get Staged Files
try {
    // Run git command from the root of the repo
    // We assume the script is run from project root or .git/hooks which executes in project root usually
    const stagedFilesOutput = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const stagedFiles = stagedFilesOutput.split('\n').filter(line => line.trim() !== '');

    if (stagedFiles.length === 0) process.exit(0);

    // 3. Validate
    const violations = [];
    const allowedPatterns = scopeConfig.allowedPatterns || [];

    stagedFiles.forEach(file => {
        const isAllowed = allowedPatterns.some(pattern => minimatch(file, pattern));
        if (!isAllowed) {
            violations.push(file);
        }
    });

    // 4. Result
    if (violations.length > 0) {
        console.error(`\n${RED}🛑 SCOPE VIOLATION DETECTED 🛑${RESET}`);
        console.error(`The following files are not in the allowed scope for task "${scopeConfig.task}":\n`);
        violations.forEach(v => console.error(`  - ${v}`));
        console.error(`\n${CYAN}Action Required:${RESET} Unstage these files or update ${SCOPE_FILE}.\n`);
        process.exit(1);
    } else {
        console.log(`${GREEN}✅ Scope Check Passed: All files within defined boundaries.${RESET}`);
        process.exit(0);
    }

} catch (error) {
    console.error('Failed to run scope check:', error);
    process.exit(1);
}
