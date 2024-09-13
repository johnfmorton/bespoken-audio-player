/**
 * name: bespoken-audio-player
 * version: v1.0.0
 * description: This is a templare repo that will create a Vite workflow to ease creation of Javascript modules with a dev server, GitHub Pages support and automated publishing to NPM.
 * author: John F. Morton <john@johnfmorton.com> (https://supergeekery.com)
 * repository: https://github.com/johnfmorton/bespoken-audio-player
 * build date: 2024-09-13T13:11:15.108Z 
 */
function init(message) {
  console.log(message);
  const messageOutputElement = document.getElementById("messageOutput");
  if (messageOutputElement) {
    messageOutputElement.innerHTML = message;
  }
}
const bespokenAudioPlayer = {
  init
};
export {
  bespokenAudioPlayer as default
};
