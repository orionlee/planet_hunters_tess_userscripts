// ==UserScript==
// @name        TESS - SIMBAD tweak
// @namespace   astro.tess
// @match       http*://simbad.u-strasbg.fr/simbad/*
//                /sim-coo?Coord=*
//                ^^^ links generated from ExoFOP, coordinate-based
// @              /sim-id?*
//                ^^^ links from SIMBAD in case coordinate-based search has multiple results
//                /sim-basic?Ident=*
//                ^^^ links from SIMBAD basic search
// @match       http*://simbad.cds.unistra.fr/simbad/*
// @match       http*://simbad.cds.unistra.fr/guide/otypes.htx*
// @match       http*://simbad.cfa.harvard.edu/simbad/*
// @grant       GM_addStyle
// @noframes
// @version     1.10.0
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

(function injectCSS() {
  GM_addStyle(`\
.matched-id {
  font-weight: bold;
  font-size: 110%;
}

.matched-id:before {
  content: "> ";
}

.filter-matched .un-matched-id {
  /* use display:none as it looks better when hidden, but some jumping in UI when users toggle hide/show */
  display: none;
  /* visibility: hidden; */
}

/* A subtle visual hint to indicate the wiki link is a direct link (rather than search) */
a[href^="https://en.wikipedia.org/wiki/"] {
    text-decoration: dotted underline;
}
`)
})(); // function injectCSS()


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
  const otherParamsFormatted = (()=> {
    // make magnitude info more readable
    let res = otherParams;
    res = res.replace(/;/g, '<br>');
    res = res.replace(/(?:,\s*)?([A-Z])-/g, '<br>$1:&emsp;');
    res = res.replace(/\s*±\s([0-9.]+)/g, '<sub>±$1 </sub>');
    return res;
  })();
  document.body.insertAdjacentHTML('beforeend', `\
  <div id="tessAliasesCtr" style="background-color:rgba(255,255,0,0.9);
    position: fixed; top: 0px; right: 0px; padding: 0.5em 4ch 0.5em 2ch;
  max-width: 15vw;
  z-index: 99; font-size: 14px; line-height: 1.2;
    ">
    <u>TESS Aliases:</u> <a href="javascript:void(0);" onclick="this.parentElement.style.display='none';" style="float: right;">[X]</a><br>
    <details>
      <summary id="tessAliasesMatchMsg" style="font-weight: bold;"></summary>
      <span id="tessAliases">${aliases}</span>
    </details>
    <br>
    <span id="tessOtherParams">${otherParamsFormatted}</span>
  </div>`);
}

//
// END generic cross match helpers / UI


// If current page is in https, ensure internal SIMBAD links are also in https.
// (e.g., links to paper references are often in plain http, causing warnings in Chrome)
function fixHttpLinks() {
  if ('https:' !== location.protocol ) {
    return false;
  }
  const links = document.querySelectorAll('a[href^="http://simbad"]');
  links.forEach((a) => {
    a.href = a.href.replace('http://simbad', 'https://simbad');

  });
  return links.length;
}
fixHttpLinks();

// To normalize the IDs shown in SIMBAD, the textContent of the supplied element, typically an <a>
function normalizeId(idEl) {
  // sometimes the IDs have multiple spaces.
  return idEl.textContent.trim().replace(/\s\s+/g, ' ');
}

