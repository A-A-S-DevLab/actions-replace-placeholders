const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

// Маска имени файла: '*' — любые символы, '?' — один символ; без учёта регистра.
function maskToRegExp(mask) {
    const pattern = mask
        .split('')
        .map(ch => (ch === '*' ? '.*' : ch === '?' ? '.' : ch.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
        .join('');
    return new RegExp(`^${pattern}$`, 'i');
}

// Значения из json по ключу в нижнем регистре: плейсхолдеры ищутся без учёта регистра.
function parseValues(json) {
    let data;
    try {
        data = JSON.parse(json);
    } catch {
        // Сообщение парсера может содержать часть значений
        throw new Error('json is not a valid JSON');
    }
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('json must be an object');
    }

    const values = new Map();
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (values.has(lowerKey)) {
            throw new Error(`Duplicate key ${key} in json: keys are case-insensitive`);
        }
        if (value !== null && typeof value === 'object') {
            throw new Error(`Value of ${key} in json must be a string, number, boolean or null`);
        }
        values.set(lowerKey, String(value ?? ''));
    }
    return values;
}

try {
    let templatePath = core.getInput('template_path');
    const json = core.getInput('json');
    let outputDir = core.getInput('output_dir');
    const mask = core.getInput('mask') || '*.json';

    if (templatePath.startsWith('./')) {
        templatePath = templatePath.slice(2);
    }
    if (outputDir.startsWith('./')) {
        outputDir = outputDir.slice(2);
    }

    const values = parseValues(json);
    const maskRegExp = maskToRegExp(mask);

    if (fs.statSync(templatePath).isDirectory()) {
        // Обходим подпапки, структура сохраняется в output_dir
        processDirectory(templatePath, '');
    } else {
        // Single file mode
        const fileName = path.basename(templatePath);
        if (!maskRegExp.test(fileName)) {
            console.log(`🟡 Skipped file: ${templatePath} (does not match mask: ${mask})`);
        } else {
            processFile(templatePath, fileName);
        }
    }

    function processDirectory(dirPath, relativeDir) {
        fs.readdirSync(dirPath, {withFileTypes: true}).forEach(entry => {
            const entryPath = path.join(dirPath, entry.name);
            const relativePath = path.join(relativeDir, entry.name);
            if (entry.isDirectory()) {
                processDirectory(entryPath, relativePath);
            } else if (entry.isFile() && maskRegExp.test(entry.name)) {
                processFile(entryPath, relativePath);
            }
        });
    }

    function processFile(filePath, relativePath) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const updatedContent = fileContent.replace(/\$\{\{(.*?)\}\}/g, (match, key) => {
            const value = values.get(key.trim().toLowerCase());
            return value !== undefined ? value : match;
        });

        const outputFilePath = path.join(outputDir, relativePath);
        const outputDirPath = path.dirname(outputFilePath);

        if (!fs.existsSync(outputDirPath)) {
            fs.mkdirSync(outputDirPath, {recursive: true});
            console.log(`📁 Created directory: ${outputDirPath}`);
        }

        fs.writeFileSync(outputFilePath, updatedContent);
        console.log(`✅ Updated: ${relativePath}`);
    }

} catch (error) {
    core.setFailed(`❌ Error: ${error.message}`);
}
