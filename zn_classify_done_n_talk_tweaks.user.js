// ==UserScript==
// @name        Zooniverse Classify Done n Talk Tweaks
// @namespace   zooniverse
// @match       https://www.zooniverse.org/projects/*/*/classify
// @grant       none
// @noframes
// @version     1.0.0
// @author      -
// @description
// @icon        https://www.zooniverse.org/favicon.ico
// ==/UserScript==

function openNewBackgroundTab(url){
  var a = document.createElement("a");
  a.href = url;
  var evt = document.createEvent("MouseEvents");
  //the tenth parameter of initMouseEvent sets ctrl key
  evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0,
                     true, false, false, false, 0, null);
  a.dispatchEvent(evt);
}

function spawnNewClassifyPage() {
  const classifyUrl = location.href.replace(/\/talk\/.+/, '/classify');
  openNewBackgroundTab(classifyUrl);
  return true;
}

function spawnNewClassifyPageOnDoneNTalk(evt) {
  // different projects use slightly different text in 'Done & Talk' button:
  // - Planet Hunter TESS: done & talk
  // - Gravity Spy: Done & Talk
  // normalize them with lower case
  if (evt.target.textContent.toLowerCase() === 'done & talk' &&
      !evt.shiftKey) { // ignore cases when shift is pressed.
    return spawnNewClassifyPage();
  } else {
    return false; // still let the default click event fired
  }
} // function spawnNewClassifyPageOnDoneNTalk(..)

// intercept click
window.addEventListener('click', spawnNewClassifyPageOnDoneNTalk);





