// ==UserScript==
// @name        TESS - AAVSO VSX tweak
// @namespace   astro.tess
// @match       https://vsx.aavso.org/*
// @match       https://www.aavso.org/vsx/*
// @grant       GM_addStyle
// @noframes
// @version     1.13.4
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

//
// Search Form
//

function doDecodeURIComponent(val) {
  // In some cases, value supplied are also encoded
  // with the form of mapping space to plus sign
  // (e.g., if it's processed by Chrome' site search)
  return decodeURIComponent(val.replaceAll('+', ' '));
}


function fillAndSubmitSearchForm() {
  if (
    !location.href.startsWith('https://vsx.aavso.org/index.php?view=search.top') &&
    !location.href.startsWith('https://www.aavso.org/vsx/index.php?view=search.top')
  ) {
    return;
  }

  function havePositionFormElements() {
    return document.querySelector('input[name="targetcenter"]');
  }

  function getCoordRequested() {
    const [, coordEncoded] = location.hash.match(/#coord=([^&#]+)/) ||[null, null];
    if (coordEncoded) {
      return doDecodeURIComponent(coordEncoded);
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
  // fill the coordinate if it's supplied
  if (coord) {
    document.querySelector('input[name="targetcenter"]').value = coord;
    if (coord.indexOf(':') >= 0) {
      // case in hh:mm:ss format, i.e., Sexagesimal
      document.querySelector('input[name="format"][value="s"]').checked = true;
    }

    document.querySelector('input[name="fieldsize"]').value = 120;                 // 2
    document.querySelector('select[name="fieldunit"]').value = 3;                // arc seconds
    document.querySelector('input[name="geometry"][value="r"]').checked = true;  // radius

    document.querySelector('select[name="order"]').value = 9; // order by angular sep.

    // clear out existing name in the form, if any (due to users' having used it)
    document.querySelector('input[name="ident"]').value = "";

    // auto submit to search
    document.querySelector('input[value="Search"]').click();
    return;
  }  // if (coord) {

  //
  // Case it is not a coordinate search from hash
  // See if it's a search by name from hash
  //
  const [, nameEncoded] = location.hash.match(/#name=([^&#]+)/) ||[null, null];
  if (nameEncoded) {
    const name = doDecodeURIComponent(nameEncoded);

    document.querySelector('input[name="ident"]').value = name;

    // clear out existing position in the form, if any (due to users' having used it)
    if (document.querySelector('input[name="targetcenter"]')) {
      document.querySelector('input[name="targetcenter"]').value = '';
    }

      document.querySelector('select[name="order"]').value = 2; // order by Alphanumeric

    // auto submit to search
    document.querySelector('input[value="Search"]').click();
    return;
  }  // if (nameEncoded) {

}
fillAndSubmitSearchForm();


// The tweaks above make the search form
// not as friendly for interactive use when searching by name.
// This is to compensate it.
function tweakSearchFormForInteractiveUse() {
  function safeSetFormValue(inputSelector, value) {
    const inputEl = document.querySelector(inputSelector);
    if (!inputEl) {
      console.warn(`tweakSearchFormForInteractiveUse(): cannot find input of selector ${inputSelector}. Its value is not set`);
      return false;
    }
    inputEl.value = value;
    return true;
  }

  const nameEl = document.querySelector('input[name="ident"]');
  if (!nameEl) {
    console.warn('tweakSearchFormForInteractiveUse(): Name <input> not found. No-op');
  } else {
    nameEl.onchange = (_evt) => {
      if (nameEl.value === '' ) {
        return;
      }
      safeSetFormValue('input[name="targetcenter"]', '');
      safeSetFormValue('select[name="order"]', '2'); // alphanumeric sort
    };
  }

  const posEl = document.querySelector('input[name="targetcenter"]');
  if (!posEl) {
    // position input is not present in simple form
    console.debug('tweakSearchFormForInteractiveUse(): Position <input> not found. No-op');
  } else {
    posEl.onchange = (_evt) => {
      if (posEl.value === '' ) {
        return;
      }
      safeSetFormValue('input[name="ident"]', '');
      safeSetFormValue('select[name="order"]', '9'); // angular sep
    };
  }
}
tweakSearchFormForInteractiveUse();


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
    // eslint-disable-next-line no-unused-vars
    aliasFilter = (alias) => true;
  }

  const aliasesStr = decodeURIComponent(aliasesMatch[1]);
  // Now try to highlight the IDS in the result
  const aliasList = aliasesStr.split(',').filter(aliasFilter);

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
  z-index: 99; font-size: 14px; line-height: 1.2;
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

  // the list of <tr> have some header rows and footer row (at least 2 header and 1 footer)
  // but if the list is long, header rows would repeat.
  // The test `td.indexdata` would ensure we only get the actual data rows
  resRows = resRows.filter(tr => tr.querySelector('td.indexdata') != null);

  // Filter out the error message "There were no records that matched the search criteria."
  // (a row with a single <td>)
  resRows = resRows.filter(tr => tr.querySelectorAll('td').length > 1);

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
    getSearchResultRows().forEach((tr, i) => {
      const oidLinkEl = tr.querySelector('a');
      if (oidLinkEl) {
        oidLinkEl.href = oidLinkEl + hashFromSearchForm;
      } else {
        // should never happen, but just in case.
        console.warn(`oid link hash tweak: cannot find link for row ${i+1}. No-op.`);
      }
    });
  } finally {
    sessionStorage["_hash"] = "";
  }
}

function tweakSearchResult() {
  // It used to be /vsx/index.php?view=results.submit1
  // it's changed to /vsx/index.php?view=results.submit2
  // So a more general pattern is used
  // 2025 Mar: removed /vsx to handle the new vsx.aavso.org/ and legacy www.aavso.org/
  if (location.href.indexOf('/index.php?view=results.submit') < 0) {
    return;
  }

  const resRows = getSearchResultRows();

  // indicate num entries found. 0 would be helpful to ignore the result without opening the tab
  document.title = `(${resRows.length}) - ${document.title}`;
  if (resRows.length > 0) {
    // indicate the angular distance of the first match as well.
    const angDist1stMatch = parseInt(resRows[0].querySelector('td').textContent.trim());
    document.title = `${angDist1stMatch}" ` + document.title;
  }

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
          typeTd.innerHTML = `<a href='javascript:window.open("index.php?abbrev=${encodeJsLink(starType)}&view=help.vartype&nolayout=1", "VarTypeHelp", "width=390,height=400")'>
  ${starType} <img style="vertical-align: -5px" src="_images/help.gif" width="15" height="15" border="0" align="absbottom" title="Get description for this type">
</a>`;
          // to make it really work, I probably need to recreate varTypeHelp function
          // (that exists in target detail page), so that encoding is done within the script
    }

    // add shortcuts to search result as Alt-1, Alt-2, etc.
    resRows.forEach((tr, i) => {
      const el = tr.querySelector('.desig a');
      if (el) {
        el.accessKey = i + 1;
      } else {
        // should never happen, but just in case
        console.warn(`accesskey assignment: cannot find object detail link for row ${i+1}. No-op`);
      }
    });

    // the third column is to the link of the object,
    // if the search is sorted by angular distance from coordinate
    // otherwise, link is in the second column. the logic here won't find it
    // , which is fine, because the intention is to add angular distance to the link to begin with.
    const objectLinkEl = tr.querySelector('td:nth-of-type(3) a');
    if (objectLinkEl) {
      const distance = tr.querySelector('td:nth-of-type(1)').textContent.trim();
      objectLinkEl.setAttribute('href',
        objectLinkEl.getAttribute('href') + `#distance_from_coord=${distance}`
        );
    }
  });

  // expose the URL of 1st match in a text field so that it can be copied easily
  //
  if (resRows.length > 0) {
    const oidUrl = resRows[0].querySelector('a');
    document.querySelector('td.datasheethead').insertAdjacentHTML('beforeend', `\
<input id="urlOf1stMatch" type="text" accesskey="L" title="URL of 1st match" value="${oidUrl}"
       onclick="this.select();" readonly>
    `);
  }

  tweakSearchResultBasedOnHash();

  // auto click the first result if only 1 is found
  // need to be done last so that all processing to the result link has been completed.
  if (resRows.length == 1) {
    resRows[0].querySelector('td:nth-of-type(3) a')?.click();
  }
}
tweakSearchResult();