// Cross match info in hash, that come from links from customized ExoFOP
function tweakUIWithCrossMatch() {
  (() => { // annotate distance from center from hash
    // use case: if the SIMBAD entry page is from the link of a multi-result page
    // the distance from center is lost in standard SIMBAD UI,
    // we compensate it here.
    // (The distance is hash is added by the `resultLinks` tweaks in the later part of the function)
    const [, dist] = location.hash.match(/&dist_asec=([^&]+)/) || [null, null]
    if (!dist) {
      return;
    }
    const idRow = document.querySelector('#basic_data table tr:first-of-type');
    if (!idRow) {
      console.warn('tweakUIWithCrossMatch(): failed to annotate distance to the center because the ID row DOM not found.');
      return;
    }
    // the placement of the data and the UI is consistent with how SIMBAD presents it
    // (in the case of coordinate search with only 1 result)
    idRow.insertAdjacentHTML('afterend',`
  <tr>
    <td align="LEFT" valign="TOP" nowrap="">
Distance to the center <i>arcsec</i>:       </td>
    <td>
     <font size="+0" color="#969696">
      <i>
   ${dist}
      </i>
     </font>
    </td>
   </tr>
`);
  })();


  const [aliasList, otherParams] = getMatchingInfoFromHash();
  if (!aliasList) {
    return;
  }

  showMatchingInfo(aliasList, otherParams);

  // highlight the aliases

  let numIdsMatched = 0;

  // BEGIN for case the coordinate has multiple results
  // - we propagate the aliases to the result link
  // - also propagate distance from center as well.
  //    - Note: it probably should be done separately.
  // - some minor UI tweak
  if (!document.querySelector('a[name="lab_ident"]')) {
    const resultLinks = Array.from(document.querySelectorAll('#datatable tr td:nth-of-type(2) a'));
    /// console.debug('result links:', resultLinks);

    // indicate num entries found. 0 would be helpful to ignore the result without opening the tab
    document.title = `(${resultLinks.length}) - ${document.title}`;

    resultLinks.forEach(linkEl => {
      // propagate the aliases to the links of individual result
      linkEl.href += location.hash;

      // also propagate distance from center
      const dist = linkEl?.parentElement?.nextElementSibling?.textContent?.trim();
      if (dist) {
        linkEl.href += `&dist_asec=${dist}`;
      } else {
        console.warn('tweakUIWithCrossMatch(): cannot annotate the distance from center for ' + linkEl.textContent);
      }
    });

    // traverse to individual page automatically if applicable
    // (the links have been processed to propagate the hash)
    resultLinks.forEach(linkEl => {
      // case multiple result, the one of them has matching ID
      if (aliasList.includes(normalizeId(linkEl))) {
        location.href = linkEl.href; // ID matched, go to the individual result page directly
      }
    });

    // okay so we don't go to individual result page directly. make it easy to click first link instead
    if (resultLinks.length > 1) {
      resultLinks[0].focus(); // doesn't work if the tab is spawned as a background one
      resultLinks.forEach( (a, i) => { a.accessKey = i+1; });  // assign keyboard short, Alt-1, Alt-2, ...
    }
  }
  // END for case the coordinate has multiple results

  // BEGIN case the coordinate matches a single result
  if (document.querySelector('a[name="lab_ident"]')) {
    const idTableEl = document.querySelector('a[name="lab_ident"]').parentElement.nextElementSibling.nextElementSibling.nextElementSibling;
    Array.from(idTableEl.querySelectorAll('tt'), tt => {
      if (aliasList.includes(normalizeId(tt))) {
        tt.classList.add('matched-id');
        numIdsMatched++;
      } else {
        // hide but the <td>s, not just the <tt> elements
        tt.parentElement.parentElement.classList.add('un-matched-id');
      }
    });

    if (numIdsMatched > 0) {
      // add UI to hide-show unmatched IDs, defaulted to hiding them.
      idTableEl.insertAdjacentHTML('beforebegin', `<button id="toggleUnmatchedIDsCtl"></button>`);
      const hideShowUnmatchedIDs = () => {
        idTableEl.classList.toggle('filter-matched');
        const labelPrefix = idTableEl.classList.contains('filter-matched') ? 'Show' : 'Hide';
        document.getElementById('toggleUnmatchedIDsCtl').textContent = `${labelPrefix} un-matched IDs`;
      };
      document.getElementById('toggleUnmatchedIDsCtl').onclick = hideShowUnmatchedIDs;
      hideShowUnmatchedIDs(); // initialized, by first hiding them
    }
  }
  // END case the coordinate matches a single result

  const aliasMatchMsgCtr = document.querySelector('#tessAliasesMatchMsg');
  if (numIdsMatched > 0) {
    aliasMatchMsgCtr.textContent = ` ${numIdsMatched} IDs matched. `;
  } else {
    aliasMatchMsgCtr.textContent = ` No IDs matched. `;
    aliasMatchMsgCtr.style.backgroundColor = 'red';
  }

  resetMatchingInfoHash();

}
tweakUIWithCrossMatch();


