/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 571:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const core = __nccwpck_require__(571);
const fs = __nccwpck_require__(896);
const path = __nccwpck_require__(928);

try {
  const templatePath = core.getInput('template_path');
  const dataPath = core.getInput('data_path');
  const outputDir = core.getInput('output_dir');
  const mask = core.getInput('mask') || '*.json';

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
module.exports = __webpack_exports__;
/******/ })()
;