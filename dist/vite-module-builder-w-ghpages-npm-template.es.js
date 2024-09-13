/**
 * name: vite-module-builder-w-ghpages-npm-template
 * version: v1.0.0
 * description: This is a templare repo that will create a Vite workflow to ease creation of Javascript modules with a dev server, GitHub Pages support and automated publishing to NPM.
 * author: John F. Morton <john@johnfmorton.com> (https://supergeekery.com)
 * repository: https://github.com/johnfmorton/vite-module-builder-w-ghpages-npm-template
 * build date: 2024-09-13T13:03:19.585Z 
 */
function init(message) {
  console.log(message);
  const messageOutputElement = document.getElementById("messageOutput");
  if (messageOutputElement) {
    messageOutputElement.innerHTML = message;
  }
}
const viteModuleBuilderWGhpagesNpmTemplate = {
  init
};
export {
  viteModuleBuilderWGhpagesNpmTemplate as default
};
