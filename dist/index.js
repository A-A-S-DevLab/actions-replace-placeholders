/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 571:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 480:
/***/ ((module) => {

module.exports = eval("require")("glob");


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
const glob = __nccwpck_require__(480);  // Import the glob package

try {
    const templatePath = core.getInput('template_path');  // Path to the template (either file or folder)
    const dataPath = core.getInput('data_path');  // Path to the JSON data file
    const outputDir = core.getInput('output_dir') || '.';  // Directory to save modified files
    const mask = core.getInput('mask') || '**/*.json';  // Mask to filter files (default is '*.json')

    // Read the data (values to replace placeholders in template files)
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Check if templatePath is a file or directory
    const isDirectory = fs.lstatSync(templatePath).isDirectory();

    // If templatePath is a directory, process files using the mask
    if (isDirectory) {
        // Use glob to find all files matching the mask in the directory
        const files = glob.sync(mask, { cwd: templatePath });

        files.forEach(file => {
            const filePath = path.join(templatePath, file);
            processFile(filePath, file);
        });
    } else {
        // If templatePath is a single file, process just that file
        processFile(templatePath, path.basename(templatePath));
    }

    function processFile(filePath, fileName) {
        // Read the content of the file
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Replace placeholders with data from the JSON file
        const updatedContent = fileContent.replace(/\$\{\{(.*?)\}\}/g, (match, key) => {
            const value = data[key.trim()];
            return value !== undefined ? value : match;
        });

        // Determine the output file path (using the original file name)
        const outputFilePath = path.join(outputDir, fileName);

        // Ensure the output directory exists
        const outputDirPath = path.dirname(outputFilePath);
        if (!fs.existsSync(outputDirPath)) {
            fs.mkdirSync(outputDirPath, { recursive: true });
            console.log(`📁 Created directory: ${outputDirPath}`);
        }

        // Write the updated content to the output file
        fs.writeFileSync(outputFilePath, updatedContent);
        console.log(`✅ Placeholders replaced in: ${fileName}`);
    }

} catch (error) {
    core.setFailed(`❌ Error: ${error.message}`);
}
module.exports = __webpack_exports__;
/******/ })()
;