// For single result case,
// link star type to wikipedia, if it exists, e.g., link Eclipsing binary in the following:
// TYC 12345-678-9 -- Eclipsing binary
function simbadStarTypeToWikiLinkHtml(starType) {
  function escape(text) {
    const tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    return text.replace(/[&<>]/g, function(tag) {
        return tagsToReplace[tag] || tag;
    });
  }

  // turn <, etc. to html entity for ease of comparison with extracted HTML
  function toKeyEscaped(map) {
    const mapEscaped = {};
    for (const key in map) {
      mapEscaped[escape(key)] = map[key];
    }
    return mapEscaped;
  }

  function escapeTitle(title) {
    return title.replace(/\s/g, '_');
  }

  const NO_LINK = '[NO-LINK]';
  const wikiTitleExceptionsMap = toKeyEscaped({
      // exceptions to be added
      'Star': NO_LINK,
      'Eruptive variable Star': 'Eruptive variable',
      'Eclipsing binary of Algol type': 'Algol variable',
      'Long Period Variable candidate': 'Long Period Variable star',
      'Low-mass star (M<1solMass)': 'Low-mass star',
      'Variable Star of RR Lyr type': 'RR Lyrae variable',
      'Variable of BY Dra type': 'BY Draconis variable',
      'Double or multiple star': 'Double star',
      'Eclipsing binary of W UMa type': 'W Ursae Majoris variable',
      'Variable Star of gamma Dor type': 'Gamma Doradus variable',
      'Brightest galaxy in a Cluster (BCG)': 'Brightest cluster galaxy',
      'Variable Star of delta Sct type': 'Delta Scuti variable',
      'Possible Horizontal Branch Star': 'Horizontal branch',
      'Possible Red supergiant star': 'Red supergiant star',
      'Possible Blue supergiant star': 'Blue supergiant star',
      'Variable Star of beta Cep type': 'Beta Cephei variable',
      'Variable Star of Orion Type': 'Orion variable',
      'CV DQ Her type (intermediate polar)': 'Intermediate polar',
      'CV of AM Her type (polar)': 'Polar (star)',
      'Variable of RS CVn type': 'RS Canum Venaticorum variable',
      'Variable Star of Mira Cet type': 'Mira variable',
      'Variable Star of R CrB type': 'R Coronae Borealis variable',
      'Variable Star of alpha2 CVn type': 'Alpha2 Canum Venaticorum variable',
      'T Tau-type Star': 'T Tauri star',
      'Ellipsoidal variable Star': 'Rotating ellipsoidal variable',
      'Variable Star of W Vir type': 'W Virginis variable',
      'Blue supergiant star': 'Blue supergiant',
      'Variable Star of irregular type': 'Irregular variable',
      'Emission-line Star': 'Emission-line star',
      'Be Star': 'Be star',
      'Hot subdwarf': 'Hot subdwarf',
      'Wolf-Rayet Star': 'Wolf–Rayet star',
      'Carbon Star': 'Carbon star',
      'Eclipsing binary': 'Eclipsing binary',
      'Long-period variable star': 'Long-period variable star',
      'Spectroscopic binary': 'Spectroscopic binary',
    });

  // default is starType, and the mapping takes care of special cases
  const wikiTitle = wikiTitleExceptionsMap[starType];

  if (!wikiTitle) {
    return   `<a target="wiki_star_type"
                 href="https://en.wikipedia.org/w/index.php?title=Special:Search&search=${starType}">${starType}</a>`;
  } else if (wikiTitle === NO_LINK) {
    return starType;
  } else {
    // case there is a specific mapping, link to wiki page directly
    return `<a target="wiki_star_type"
               href="https://en.wikipedia.org/wiki/${escapeTitle(wikiTitle)}">${starType}</a>`
  }
}

