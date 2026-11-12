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

try {
  let templatePath = core.getInput('template_path');
  let dataPath = core.getInput('data_path');
  let outputDir = core.getInput('output_dir');
  const mask = core.getInput('mask') || '*.json';

  if (templatePath.startsWith('./'))
  {
    templatePath = templatePath.slice(2);
  }
  if (dataPath.startsWith('./'))
  {
    dataPath = dataPath.slice(2);
  }
  if (outputDir.startsWith('./'))
  {
    outputDir = outputDir.slice(2);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
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
    fs.readdirSync(dirPath, { withFileTypes: true }).forEach(entry => {
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
      const value = data[key.trim()];
      return value !== undefined ? value : match;
    });

    const outputFilePath = path.join(outputDir, relativePath);
    const outputDirPath = path.dirname(outputFilePath);

    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
      console.log(`📁 Created directory: ${outputDirPath}`);
    }

    fs.writeFileSync(outputFilePath, updatedContent);
    console.log(`✅ Updated: ${relativePath}`);
  }

} catch (error) {
  core.setFailed(`❌ Error: ${error.message}`);
}
