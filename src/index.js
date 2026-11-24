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

// Значения из json_data по ключу в нижнем регистре: плейсхолдеры ищутся без учёта регистра.
function parseValues(jsonData) {
    let data;
    try {
        data = JSON.parse(jsonData);
    } catch {
        // Сообщение парсера может содержать часть значений
        throw new Error('json_data is not a valid JSON');
    }
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('json_data must be an object');
    }

    const values = new Map();
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (values.has(lowerKey)) {
            throw new Error(`Duplicate key ${key} in json_data: keys are case-insensitive`);
        }
        if (value !== null && typeof value === 'object') {
            throw new Error(`Value of ${key} in json_data must be a string, number, boolean or null`);
        }
        values.set(lowerKey, String(value ?? ''));
    }
    return values;
}

try {
    let configsPath = core.getInput('configs_path');
    const configsMask = core.getInput('configs_mask') || '*.json';
    const jsonData = core.getInput('json_data');
    const isAllowUnresolved = core.getBooleanInput('is_allow_unresolved');
    let outputPath = core.getInput('output_path');

    if (configsPath.startsWith('./')) {
        configsPath = configsPath.slice(2);
    }
    if (outputPath.startsWith('./')) {
        outputPath = outputPath.slice(2);
    }

    const values = parseValues(jsonData);
    const maskRegExp = maskToRegExp(configsMask);
    // Плейсхолдеры без значения в json_data: «ключ in файл», только имена, без значений
    const unresolved = new Set();

    if (fs.statSync(configsPath).isDirectory()) {
        // Обходим подпапки, структура сохраняется в output_path
        processDirectory(configsPath, '');
    } else {
        // Single file mode
        const fileName = path.basename(configsPath);
        if (!maskRegExp.test(fileName)) {
            console.log(`🟡 Skipped file: ${configsPath} (does not match mask: ${configsMask})`);
        } else {
            processFile(configsPath, fileName);
        }
    }

    if (unresolved.size > 0) {
        const message = `Unresolved placeholders: ${[...unresolved].join(', ')}`;
        if (!isAllowUnresolved) {
            throw new Error(message);
        }
        console.log(`🟡 ${message}`);
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
        // В *.json значение экранируется как содержимое строки: " \ и переводы строк не ломают JSON
        const isJson = /\.json$/i.test(filePath);

        const updatedContent = fileContent.replace(/\$\{\{(.*?)\}\}/g, (match, key) => {
            const value = values.get(key.trim().toLowerCase());
            if (value === undefined) {
                unresolved.add(`${key.trim()} in ${relativePath}`);
                return match;
            }
            return isJson ? JSON.stringify(value).slice(1, -1) : value;
        });

        const outputFilePath = path.join(outputPath, relativePath);
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
