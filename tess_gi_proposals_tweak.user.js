// ==UserScript==
// @name        TESS GI Proposal Tweaks
// @namespace   astro.tess
// @match       https://heasarc.gsfc.nasa.gov/docs/tess/data/approved-programs/*/*.txt
// @noframes
// @grant       GM_addStyle
// @version     1.1
// @author      -
// @description
// @icon        https://heasarc.gsfc.nasa.gov/favicon.ico
// ==/UserScript==

function extractLinkInMd() {
  const proposalId = location.pathname.match(/^\/.+\/(.+)[.]txt/)[1];
  const bodyLines = document.querySelector('pre').textContent.split('\n');
  const title = bodyLines?.[2]?.replace(/^Title:\s*/, '');
  const summary = bodyLines?.[8];
  const mdText = `proposal [${proposalId}](${location.href}) : ${title}`;

  document.body.insertAdjacentHTML('beforeend',`
<div style="position: fixed; right: 6px; top: 6px; padding: 6px 6px; background-color: rgba(255, 255, 0, 0.6);">
  <input id="linkInMdOut" accessKey="L" title="Link to The proposal in markdown"
         onclick="this.select(); void(0);" />
  <br><br>
  <textarea id="linkInMdOutExtended" title="Link to The proposal in markdown, with summary"
            onclick="this.select(); void(0);"></textarea>
  <br>
  <a href="https://heasarc.gsfc.nasa.gov/docs/tess/approved-programs.html?term=${proposalId}">All Approved Programs</a>
</div>
`);
    document.getElementById('linkInMdOut').value = mdText;
    document.getElementById('linkInMdOutExtended').value = `${mdText}
> ${summary}`;
}
extractLinkInMd();