function simbadStarIdToWikiUrl(starId) {
  const mapConstellationAbbrev = {
    // extracted from:
    // https://skyandtelescope.org/astronomy-resources/constellation-names-and-abbreviations/
    "And": "Andromedae",
    "Ant": "Antliae",
    "Aps": "Apodis",
    "Aqr": "Aquarii",
    "Aql": "Aquilae",
    "Ara": "Arae",
    "Ari": "Arietis",
    "Aur": "Aurigae",
    "Boo": "Boötis",
    "Cae": "Caeli",
    "Cam": "Camelopardalis",
    "Cnc": "Cancri",
    "CVn": "Canum Venaticorum",
    "CMa": "Canis Majoris",
    "CMi": "Canis Minoris",
    "Cap": "Capricorni",
    "Car": "Carinae",
    "Cas": "Cassiopeiae",
    "Cen": "Centauri",
    "Cep": "Cephei",
    "Cet": "Ceti",
    "Cha": "Chamaeleontis",
    "Cir": "Circini",
    "Col": "Columbae",
    "Com": "Comae Berenices",
    "CrA": "Coronae Australis",
    "CrB": "Coronae Borealis",
    "Crv": "Corvi",
    "Crt": "Crateris",
    "Cru": "Crucis",
    "Cyg": "Cygni",
    "Del": "Delphini",
    "Dor": "Doradus",
    "Dra": "Draconis",
    "Eql": "Equulei",
    "Eri": "Eridani",
    "For": "Fornacis",
    "Gem": "Geminorum",
    "Gru": "Gruis",
    "Her": "Herculis",
    "Hor": "Horologii",
    "Hya": "Hydrae",
    "Hyi": "Hydri",
    "Ind": "Indi",
    "Lac": "Lacertae",
    "Leo": "Leonis",
    "LMi": "Leonis Minoris",
    "Lep": "Leporis",
    "Lib": "Librae",
    "Lup": "Lupi",
    "Lyn": "Lyncis",
    "Lyr": "Lyrae",
    "Men": "Mensae",
    "Mic": "Microscopii",
    "Mon": "Monocerotis",
    "Mus": "Muscae",
    "Nor": "Normae",
    "Oct": "Octantis",
    "Oph": "Ophiuchi",
    "Ori": "Orionis",
    "Pav": "Pavonis",
    "Peg": "Pegasi",
    "Per": "Persei",
    "Phe": "Phoenicis",
    "Pic": "Pictoris",
    "Psc": "Piscium",
    "PsA": "Piscis Austrini",
    "Pup": "Puppis",
    "Pyx": "Pyxidis",
    "Ret": "Reticulii",
    "Sge": "Sagittae",
    "Sgr": "Sagittarii",
    "Sco": "Scorpii",
    "Scl": "Sculptoris",
    "Sct": "Scuti",
    "Ser": "Serpentis",
    "Sex": "Sextantis",
    "Tau": "Tauri",
    "Tel": "Telescopii",
    "Tri": "Trianguli",
    "TrA": "Trianguli Australis",
    "Tuc": "Tucanae",
    "UMa": "Ursae Majoris",
    "UMi": "Ursae Minoris",
    "Vel": "Velorum",
    "Vir": "Virginis",
    "Vol": "Volantis",
    "Vul": "Vulpeculae"
  };
  // the greek character latin abbreviation used in SIMBAD, mapped it to the full english name
  // used in wikipedia title
  // source: http://simbad.u-strasbg.fr/guide/chA.htx , https://en.wikipedia.org/wiki/Greek_alphabet
  const mapGreekAbbrev = {
    "alf": "Alpha",
    "bet": "Beta",
    "gam": "Gamma",
    'del': 'Delta',
    'eps': 'Epsilon',
    'zet': 'Zeta',
    'eta': 'Eta',
    'tet': 'Theta',
    'iot': 'Iota',
    'kap': 'Kappa',
    'lam': 'Lambda',
    'mu.': 'Mu',
    "nu.": "Nu",
    'ksi': 'Xi',
    'omi': 'Omicron',
    'pi.': 'Pi',
    'rho': 'Rho',
    'sig': 'Sigma',
    'tau': 'Tau',
    'ups': 'Upsilon',
    'phi': 'Phi',
    'khi': 'Chi',
    'psi': 'Psi',
    'ome': 'Omega',
  };
    let starIdCleanedUp = starId.replace(/^V?[*]+\s*/, '');
  // check if it is a Bayer / Flamsteed designation, with 3 letter abbreviation for constellation
  const [, id, constellationAbbrev] =
    starIdCleanedUp.match(/^([a-zA-Z.]{1,3}|\p{Script_Extensions=Greek}|\d{1,3})\s+(\w{3})\s*$/u) || [null, null, null];
  if (id) {
    const constellationFull = mapConstellationAbbrev[constellationAbbrev];
    if (constellationFull) {
      // convert it to the pattern using constellation full name, the preferred format in wikipedia title
      const idCleanedUp  = mapGreekAbbrev[id] ? mapGreekAbbrev[id] : id;
      starIdCleanedUp = `${idCleanedUp} ${constellationFull}`;
    } else {
      console.warn("The ID has Bayer / Flamsteed designation pattern, but the abbreviation does not match a constellation: ", starIdCleanedUp);
    }
  }
  return `https://en.wikipedia.org/w/index.php?title=Special:Search&search=${starIdCleanedUp}`;
}

