// ==UserScript==
// @name        Web TESS Viewing Tool tweak
// @namespace   astro.tess
// @match       https://heasarc.gsfc.nasa.gov/cgi-bin/tess/webtess/wtv.py
// @grant       none
// @version     1.0
// @author      -
// @icon        https://heasarc.gsfc.nasa.gov/docs/tess/images/favicon.png
// @description
// ==/UserScript==

const statusEl = document.querySelector('pre');
statusEl.textContent = statusEl.textContent.split('\n').filter(txt => txt.indexOf('not observed') < 0).join('\n');
