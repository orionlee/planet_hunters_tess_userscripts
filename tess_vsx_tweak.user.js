// ==UserScript==
// @name        TESS - AAVSO VSX tweak
// @namespace   astro.tess
// @match       https://www.aavso.org/vsx/*
// @grant       GM_addStyle
// @noframes
// @version     1.4.1
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

//
// Search Form
//

function fillAndSubmitSearchForm() {
  if (!location.href.startsWith('https://www.aavso.org/vsx/index.php?view=search.top')) {
    return;
  }

  function havePositionFormElements() {
    return document.querySelector('input[name="targetcenter"]');
  }

  function getCoordRequested() {
    const [, coordEncoded] = location.hash.match(/#coord=([^&#]+)/) ||[null, null];
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

  // Pre main logic: save the submitted aliases if any
  // (they are to be used by search result page)
  if (location.hash != "") {
    sessionStorage["_hash"] = location.hash;
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

// Copied from  tess_simbad_tweak.user.js
// BEGIN generic cross match helpers / UI
//

function getMatchingInfoFromHash(aliasFilter = null) {
  const aliasesMatch = location.hash.match(/aliases=([^&]+)/);
  if (!aliasesMatch) {
    return [null, null];
  }

  if (!aliasFilter) {
    aliasFilter = (alias) => true;
  }

  const aliases = decodeURIComponent(aliasesMatch[1]);
  // Now try to highlight the IDS in the result
  const aliasList = aliases.split(',').filter(aliasFilter);

  const otherParamsMatch = location.hash.match(/other_params=([^&]+)/);
  let otherParams = otherParamsMatch ? decodeURIComponent(otherParamsMatch[1]) : '';
  otherParams = annotateOtherParams(otherParams);
  return [aliasList, otherParams];
}

// reset the hash, so that if an user copies the URL, the user won't copy the extra parameters in the hash
// (that would be useless in general)
// use pushState() rather than location.hash = '' so that
// 1) there is no extra hash in the URL
// 2) if there is a need, users could still get the hash back by going back.
function resetMatchingInfoHash() {
  history.pushState("", document.title, location.pathname + location.search);
}

function annotateOtherParams(otherParams) {
  let res = otherParams;

  // convert it to parallax in mas
  // (easier to compare with the value in SIMBAD single result details page)
  const distanceInPc = parseFloat((res.match(/Distance\(pc\):\s*([0-9.]+)/) || ['', '0'])[1]);
  if (distanceInPc > 0) {
    const parallaxInMas = 1000 / distanceInPc;
    res = res.replace(/Distance\(pc\):[^;]+;/, `$& Parallax(mas): ${parallaxInMas.toFixed(4)} ; `);
  }

  // convert apparent magnitude to absolute one
  // (just the first one)
  const magMatch = otherParams.match(/Magnitudes:\s([^-]+-)([0-9.]+)/);
  if (magMatch && distanceInPc > 0) {
    const magBand = magMatch[1];
    const magApparent = parseFloat(magMatch[2]);
    const magAbsolute = magApparent - 5 * Math.log10(distanceInPc / 10);
    res = res.replace(/Magnitudes:[^;]+;/,  `$& Abs. magnitude: ${magBand}${magAbsolute.toFixed(2)} ; `);
  }
  return res;
}

function showMatchingInfo(aliases, otherParams) {
  document.body.insertAdjacentHTML('beforeend', `\
  <div id="tessAliasesCtr" style="background-color:rgba(255,255,0,0.9);
    position: fixed; top: 0px; right: 0px; padding: 0.5em 4ch 0.5em 2ch;
  max-width: 15vw;
  z-index: 99; font-size: 90%;
    ">
  <u>TESS Aliases:</u> <a href="javascript:void(0);" onclick="this.parentElement.style.display='none';" style="float: right;">[X]</a><br>
  <span id="tessAliases">${aliases}</span>
  <div id="tessAliasesMatchMsg" style="font-weight: bold;"></div>
  <span id="tessOtherParams">${otherParams}</span>
  </div>`);
}

//
// END generic cross match helpers / UI


//
// Search Result
//

function getSearchResultRows() {
  let resRows = Array.from(document.querySelectorAll('.content table:nth-of-type(2) tr:nth-of-type(4) tbody > tr'));

  // remove 2 header rows and 1 footer row
  resRows =  resRows.slice(2, resRows.length - 1);

  if (resRows.length == 1 && resRows[0].querySelectorAll('td').length < 2) {
    // case only 1 row, and the row is just for the text
    // "There were no records that matched the search criteria.""
    resRows = [];
  }

  return resRows;
}

function tweakSearchResultBasedOnHash() {
  try {
    // the hash comes from VSX search generated from ExoFOP tweak, containing infos
    // such as IDs, for matches.
    const hashFromSearchForm = sessionStorage["_hash"];
    if (!hashFromSearchForm) {
      return;
    }
    console.debug("Processing hash: ", hashFromSearchForm);
    getSearchResultRows().forEach(tr => {
      const oidLinkEl = tr.querySelector('a');
      oidLinkEl.href = oidLinkEl + hashFromSearchForm;
    });
  } finally {
    sessionStorage["_hash"] = "";
  }
}

function tweakSearchResult() {
  if (location.href.indexOf('/vsx/index.php?view=results.submit1') < 0) {
    return;
  }

  const resRows = getSearchResultRows();

  // Add link to variable type helper
  //
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

  // expose the URL of 1st match in a text field so that it can be copied easily
  //
  if (resRows.length > 0) {
    const oidUrl = resRows[0].querySelector('a');
    document.querySelector('td.datasheethead').insertAdjacentHTML('beforeend', `\
<input id="urlOf1stMatch" type="text" accesskey="L" title="URL of 1st match" value="${oidUrl}">
    `);
  }

  tweakSearchResultBasedOnHash();
}
tweakSearchResult();


//
// VSX Entry Detail Page
//


function tweakDetailPage() {
  if (location.href.indexOf('/vsx/index.php?view=detail.top&oid=') < 0) {
    return;
  }

  function getVSXName() {
    return document.querySelector('table.datasheet table tr:nth-of-type(1) td:nth-of-type(2)').textContent.trim();
  }

  function getOid() {
    const [_, oid] = location.search.match(/oid=(\d+)/) || [null, null];
    return oid;
  }

  function getOtherNamesCtr() {
    let idCtr = document.querySelector('a[href^="index.php?view=addname.top&"]')?.parentElement;
    if (idCtr) {
      return idCtr;
    }
    // if user is not logged in, idCtr will still be null
    idCtr = document.querySelector('table.datasheet table tr:nth-of-type(8) td:nth-of-type(2)');
    if (idCtr) {
      if (idCtr.textContent?.indexOf("Add name") >= 0) {
        return idCtr;
      } else {
        console.warn("The container for other names matched is not the correct one. ", idCtr);
        return null;
      }
    }
    // cannot find the container at all
    return null;
  }

  function showMatchResultMsg(aliasesMatched, aliasesNotMatched) {

    const ctr = document.querySelector('#tessAliasesMatchMsg');
    ctr.innerHTML = `
${aliasesMatched.length} (aliases) matched.<br>
Not matched:<br>
<input id="notMatchedNamesForVSXSubmission" type="text" style="font-size: 80%; width: 90%;"
       title="Names not matched in a form suitable for batch submission to VSX">
`;
    // in tab-delimited form for pasting to spreadsheet
    const submissionText = (() => {
      if (aliasesNotMatched.length < 1) {
        return "";
      }
      return `\
${getVSXName()}\t${aliasesNotMatched.join()}\t${getOid()}`;
    })();

    const submissionInCtl = document.getElementById('notMatchedNamesForVSXSubmission');
    if (submissionText) {
      submissionInCtl.value = submissionText;
    } else {
      submissionInCtl.disabled = true;
    }
  }

  function doMatchIds(aliasList) {
    GM_addStyle(`
.cross_matched::before {
  content: "> ";
}
.cross_matched {
  font-weight: bold;
}
`);

    const idCtr = getOtherNamesCtr();
    if (!idCtr) {
      console.warn("doMatchIds(): Cannot find the element for IDs (Other names in UI). No-op");
      return;
    }
    const [aliasesMatched, aliasesNotMatchedSet] = [[], new Set(aliasList)];

    Array.from(idCtr.querySelectorAll('td')).forEach(td => {
      const id = td.textContent.trim();
      if (id.startsWith('Please note')) {
        // edge case not a real ID, but the text
        // Please note that aliases shown in grey link to obsolete records.
        // ignore it.
        return;
      }
      if (aliasList.includes(id)) {
        aliasesMatched.push(id);
        td.classList.add("cross_matched");
        aliasesNotMatchedSet.delete(id);
      }
    });

    showMatchResultMsg(aliasesMatched, Array.from(aliasesNotMatchedSet));
  }


  // Tweak to facilitate matching: matching IDs given (from ExoFOP), show
  // other helpful info such as magnitude (on ExoFOP).
  // The logic is similar to those on SIMBAD script

  function aliasFilter(alias) {
    // filter out aliases that won't be present in VSX based on communication with VSX moderators.
    if (alias.match(/^(APASS|Gaia DR2)/)) {
      return false;
    }
    return true;
  }

  const [aliasList, otherParams] = getMatchingInfoFromHash(aliasFilter);
  if (!aliasList) {
    return;
  }

  showMatchingInfo(aliasList, otherParams);
  doMatchIds(aliasList);

  resetMatchingInfoHash();
}

tweakDetailPage();
