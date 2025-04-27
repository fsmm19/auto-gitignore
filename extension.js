import('node-fetch');

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

function createGitignoreFile() {
  try {
    const defaultComment = `# Created by Auto-GitIgnore\n`;

    vscode.workspace.findFiles('**/.gitignore').then(async (uris) => {
      if (uris.length > 0) {
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
        const gitignoreUri = vscode.Uri.joinPath(rootUri, '.gitignore');
        const gitignoreContent = new TextEncoder().encode(defaultComment);

        await vscode.workspace.fs.writeFile(gitignoreUri, gitignoreContent);

        vscode.window.showTextDocument(
          await vscode.workspace.openTextDocument(gitignoreUri)
        );

        vscode.window.showInformationMessage(
          '.gitignore file created successfully!'
        );
      }
    });
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error creating .gitignore file: ${error.message}`
    );
  }
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
 * @description This function is called when the extension is deactivated.
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
