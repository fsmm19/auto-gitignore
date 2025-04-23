/**
 * @description This function is called when the extension is activated.
 * @param {*} context The context object provides information about the extension's environment.
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