function simbadStarIdToStellariumUrl(starId) {
  // the logic is also used in the WikiUrl function (which does more mapping)
  const starIdCleanedUp = starId.replace(/^V?[*]+\s*/, '');
  return "https://stellarium-web.org/skysource/" + encodeURIComponent(starIdCleanedUp)
}

const startTitleEl = document.querySelector('#basic_data font[size="+2"]');
if (startTitleEl) {
  const reStarIdAndType = /<b>\s*\n*(.+)\s*\n*<\/b>\s*--\s*(.+)/;
  let html = startTitleEl.innerHTML;
  const starIdAndTypeMatch = html.match(reStarIdAndType);
  if (starIdAndTypeMatch) {
    const typeWikiLinkHtml = simbadStarTypeToWikiLinkHtml(starIdAndTypeMatch[2]);
    const starIdWikiUrl = simbadStarIdToWikiUrl(starIdAndTypeMatch[1]);
    const starIdStellariumUrl = simbadStarIdToStellariumUrl(starIdAndTypeMatch[1]);
    html = html.replace(reStarIdAndType, `\
<b><a target="stellarium_star"
      href="${starIdStellariumUrl}">$1</a></b>
<!-- style stellarium block to reduce horizontal space -->
<sub style="
font-size: 12px;
font-family: 'Bahnschrift Light Condensed', ui-sans-serif;
display: inline-block;
margin-left: -10px;
"><a target="wiki_star" href="${starIdWikiUrl}">wiki</a></sub>
--
${typeWikiLinkHtml}
<svg style="height: 0.8em; width: 1em; background: transparent;" aria-hidden="true" data-prefix="fas" data-icon="external-link-alt" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M576 24v127.984c0 21.461-25.96 31.98-40.971 16.971l-35.707-35.709-243.523 243.523c-9.373 9.373-24.568 9.373-33.941 0l-22.627-22.627c-9.373-9.373-9.373-24.569 0-33.941L442.756 76.676l-35.703-35.705C391.982 25.9 402.656 0 424.024 0H552c13.255 0 24 10.745 24 24zM407.029 270.794l-16 16A23.999 23.999 0 0 0 384 303.765V448H64V128h264a24.003 24.003 0 0 0 16.97-7.029l16-16C376.089 89.851 365.381 64 344 64H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V287.764c0-21.382-25.852-32.09-40.971-16.97z"></path></svg>
`);
// ^ external indicator svg adapted from ExoFOP
    startTitleEl.innerHTML = html;
  }
}

