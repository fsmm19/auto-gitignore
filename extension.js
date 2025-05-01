const vscode = require('vscode');
const gitignoreApiListUrl =
  'https://www.toptal.com/developers/gitignore/api/list?format=json';

/**
 * @description This function is called when the extension is activated.
 * @param {*} context The context object provides information about the extension's environment.
 */
function activate(context) {
  let templatesGitignore = {};

  console.log('Auto-GitIgnore is now active!');

  fetch(gitignoreApiListUrl)
    .then((response) => response.json())
    .then((data) => (templatesGitignore = JSON.parse(JSON.stringify(data))))
    .catch((error) =>
      console.error('Error fetching gitignore templates:', error)
    );

  const createDisposable = vscode.commands.registerCommand(
    'auto-gitignore.createGitIgnore',
    () => {
      createGitignoreFile();
    }
  );

  const updateDisposable = vscode.commands.registerCommand(
    'auto-gitignore.updateGitIgnore',
    () => {
      updateGitignoreFile(templatesGitignore);
    }
  );

  context.subscriptions.push(createDisposable);
  context.subscriptions.push(updateDisposable);
}

function updateGitignoreFile(templatesGitignore) {
  try {
    const options = [];

    for (const template in templatesGitignore) {
      options.push(templatesGitignore[template].name);
    }

    console.log(templatesGitignore);

    vscode.window
      .showQuickPick(options, {
        placeHolder: 'Select a template to add to .gitignore',
      })
      .then((selectedOption) => {
        if (!selectedOption) {
          return; // User canceled the selection
        } else {
        }
      });
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error updating .gitignore file: ${error.message}`
    );
  }
}

/**
 * Checks if a '.gitignore' file exists in the current workspace.
 *
 * @async
 * @function
 * @returns {Promise<boolean>} A promise that resolves to 'true' if a '.gitignore' file is found, otherwise 'false'.
 */
async function gitignoreExists() {
  const uris = await vscode.workspace.findFiles('**/.gitignore');
  return uris.length > 0;
}

/**
 * Writes content to a .gitignore file at the specified URI, opens the file in the editor,
 * and handles any errors that occur during the process.
 *
 * @param {vscode.Uri} uri - The URI of the .gitignore file to be written.
 * @param {string} content - The content to be written to the .gitignore file.
 * @returns {Promise<void>} A promise that resolves when the file is written and opened successfully.
 * @throws Will display an error message if writing the file or opening it fails.
 */
async function writeGitignoreFile(uri, content) {
  try {
    const gitignoreContent = new TextEncoder().encode(content);
    await vscode.workspace.fs.writeFile(uri, gitignoreContent);

    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error writing .gitignore file: ${error.message}`
    );
  }
}

/**
 * Asynchronously creates a '.gitignore' file in the root of the current workspace.
 * If a '.gitignore' file already exists, it displays an informational message.
 * If no workspace is open, it displays an error message.
 *
 * The '.gitignore' file is initialized with a default comment.
 *
 * @async
 * @function
 * @throws {Error} If an unexpected error occurs during the file creation process.
 */
async function createGitignoreFile() {
  try {
    const defaultComment = `# Created by Auto-GitIgnore\n`;

    if (await gitignoreExists()) {
      vscode.window.showInformationMessage('.gitignore file already exists!');
    } else {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (!workspaceFolders) {
        vscode.window.showErrorMessage(
          'No workspace folder found. Please open a folder to create a .gitignore file.'
        );
        return;
      }

      const rootUri = workspaceFolders[0].uri;
      const gitignoreFileUri = vscode.Uri.joinPath(rootUri, '.gitignore');

      writeGitignoreFile(gitignoreFileUri, defaultComment);
      vscode.window.showInformationMessage(
        '.gitignore file created successfully!'
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error creating .gitignore file: ${error.message}`
    );
  }
}

/**
 * @description This function is called when the extension is deactivated.
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