//
// VSX Entry Detail Page
//


function tweakDetailPage() {
  if (location.href.indexOf('/index.php?view=detail.top&oid=') < 0) {
    return;
  }


  function getVSXCoord() {
    // get coordinate of the target in the detail sheet
    const searchNearbyEl = document.querySelector('td > a[href^="index.php?view=results.nearby&oid="]');
    const coordEl = searchNearbyEl?.parentElement?.previousElementSibling;
    if (!coordEl) {
      console.warn('getTargetCoord(): cannot find Coordinate Value DOM. Return null');
      return [null, null];
    }
    const [_, ra, dec] = coordEl.textContent.match(/[(]([0-9.]+)\s+([-+0-9.]+)[)]/) || [null, null, null];
    return [ra, dec];
  }


  function getVSXName(returnCtr=false) {
    const ctr = document.querySelector('table.datasheet table tr:nth-of-type(1) td:nth-of-type(2) table td')
    const id = ctr.textContent.trim();
    if (returnCtr) {
      return [id, ctr];
    } else {
      return id;
    }
  }

  function getOid() {
    const [, oid] = location.search.match(/oid=(\d+)/) || [null, null];
    return oid;
  }

  function getOtherNamesCtr() {
    const idCtr = document.querySelector('a[href^="index.php?view=addname.top&"]')?.parentElement;
    if (idCtr) {
      return idCtr;
    }

    // if user is not logged in, idCtr will still be null
    // we loop through entire data table to find the container
    // (its actual row varies slightly from one page to another, so we have to loop)
    const idCtrMatches =
      Array.from(document.querySelectorAll('table.datasheet table tr td:nth-of-type(2)'))
        .filter(td => td.textContent?.indexOf("Add name") >= 0);
    return idCtrMatches?.[0];
  }

  function moveNotUsefulAliasToEnd(aliases) {
    // In practice, UCAC / SDSS is rarely cross-matched successfully in SIMBAD and ultimately removed;
    // Gaia DR3 is only used if the target is in Gaia DR3 Variable.
    // Move them to the end
    const aliasesWithSortKey = aliases.map((a, i) => {
      let sortKey = a.match(/^UCAC|SDSS/) ? 998 : i;
      if (a.match(/^Gaia DR3/)) {
        sortKey = 999;
      }
      a._sortKey = sortKey;
      return [a, sortKey];
    });
    aliasesWithSortKey.sort((a, b) => a[1] - b[1]);
    return aliasesWithSortKey.map(e => e[0])
  }

  function showMatchResultMsg(aliasesMatched, aliasesNotMatched, extraNamesToShow) {

    const ctr = document.querySelector('#tessAliasesMatchMsg');
    ctr.innerHTML = `
${aliasesMatched.length} (aliases) matched.<br>
Not matched:<br>
<input id="notMatchedNamesForVSXSubmission" type="text" style="font-size: 80%; width: 90%;"
       accessKey="L"
       title="Names not matched in a form suitable for batch submission to VSX. Shortcut: Alt-L">
`;
    // in tab-delimited form for pasting to spreadsheet
    aliasesNotMatched = moveNotUsefulAliasToEnd(aliasesNotMatched);
    const submissionText = (() => {
      if (aliasesNotMatched.length < 1) {
        return "";
      }
      return `\
${getVSXName()}\t${aliasesNotMatched.join()}\t${getOid()}\t\t${extraNamesToShow.join()}`;
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

    const normalize = (name) => {
      // for KIC / KID, sometimes VSX use non-standard names (compared with SIMBAD)
      // - KID should be KIC
      // - has leading zero
      // 'KIC 07023917' should be 'KIC 7023917'
      // 'KID 07023917' should be 'KIC 7023917' as well
      return name.replace(/^\s*(KI[CD])\s+0+(\d+)/, 'KIC $2');
    };

    const existingIdCtrPairs = (() => {
      // Extract names listed, with some special processing
      // 1. normalize KIC / KID if needed
      // 2. Filter out edge case not a real ID, but the text
      //   "Please note that aliases shown in grey link to obsolete records."
      const res = Array.from(idCtr.querySelectorAll('td'), td => [normalize(td.textContent.trim()), td])
        .filter(idCtrPair => !idCtrPair[0].startsWith('Please note'));
      res.push(getVSXName(true))
      return res;
    })();

    existingIdCtrPairs.forEach(idCtrPair => {
      const [id, td] = idCtrPair;
      if (aliasList.includes(id)) {
        aliasesMatched.push(id);
        td.classList.add("cross_matched");
        aliasesNotMatchedSet.delete(id);
      }
    });

    // not matched per-se, but they are of interests
    // currently, if VSX entry has ASAS-SN names, I'd like to know
    // as it could be helpful when I indirectly cross match with ASAS-SN
    const extraNamesToShow = [];
    existingIdCtrPairs.forEach(idCtrPair => {
      const [id,] = idCtrPair;
      if (id.startsWith("ASASSN-V")) {
        extraNamesToShow.push(id);
      }
    });

    showMatchResultMsg(aliasesMatched, Array.from(aliasesNotMatchedSet), extraNamesToShow);
  }


  // Tweak to facilitate matching: matching IDs given (from ExoFOP), show
  // other helpful info such as magnitude (on ExoFOP).
  // The logic is similar to those on SIMBAD script

  function aliasFilter(alias) {
    // filter out aliases that won't be present in VSX based on communication with VSX moderators.
    // For SDSS, ExoFOP provides SDSS DR 9 ids, but it is not the canonical / preferred form
    // used in VSX, SIMBAD, etc. The canonical form is `SDSS J<co-ordinate>`
    if (alias.match(/^(APASS|Gaia DR2|SDSS DR)/)) {
      return false;
    }
    return true;
  }

  function showDistanceFromCoordIfAvailable() {
    const [, distance] = location.hash.match(/#distance_from_coord=([^#]+)/) || [null, null];
    if (!distance) {
      return;
    }

    const td = document.querySelector('table.datasheet tbody > tr:nth-of-type(1) td')
    // use the empty cell left of the rough distance message "within 2' of <co-ordinate"
    td.textContent= `(${distance} arcsec)`;   // assumed it's arcsec (the default applied in searchForm above)
    td.title = 'Distance from search coordinate';

    // add distance from search coordinate to title
    const distanceRounded = parseInt(distance, 10);
    document.title = `${distanceRounded}" ` + document.title;
  }


  function addLinkToLCGv2() {
    const aavsoUidEl = document.querySelector("table.datasheet table > tbody > tr:nth-child(2) > td:nth-child(2) td");
    if (!aavsoUidEl) {
      console.warn('addLinkToLCGv2(): cannot find AAVSO UID table cell. No-op');
      return;
    }
    if (!aavsoUidEl.querySelector('a[title="Download data"]')) {
      // case no observation available. No point to add LCG v2 link.
      // The logic covers 2 sub-cases
      // 1. Case no AUID, there is a <a> element for requesting AUID but it does not have the title
      // 2. case there is AUID but there is no AAVSO observations, no <a> element is present
      return;
    }

    // convert current time to JD, see https://en.wikipedia.org/wiki/Julian_day
    const toJD = parseFloat(((Date.now() / 86400000) + 2440587.5).toFixed(2))
    const fromJD = toJD - 366 * 2   // 2 years, the default for LCGv2
    const lcg2Url = 'https://www.aavso.org/LCGv2/index.htm?DateFormat=Calendar&RequestedBands=&view=api.delim' +
      `&ident=${encodeURIComponent(getVSXName())}&fromjd=${fromJD}&tojd=${toJD}8&delimiter=@@@`;

    aavsoUidEl.insertAdjacentHTML('beforeend', `&emsp;( <a href="${lcg2Url}" target="_blank">LCGv2</a> )`);
  }


  function addLinkToExoFOP() {
    const extLinksRowEl = document.querySelector('td > select[name="linkout"]')?.parentElement?.parentElement;
    if (!extLinksRowEl) {
      console.warn('addLinkToExoFOP(): cannot find external link DOM element. No-op');
      return;
    }

    const  exofopNameUrl = `https://exofop.ipac.caltech.edu/tess/gototicid.php?target=${getVSXName()}`;

    // Note: In coordinate search,
    // for stars with large proper motion, the search might return nothing because
    // in ExoFOP, coordinate is in  epoch 2015.5 (Gaia DR2) while VSX coordinate is in J2000
    const [ra, dec] = getVSXCoord();
    const coordStr = `${ra} ${dec}`;  // For ExoFOP, ra dec must be separated by space, without comma
    const exofopCoordURL = `https://exofop.ipac.caltech.edu/tess/gototicid.php?target=${coordStr}`;

    extLinksRowEl.insertAdjacentHTML('afterend', `
<tr>
      <td class="detailtitle"></td>
      <td class="detaildata" colspan="2">
        ExoFOP <a href="${exofopCoordURL}" target="_blank">by coordinate</a>
        , <a href="${exofopNameUrl}" target="_blank">by name</a>
      </td>
</tr>
`)
  }


  //
  // main logic
  //

  try {
    showDistanceFromCoordIfAvailable();
    addLinkToLCGv2();
    addLinkToExoFOP();

    const [aliasList, otherParams] = getMatchingInfoFromHash(aliasFilter);
    if (!aliasList) {
      return;
    }

    showMatchingInfo(aliasList, otherParams);
    doMatchIds(aliasList);
  } finally {
    resetMatchingInfoHash();
  }
}

tweakDetailPage();