function highlightInterestingObjectTypes() {
  const uninterestingTypes = (() => {
    const baseTypes = ['*', '**', 'PM*', 'IR', 'FIR', 'MIR', 'NIR', 'UV', 'X', 'G', ];
    // include those that aren't uncertain (probably not needed)
    // baseTypes + baseTypes.map(t => t + '?');
    return baseTypes;
  })();

  const interestingTypesFound = [];
  Array.from(document.querySelectorAll('td > tt[title] > b'), el => {
    const oType = el.textContent.trim();
    if (!uninterestingTypes.includes(oType)) {
      el.style.backgroundColor = "rgba(255, 255, 0, 0.5)";
      interestingTypesFound.push(oType);
    }
    el.innerHTML = `\
<a href="/simbad/sim-display?data=otypes#otype=${oType}"
   style="color: black;" target="_simbad_otype">${oType}</a>`;
  });

  // add interesting type to tab bar title
  if (interestingTypesFound.length > 0) {
    const typeText = interestingTypesFound.map(t => t.replace(/[*]/g, '')).join(', ');
    document.title = `${typeText} | ${document.title}`;
  }
}
highlightInterestingObjectTypes();

function addAladinLiteLink() {
  // recent SIMBAD UI updates take away link to Aladin Lite
  const ctr = document.querySelector('div[name="sendBySAMP"]');
  const targetId = startTitleEl?.querySelector('a')?.textContent;
  if (ctr && targetId) {
    // Set Field of View to 0.1 deg, about 6 arcmin, slightly larger than
    // typical 11x11 pixel TESS TPF (~ 4arcmin)
    ctr.insertAdjacentHTML('afterbegin', `<a
      href="https://aladin.u-strasbg.fr/AladinLite/?target=${encodeURIComponent(targetId)}&fov=0.1"
      target="_aladin_lite">Aladin Lite</a>&emsp;`);
  }
}
addAladinLiteLink();


function makeCanonicalLink() {
  // normalize the link so that the copied link has less variation
  // right now: remove useless query string parameters
  const rePattern = /&submit=submit/
  if (location.search.match(rePattern)) {
    history.pushState("", document.title, location.pathname + location.search.replace(rePattern, ""));
  }
}
makeCanonicalLink();


function tweakOTypesGuide() {
  if (location.pathname != '/guide/otypes.htx') {
    return;
  }
  console.debug("In OTypes Guide tweak");

  const [, otype] = location.hash.match('#otype=([^&]+)') || [null, null]
  if (!otype) {
    return;
  }
  // auto search the specified otype
  // use setTimeout to ensure the page is initialized with the otype nodes
  setTimeout(() => {
    // console.debug("otypes :", unsafeWindow.otypes);  // defined by SIMBAD's otypes_main.js
    document.querySelector('input#txtSearch').value = otype;
    document.querySelector('button#btnSearch').click();
  }, 1000);

}
tweakOTypesGuide();


function tweakBibReference() {
  // Add link to ADS, which has a better UI with
  // - more comprehensive links to data products, graphics, different versions of the paper, etc.
  if (!location.href.includes('/simbad/sim-ref?bibcode=')) {
    return;
  }
  let [, bibcode] = location.search.match(/[?&]bibcode=([^&]*)/) || [null, null];
  if (!bibcode) {
    console.warn('tweakBibReference(): cannot identify bibcode. No-Op.');
    return;
  }
  bibcode = decodeURIComponent(bibcode);
  // document.querySelector('a[href^="https://dx.doi.org/"]')?.insertAdjacentHTML('afterend', `
  // &emsp;( <a href="https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract">ADS entry</a> )
  // `);

  // Add the link to before the abstract so that it is above the fold.
  document.querySelector('div.abstract')?.insertAdjacentHTML('beforebegin', `
<div id="ads_link_ctr">
  <img src="//simbad.cds.unistra.fr/icons//action.png" alt="goto" id="goto" align="LEFT" height="16" width="16">
  <a href="https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract">NASA ADS Entry</a>
</div>
`);


}
tweakBibReference();
