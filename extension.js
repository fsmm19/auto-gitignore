const vscode = require('vscode');
const gitignoreApiListUrl =
  'https://www.toptal.com/developers/gitignore/api/list?format=json';

/**
 * @description This function is called when the extension is activated.
 * @param {*} context The context object provides information about the extension's environment.
 */
async function activate(context) {
  let templatesGitignore = {};

  try {
    const response = await fetch(gitignoreApiListUrl);
    templatesGitignore = await response.json();
  } catch (error) {
    console.error('Error fetching gitignore templates:', error);
  }

  const createEmptyDisposable = vscode.commands.registerCommand(
    'auto-gitignore.createEmptyGitIgnore',
    () => {
      createEmptyGitignore();
    }
  );

  const createWithPatternsDisposable = vscode.commands.registerCommand(
    'auto-gitignore.createGitignoreWithPatterns',
    async () => {
      await createGitignoreWithPatterns(templatesGitignore);
    }
  );

  const updateDisposable = vscode.commands.registerCommand(
    'auto-gitignore.updateGitIgnore',
    () => {
      updateGitignoreFile(templatesGitignore);
    }
  );

  context.subscriptions.push(createEmptyDisposable);
  context.subscriptions.push(createWithPatternsDisposable);
  context.subscriptions.push(updateDisposable);
}

/**
 * Merges the content of an existing `.gitignore` file with a template's content,
 * ensuring no duplicate rules are added. Adds a header indicating the template
 * name and the date of addition if new rules are appended.
 *
 * @param {string} existingContent - The current content of the `.gitignore` file.
 * @param {string} templateContent - The content of the template to merge.
 * @param {string} templateName - The name of the template being merged, used in the header.
 * @returns {string} - The updated `.gitignore` content with the merged rules, or the original content if no new rules are added.
 */
function mergeGitignoreContent(existingContent, templateContent, templateName) {
  const filterNonRules = (content) => {
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  };

  const existingRules = new Set(filterNonRules(existingContent));
  const templateLines = templateContent.split('\n');
  const newRules = [];

  for (const line of templateLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    } else if (!existingRules.has(trimmedLine)) {
      newRules.push(line);
    }
  }

  if (newRules.length > 0) {
    return `${existingContent.trim()}\n\n# ${templateName} (Added: ${
      new Date().toISOString().split('T')[0]
    })\n${newRules.join('\n')}\n`;
  } else {
    return existingContent;
  }
}

/**
 * Updates the .gitignore file in the current workspace by adding rules from a selected template.
 *
 * @param {Object} templatesGitignore - An object containing available .gitignore templates.
 *
 * @throws {Error} If an unexpected error occurs during the update process.
 */
function updateGitignoreFile(templatesGitignore) {
  try {
    const options = [];

    for (const template in templatesGitignore) {
      options.push(templatesGitignore[template].name);
    }

    options.sort((a, b) => a.localeCompare(b));

    vscode.window
      .showQuickPick(options, {
        placeHolder: 'Select a template to add to .gitignore',
      })
      .then(async (selectedOption) => {
        if (!selectedOption) {
          return;
        }

        const selectedTemplate = getGitignoreTemplate(
          templatesGitignore,
          selectedOption
        );

        if (!selectedTemplate) {
          vscode.window.showErrorMessage('Template not found.');
          return;
        }

        const uris = await vscode.workspace.findFiles('**/.gitignore');
        if (uris.length === 0) {
          vscode.window.showInformationMessage(
            'No .gitignore file found. Create one first.'
          );
          return;
        }

        const gitignoreUri = uris[0];
        const document = await vscode.workspace.openTextDocument(gitignoreUri);
        const existingContent = document.getText();
        const updatedContent = mergeGitignoreContent(
          existingContent,
          selectedTemplate.contents,
          selectedTemplate.name
        );

        if (updatedContent !== existingContent) {
          await writeGitignoreFile(gitignoreUri, updatedContent);
          vscode.window.showInformationMessage(
            `.gitignore updated with ${selectedTemplate.name} rules!`
          );
        } else {
          vscode.window.showInformationMessage(
            `No new rules to add from ${selectedTemplate.name} template.`
          );
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
async function createEmptyGitignore() {
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
 * Prompts the user to select a project type from a list of templates and returns the selected option.
 *
 * @param {Object} templatesGitignore - An object containing gitignore templates.
 * @returns {Promise<string|null>} A promise that resolves to the selected template name, or null if no selection is made.
 * @throws {Error} If an error occurs during the selection process, it is caught and an error message is displayed.
 */
async function selectProjectType(templatesGitignore) {
  try {
    const options = [];

    for (const template in templatesGitignore) {
      options.push(templatesGitignore[template].name);
    }

    options.sort((a, b) => a.localeCompare(b));

    const selectedOption = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select a template to add to .gitignore',
    });

    return selectedOption || null;
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error selecting project type: ${error.message}`
    );
    return null;
  }
}

/**
 * Retrieves a gitignore template object from a collection of templates based on the specified template name.
 *
 * @param {Object} templatesGitignore - An object containing gitignore templates, where each value is a template object.
 * @param {string} template - The name of the template to retrieve.
 * @returns {Object|undefined} The gitignore template object that matches the specified name, or undefined if not found.
 */
function getGitignoreTemplate(templatesGitignore, template) {
  return Object.values(templatesGitignore).find(
    (item) => item.name === template
  );
}

/**
 * Creates a '.gitignore' file in the current workspace folder based on the selected project type.
 * If a '.gitignore' file already exists, it notifies the user and does not overwrite it.
 *
 * @async
 * @function
 * @param {Object} templatesGitignore -  An object containing gitignore templates.
 * @throws {Error} If an error occurs during the creation of the '.gitignore' file.
 */
async function createGitignoreWithPatterns(templatesGitignore) {
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

      const template = await selectProjectType(templatesGitignore);

      if (!template) {
        return;
      }

      const rootUri = workspaceFolders[0].uri;
      const gitignoreFileUri = vscode.Uri.joinPath(rootUri, '.gitignore');
      const selectedTemplate = getGitignoreTemplate(
        templatesGitignore,
        template
      );

      writeGitignoreFile(
        gitignoreFileUri,
        defaultComment + selectedTemplate.contents
      );
      vscode.window.showInformationMessage(
        `.gitignore file created successfully for ${template} project!`
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
