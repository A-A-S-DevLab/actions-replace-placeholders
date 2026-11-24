const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

function parseJsonData(jsonData) {
    let data;
    try {
        data = JSON.parse(jsonData);
    } catch {
        throw new Error('json_data is not a valid JSON');
    }
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('json_data must be an object');
    }
    for (const [key, value] of Object.entries(data)) {
        if (value !== null && typeof value === 'object') {
            throw new Error(`Value of ${key} in json_data must be a string, number, boolean or null`);
        }
    }
    return data;
}

function checkRelativePath(name, value) {
    if (path.isAbsolute(value)) {
        throw new Error(`${name} must be a relative path`);
    }
    return value;
}

function writeFile(filePath, content, mode, details) {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true});
        console.log(`📁 Created directory: ${dirPath}`);
    }
    fs.writeFileSync(filePath, content, {encoding: 'utf8', mode});
    if (mode !== undefined) {
        fs.chmodSync(filePath, mode);
    }
    console.log(`✅ Updated: ${filePath}${details ? ` (${details})` : ''}`);
}

function placeholderValues(data) {
    const values = new Map();
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (values.has(lowerKey)) {
            throw new Error(`Duplicate key ${key} in json_data: keys are case-insensitive`);
        }
        values.set(lowerKey, String(value ?? ''));
    }
    return values;
}

function maskToRegExp(mask) {
    const pattern = mask
        .split('')
        .map(ch => (ch === '*' ? '.*' : ch === '?' ? '.' : ch.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
        .join('');
    return new RegExp(`^${pattern}$`, 'i');
}

function listDirectory(dirPath, relativeDir, maskRegExp) {
    const files = [];
    for (const entry of fs.readdirSync(dirPath, {withFileTypes: true})) {
        const filePath = path.join(dirPath, entry.name);
        const relativePath = path.join(relativeDir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listDirectory(filePath, relativePath, maskRegExp));
        } else if (entry.isFile() && maskRegExp.test(entry.name)) {
            files.push({filePath, relativePath});
        }
    }
    return files;
}

function listFiles(configsPath, configsMask) {
    const maskRegExp = maskToRegExp(configsMask);
    if (fs.statSync(configsPath).isDirectory()) {
        return listDirectory(configsPath, '', maskRegExp);
    }
    const fileName = path.basename(configsPath);
    if (!maskRegExp.test(fileName)) {
        console.log(`🟡 Skipped file: ${configsPath} (does not match mask: ${configsMask})`);
        return [];
    }
    return [{filePath: configsPath, relativePath: fileName}];
}

function replacePlaceholders(content, values, isJson) {
    const unresolvedKeys = [];
    const updatedContent = content.replace(/\$\{\{(.*?)\}\}/g, (match, key) => {
        const value = values.get(key.trim().toLowerCase());
        if (value === undefined) {
            unresolvedKeys.push(key.trim());
            return match;
        }
        return isJson ? JSON.stringify(value).slice(1, -1) : value;
    });
    return {updatedContent, unresolvedKeys};
}

try {
    const configsPath = checkRelativePath('configs_path', core.getInput('configs_path'));
    const configsMask = core.getInput('configs_mask') || '*.json';
    const jsonData = core.getInput('json_data');
    const isAllowUnresolved = core.getBooleanInput('is_allow_unresolved');
    const outputPath = checkRelativePath('output_path', core.getInput('output_path'));

    const values = placeholderValues(parseJsonData(jsonData));
    const unresolved = new Set();
    const results = [];
    for (const {filePath, relativePath} of listFiles(configsPath, configsMask)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const {updatedContent, unresolvedKeys} = replacePlaceholders(content, values, /\.json$/i.test(filePath));
        unresolvedKeys.forEach(key => unresolved.add(`${key} in ${relativePath}`));
        results.push({relativePath, updatedContent});
    }

    if (unresolved.size > 0) {
        const message = `Unresolved placeholders: ${[...unresolved].join(', ')}`;
        if (!isAllowUnresolved) {
            throw new Error(message);
        }
        console.log(`🟡 ${message}`);
    }

    for (const {relativePath, updatedContent} of results) {
        writeFile(path.join(outputPath, relativePath), updatedContent);
    }
} catch (error) {
    core.setFailed(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
}
