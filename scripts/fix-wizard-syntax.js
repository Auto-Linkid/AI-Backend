// Quick fix script for PostGeneratorWizard.tsx
// Run this to remove orphaned code at lines 137-152

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../Frontend/components/PostGeneratorWizard.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Remove lines 137-152 (0-indexed: 136-151)
const fixedLines = [
    ...lines.slice(0, 136),
    ...lines.slice(152)
];

fs.writeFileSync(filePath, fixedLines.join('\n'), 'utf8');
console.log('✅ Fixed! Removed orphaned code at lines 137-152');
