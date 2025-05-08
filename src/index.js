const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

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

  const isDirectory = fs.lstatSync(templatePath).isDirectory();
  const maskSuffix = mask.replace('*', '').toLowerCase(); // e.g., '.txt' from '*.txt'

  if (isDirectory) {
    const files = fs.readdirSync(templatePath);
    files.forEach(file => {
      if (file.toLowerCase().endsWith(maskSuffix)) {
        const filePath = path.join(templatePath, file);
        processFile(filePath, file);
      }
    });
  } else {
    // Single file mode
    if (!templatePath.toLowerCase().endsWith(maskSuffix)) {
      console.log(`🟡 Skipped file: ${templatePath} (does not match mask: ${mask})`);
    } else {
      processFile(templatePath, path.basename(templatePath));
    }
  }

  function processFile(filePath, fileName) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const updatedContent = fileContent.replace(/\$\{\{(.*?)\}\}/g, (match, key) => {
      const value = data[key.trim()];
      return value !== undefined ? value : match;
    });

    const outputFilePath = path.join(outputDir, fileName);
    const outputDirPath = path.dirname(outputFilePath);

    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
      console.log(`📁 Created directory: ${outputDirPath}`);
    }

    fs.writeFileSync(outputFilePath, updatedContent);
    console.log(`✅ Updated: ${fileName}`);
  }

} catch (error) {
  core.setFailed(`❌ Error: ${error.message}`);
}