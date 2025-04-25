const url = 'https://www.toptal.com/developers/gitignore/api/list?format=json';

/**
 * @description This function is called when the extension is activated.
 * @param {*} context The context object provides information about the extension's environment.
 */
function activate(context) {
  console.log('Auto-GitIgnore is now active!');

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Error fetching data from API');
      }
      return response.json();
    })
    .then((data) => console.log('Data fetched successfully:', data))
    .catch((error) => console.error('Error:', error));
}

/**
 * @description This function is called when the extension is deactivated.
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
