/**
 * @description This function is called when the extension is activated.
 * @param {*} context
 */
function activate(context) {
  console.log('Auto-GitIgnore is now active!');
}

/**
 * @description This function is called when the extension is deactivated.
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
