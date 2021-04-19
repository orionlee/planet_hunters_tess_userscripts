// ==UserScript==
// @name        TESS - AAVSO VSX tweak
// @namespace   astro.tess
// @match       https://www.aavso.org/vsx/*
// @grant       GM_addStyle
// @noframes
// @version     1.1.1
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==


function fillAndSubmitSearchForm() {
  if (!location.href.startsWith('https://www.aavso.org/vsx/index.php?view=search.top')) {
    return;
  }

  function havePositionFormElements() {
    return document.querySelector('input[name="targetcenter"]');
  }

  function getCoordRequested() {
    const [, coordEncoded] = location.hash.match(/#coord=([^&]+)/) ||[null, null];
    if (coordEncoded) {
      return decodeURIComponent(coordEncoded);
    }

    // try to get the coord from sessionStorage  if not specified in hash
    const coordFromSession = sessionStorage['coord'];
    if (coordFromSession) {
      sessionStorage['coord'] = ''; // once retrieved, it should no longer be there.
    }

    return coordFromSession;
  }

  // Main logic

  const coord = getCoordRequested();

  if (!havePositionFormElements() && coord) {
    // Click More so that positional inputs will be available
    // store the coord temporarily so that  it can be used after the form submission
    sessionStorage['coord'] = coord;
    document.querySelector('input[value="More"]').click();
    return;
  }

  // Now fill the form with the coordinate and fire off the search
  document.querySelector('input[name="fieldsize"]').value = 2;                 // 2
  document.querySelector('select[name="fieldunit"]').value = 2;                // arc minutes
  document.querySelector('input[name="geometry"][value="r"]').checked = true;  // radius

  document.querySelector('select[name="order"]').value = 9; // order by angular sep.

  // fill the coordinate if it's supplied
  if (coord) {
    document.querySelector('input[name="targetcenter"]').value = coord;
    if (coord.indexOf(':') >= 0) {
      // case in hh:mm:ss format, i.e., Sexagesimal
      document.querySelector('input[name="format"][value="s"]').checked = true;
    }

    // auto submit to search
    document.querySelector('input[value="Search"]').click();
  }

}
fillAndSubmitSearchForm();


function tweakUIForMobile() {
  if (!/Android|iPhone|Mobile|Tablet/i.test(navigator.userAgent)) {
    // not mobile devices, NO-OP.
    return;
  }

  // else UA hints it's a mobile device
  document.head.insertAdjacentHTML('beforeend', '<meta name="viewport" content="width=device-width" />');
  document.documentElement.classList.add('mobile');

  // tried to use device with @media (max-width: 800px) { }, rather than UA check
  // but it does not work well, as VSX pages is done such that they can be wider than than viewport
  GM_addStyle(`
.mobile .forminput, .mobile .windowtitle, .mobile .formbutton,
.mobile .indexdata, .mobile p, .mobile td {
    font-size: 1.1em;
}

.mobile a[href^="javascript:"] > img, /* help button such as Variability Type in target details */
.mobile td.windowhelp img /* Various help buttons */
{
  /* make the buttons bigger so that they are easier to be tapped */
  height: 1.5em !important;
  width: 1.5em !important;
  padding-left: 10px;
  padding-right: 10px;
}
`);

  if (location.search.indexOf('view=help.vartype')) {
    // make help table's width wider
    const helpTable = document.querySelector('table.window');
    if (helpTable) {
      helpTable.width = '98%';  // up from a fixed 370(px)
    }
    GM_addStyle(`
    /* increase line spacing for help pages as the text are dense there */
    .mobile p, .mobile td, .mobile li {
      line-height: 1.2;
    }
    `);
  }

  // make footer wrap so that it doesn't make the viewport wider than the screen
  // (other elements can still make the viewport wider though)
  const footerEl = document.querySelector('.linkbar td.onelink')
  if (footerEl) { footerEl.removeAttribute("nowrap"); }

}
tweakUIForMobile();

function tweakSearchResult() {
  if (location.href.indexOf('/vsx/index.php?view=results.submit1') < 0) {
    return;
  }

  let resRows = Array.from(document.querySelectorAll('.content table:nth-of-type(2) tr:nth-of-type(4) tbody > tr'));
  resRows = resRows.slice(2, resRows.length - 1); // remove 2 header rows and 1 footer row
  const encodeJsLink = (text) => {
          // issue: the javascript link below doesn't work when the starType contains +, even though
          // the code has correctly encoded the + as %2B  by using encodeURIComponent.
          // To make it work with how browser interpret the string, the % in %2B needs to be further encoded
          // End result: + is encoded as %25%2B.
          return encodeURIComponent(text).replace(/%/g, '%25');
  };
  resRows.forEach(tr => {
    const typeTd = tr.querySelector('td:nth-of-type(7)');
    const starType = typeTd ? typeTd.textContent : null;
    if (starType) {
          // typeTd.innerHTML = `<a href="/vsx/index.php?abbrev=${starType}&view=help.vartype&nolayout=1">${starType}</a>`;
          typeTd.innerHTML = `<a href='javascript:window.open("index.php?abbrev=${encodeJsLink(starType)}&view=help.vartype&nolayout=1", "VarTypeHelp", "width=390,height=400")'>
  ${starType} <img style="vertical-align: -5px" src="_images/help.gif" width="15" height="15" border="0" align="absbottom" title="Get description for this type">
</a>`;
          // to make it really work, I probably need to recreate varTypeHelp function
          // (that exists in target detail page), so that encoding is done within the script
    }
  });
}
tweakSearchResult();








