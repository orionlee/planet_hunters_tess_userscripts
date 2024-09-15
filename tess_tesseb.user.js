// ==UserScript==
// @name        TESS EB Tweak
// @namespace   Violentmonkey Scripts
// @match       https://tessebs.villanova.edu/*
// @noframes
// @grant       GM_addStyle
// @version     1.0
// @author      -
// @description 9/12/2024, 4:43:11 PM
// @icon
// ==/UserScript==

function tweakDetailPage() {
  if (!location.pathname.match(/\/\d+/)) {
    return;
  }

  // indicate in tab title if the object is an EB in TESS EB
  let titlePrefix = '(0)';
  if ('True' == document.querySelector('body > table:nth-of-type(2) td:nth-of-type(2)')?.textContent?.trim()) {
    // i.e., In catalog? is True
    titlePrefix = '(1)';
  }

  document.title = `${titlePrefix} ${document.title}`;
}
tweakDetailPage();

