// ==UserScript==
// @name        Zooniverse Talk - Better Commenting
// @namespace   zooniverse.org
// @match       https://www.zooniverse.org/*
// @grant       GM_addStyle
// @noframes
// @version     1.24.1
// @author      -
// @description For zooniverse talk, provides shortcuts in typing comments. 1) when the user tries to paste a link / link to image,
//              it will be converted to markdown automatically. 2) Keyboard shortcuts for bold (Ctrl-B) and italic (Ctrl-I).
// @icon        https://www.zooniverse.org/favicon.ico
// ==/UserScript==

// BEGIN Misc generic helpers
//

function isElementOrAncestor(el, criteria) {
  for (let elToTest = el; elToTest != null; elToTest = elToTest.parentElement) {
    if (criteria(elToTest)) {
      return true;
    }
  }
  return false;
}

function capitalize(text) {
  if (!text) return null;
  function capitalize1stLetter(word) {
    return word.substring(0, 1).toLocaleUpperCase() + word.substring(1);
  }
  let res = text.split(' ').map(capitalize1stLetter).join(' ');
  if (res.length > 1) {
    // ensure the last letter is lowercase,
    // to handle planet name, e.g., Kepler 435 b
    res =
      res.slice(0, res.length - 1) + res.slice(res.length - 1).toLowerCase();
  }

  return res;
}

//
// END Misc generic helpers

function insertAtCursor(textarea, text, transformFn, selectFn) {
  if (textarea.selectionStart >= 0 || textarea.selectionStart === '0') {
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const selectedText = textarea.value.substring(startPos, endPos);
    if (selectedText && transformFn) {
      // use selected text as the labels in the markdown
      text = transformFn(text, selectedText);
    }
    // inserted the processed paste to the textarea
    textarea.value =
      textarea.value.substring(0, startPos) +
      text +
      textarea.value.substring(endPos, textarea.value.length);

    // determine cursor position after the paste, defaulted to the end of the inserted text
    const [selectStart, selectEnd] = (selectFn
      ? selectFn(text, startPos)
      : null) || [startPos + text.length, startPos + text.length];
    textarea.setSelectionRange(selectStart, selectEnd);
  } else {
    textarea.value += text;
  }
}

//
// if the text to be pasted is link / link to images, convert the text to markdown.
//

const titleForLinkifiedUrlImplList = [];
// It is similar to default extraction logic, but has special cases.
titleForLinkifiedUrlImplList.push((url) => {
  let [, title] = url.match(/.*[.]wikipedia[.]org\/wiki\/([^#]+)/) || [
    null,
    null,
  ];
  if (title) {
    title = decodeURIComponent(title); // handle non basic ASCII char, e.g., the dash in Wolf–Rayet_star
    title = title?.replace(/_/g, ' '); // handle _
    title = title.replace(/\s*[(][^)]+[)]/, ''); // handle disambiguation qualifiers, e.g., Eris(dwarf planet)
    return title;
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  // Case link of a paper referenced  by SIMBAD
  if (
    url.includes('simbad.u-strasbg.fr/simbad/sim-ref?bibcode=') ||
    url.includes('simbad.cds.unistra.fr/simbad/sim-ref?bibcode=')
  ) {
    // https://simbad.cds.unistra.fr/simbad/sim-ref?bibcode=2022ApJS..263...34C
    const [, paperYear] = url.match(/bibcode=(\d+)/) || [null, null];
    if (paperYear) {
      return `${paperYear} paper referenced by SIMBAD`;
    } else {
      return 'paper referenced by SIMBAD';
    }
  }

  // Case of typical  SIMBAD links
  if (
    url.includes('simbad.u-strasbg.fr/simbad/sim-') ||
    url.includes('simbad.cds.unistra.fr/simbad/sim-')
  ) {
    // try to get object ID if it's in URL

    // for pattern such as ?Ident=%4095658&Name=HD%20235542B
    // (when Ident and Name both exists, Name has the more friendly ID)
    let [, id] = url.match(/Name=([^&]+)/) || [null, null];

    if (!id) {
      // for pattern such as ?Ident=HD+235542B
      [, id] = url.match(/Ident=([^&]+)/) || [null, null];
    }

    if (id) {
      // decodeURI / decodeURIComponent can't handle + as space
      // (used by SIMBAD in some cases but sometimes it uses %20)
      // so we have to do it ourselves.
      id = decodeURIComponent(id.replace(/\+/g, ' '));
      return `${id} SIMBAD`;
    } else {
      return 'SIMBAD';
    }
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (
    url.includes('vsx.aavso.org/index.php?view=detail.top&oid=') ||
    url.includes('www.aavso.org/vsx/index.php?view=detail.top&oid=')
  ) {
    return 'VSX';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (url.includes('asas-sn.osu.edu/variables/')) {
    return 'ASAS-SN Variable';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (url.includes('tessebs.villanova.edu')) {
    return 'TESS EB';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (url.includes('keplerebs.villanova.edu')) {
    return 'Kepler EB';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (url.includes('heasarc.gsfc.nasa.gov/cgi-bin/tess/webtess/wtv')) {
    // legacy WTV
    return 'WTV';
  }
  if (
    url.includes(
      'heasarc.gsfc.nasa.gov/wsgi-scripts/TESS/TESS-point_Web_Tool/TESS-point_Web_Tool/wtv_v2.0.py/TICID_result/ticid=',
    )
  ) {
    // current WTV
    return 'WTV';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (url.includes('exofop.ipac.caltech.edu/tess/edit_obsnotes.php')) {
    return 'Observation notes';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  // TESS GI proposals
  const [, proposalId] = url.match(
    /heasarc.gsfc.nasa.gov\/docs\/tess\/data\/approved-programs\/[^/]+\/(.+).txt/,
  ) || [null, null];
  return proposalId;
});
titleForLinkifiedUrlImplList.push((url) => {
  // TESS TCE on exomast

  let [, startSector, endSector, tceSubId] = url.match(
    /exo.mast.stsci.edu\/exomast_planet.html\?planet=.+S(\d+)-?S(\d+)TCE_?(\d)/,
  ) || [null, null, null, null];
  if (!tceSubId) {
    return null;
  }
  startSector = parseInt(startSector);
  endSector = parseInt(endSector);
  if (startSector == endSector) {
    return `sector ${startSector} TCE${tceSubId}`;
  } else {
    return `sectors ${startSector} - ${endSector} TCE${tceSubId}`;
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  // TESS TCE vetting summary pdfs . tceSubId: 1, 2, 3 (of a given sector / sectors)
  // Note: the regex can't be easily generalized to dvm , dvr pdfs, because those pdfs doe not have tceSubId
  let [, startSector, endSector, tceSubId] = url.match(
    /mast.stsci.edu\/api\/v0.1\/Download\/file[/]?[?]uri=mast:TESS\/.+-s(\d+)-s(\d+).+-0*(\d+)-\d+_dvs.pdf/,
  ) || [null, null, null, null];
  if (!tceSubId) {
    return null;
  }
  startSector = parseInt(startSector);
  endSector = parseInt(endSector);
  if (startSector == endSector) {
    return `sector ${startSector} TCE${tceSubId} vetting summary`;
  } else {
    return `sectors ${startSector} - ${endSector} TCE${tceSubId} vetting summary`;
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  // TESS TCE vetting DVM/DVR pdfs .
  let [, startSector, endSector, dvmOrdvr] = url.match(
    /mast.stsci.edu\/api\/v0.1\/Download\/file[/]?[?]uri=mast:TESS\/.+-s(\d+)-s(\d+).+_(dvm|dvr).pdf/,
  ) || [null, null, null, null];
  if (!dvmOrdvr) {
    return null;
  }
  const reportTypeStr = dvmOrdvr == 'dvm' ? 'mini report' : 'full report';

  startSector = parseInt(startSector);
  endSector = parseInt(endSector);
  if (startSector == endSector) {
    return `sector ${startSector} vetting ${reportTypeStr}`;
  } else {
    return `sectors ${startSector} - ${endSector} vetting ${reportTypeStr}`;
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (url.includes('astro.swarthmore.edu/transits/aladin.html')) {
    return 'Swarthmore Finder Chart';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (
    url.match(
      /zooniverse[.]org[/]projects[/]nora-dot-eisner[/]planet-hunters-tess[/]talk[/]\d+[/]\d+/,
    )
  ) {
    // case Zooniverse PHT comment
    if (
      !location.pathname.startsWith(
        '/projects/nora-dot-eisner/planet-hunters-tess',
      )
    ) {
      return 'PHT comment'; // in non-PHT project
    } else {
      return 'comment'; // in PHT itself
    }
  }
  if (url.match(/zooniverse[.]org[/].+[/]talk[/]\d+[/]\d+/)) {
    // case other Zooniverse comments
    return 'comment';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  // Zooniverse Talk Search
  let [, searchTerm] = url.match(
    /zooniverse[.]org[/].+[/]talk[/]search[?]query=(.+)/,
  ) || [null, null];
  if (searchTerm) {
    // decode the searchTerm
    // Zooniverse would encode space as + (instead of %20), so we first handle the case.
    return decodeURIComponent(searchTerm.replace(/[+]/m, ' '));
  }
});

titleForLinkifiedUrlImplList.push((url) => {
  // Vizier entry link (single-object by name), e.g.,
  // https://vizier.u-strasbg.fr/viz-bin/VizieR-S?Gaia%20EDR3%203449035248963961216
  const [, targetId] = url.match(/vizier[.].+[/]VizieR-S[?]([^&]+)/) || [
    null,
    '',
  ];
  // e.g, extract Gaia EDR3
  const [, prefix] = decodeURIComponent(targetId).match(/(^.+)\s+\d+\s*$/) || [
    null,
    null,
  ];
  return prefix ? `${prefix}` : null;
});
titleForLinkifiedUrlImplList.push((url) => {
  if (
    // Vizier Gaia DR3 entry link (for various tables under Gaia DR3), e.g.,
    url.match(/[/]viz-bin[/]VizieR-\d[?].*-source=I[/]355[/].+&/) ||
    // Vizier Gaia DR3 search result page (possibly more than 1 row),
    // including single table and multi table cases
    url.match(/[/]viz-bin[/]VizieR-\d[?].*source=[+]?I%2F355/)
  ) {
    return 'Gaia DR3';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (
    // Vizier Gaia DR3 variable entry link (for various tables under Gaia DR3), e.g.,
    // - variable classification (I/358/vclassre)
    // https://cdsarc.cds.unistra.fr/viz-bin/VizieR-5?-ref=VIZ62ce31bb45b5&-out.add=.&-source=I/358/vclassre&recno=1562935&-out.orig=o
    // - eclipsing binary properties (I/358/veb)
    // https://vizier.cds.unistra.fr/viz-bin/VizieR-5?-ref=VIZ638112dc1d2c37&-out.add=.&-source=I/358/veb&recno=321323&-out.orig=o
    url.match(/[/]viz-bin[/]VizieR-\d[?].*-source=I[/]358[/].+&/) ||
    // Vizier Gaia DR3 variable search result page (possibly more than 1 row),
    // including single table and multi table cases
    url.match(/[/]viz-bin[/]VizieR-\d[?].*source=[+]?I%2F358/)
  ) {
    return 'Gaia DR3 Variable';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (
    // Vizier Gaia DR3 NSS  entry link (for various tables under Gaia DR3), e.g.,
    // - SB2 params(I/357/tbosb2)
    // https://vizier.cds.unistra.fr/viz-bin/VizieR-5?-ref=VIZ654d41d6a6ba&-out.add=.&-source=I/357/tbosb2&recno=3074&-out.orig=o
    url.match(/[/]viz-bin[/]VizieR-\d[?].*-source=I[/]357[/].+&/) ||
    // Vizier Gaia DR3 NSS search result page (possibly more than 1 row),
    // including single table and multi table cases
    url.match(/[/]viz-bin[/]VizieR-\d[?].*source=[+]?I%2F357/)
  ) {
    return 'Gaia DR3 NSS';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  if (
    // Gaia DR3 Stellar Variability entry link, e.g.,
    // - J/A+A/677/A137
    // https://vizier.cds.unistra.fr/viz-bin/VizieR-4?-out.add=_r&%2F%2Foutaddvalue=default&-sort=_r&-order=I&-c=147.69122315002+-50.578355384690006&-c.eq=J2000&-c.r=+30&-c.u=arcsec&-c.geom=r&-source=&-out.src=J%2FA%2BA%2F677%2FA137%2Fcatalog&-source=J%2FA%2BA%2F677%2FA137%2Fcatalog&-bmark=GET
    url.match(/[/]viz-bin[/]VizieR-\d[?].*-source=J[/]A+A[/]677[/]A137.+&/) ||
    // Vizier Gaia DR3 NSS search result page (possibly more than 1 row),
    // including single table and multi table cases
    url.match(/[/]viz-bin[/]VizieR-\d[?].*source=[+]?J%2FA%2BA%2F677%2FA137/)
  ) {
    return 'Gaia DR3 Stellar Variability';
  }
});
titleForLinkifiedUrlImplList.push((url) => {
  // General Vizier. Should be placed after all others for specific Vizier catalogs .
  if (url.match(/[/]viz-bin[/]VizieR-\d[?]/)) {
    return 'Vizier';
  }
});

//
// A generic replacement scheme (should always be the last one!)
titleForLinkifiedUrlImplList.push((url) => {
  // match the last portion of an URL path (ignoring query string)
  // for many link, the last portion tends to be the readable name
  // urls pattern to handle include:
  // - static page (possibly with an extension)
  //   https://heasarc.gsfc.nasa.gov/docs/tess/approved-programs.html
  // - with query string:
  //   https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html?searchQuery=%7B%22service%22FooBar
  // - no extension, nor query string
  //   https://en.wikipedia.org/wiki/Gamma_Doradus
  // - hashes:
  //   https://en.wikipedia.org/wiki/Gamma_Doradus_variable#List
  // - end with slash
  //   https://en.wikipedia.org/wiki/Gamma_Doradus/
  // - call decodeURI(url) below to handle URLs with escaped characters such as space (%20)
  //   https://exoplanetarchive.ipac.caltech.edu/overview/WASP-1%20b

  let [, text] = decodeURI(url).match(/.+\/([a-zA-Z0-9-_ ]+)([/.?#].*)?$/) || [
    null,
    null,
  ];
  text = text?.replace(/[_]/g, ' ');
  return capitalize(text);
});

function createTitleForLinkifiedUrl(url) {
  for (const implFn of titleForLinkifiedUrlImplList) {
    const title = implFn(url);
    if (title) {
      return title;
    }
  }
  return null;
}

function processLinksImages(text) {
  function isImage(link) {
    return /[.](png|jpg|jpeg|gif)$/.test(link);
  }

  if (/^https:\/\/imgur[.]com\/.+/.test(text) && !isImage(text)) {
    // case imgur link, want the actual image instead
    text += '.png';
  }

  if (/^https?:\/\//.test(text)) {
    if (isImage(text)) {
      // case images
      return `![Alt Title](${text})`;
    } else {
      const urlTitle = createTitleForLinkifiedUrl(text) || 'Title';
      return `[${urlTitle}](${text})`;
    }
  }
  // else not a link, so return original
  return text;
}

function isTalkCommentTextArea(target) {
  return (
    target &&
    target.tagName === 'TEXTAREA' &&
    target.classList.contains('markdown-editor-input')
  );
}

function onPasteProcessLinksImages(evt) {
  // only trap those pasting to  talk comments
  if (!isTalkCommentTextArea(evt.target)) {
    return;
  }

  const pasteRaw = (evt.clipboardData || window.clipboardData).getData('text');
  if (!pasteRaw) {
    return;
  }

  let paste = processLinksImages(pasteRaw);

  // ifo no special processing applied, let browser handle it
  if (paste === pasteRaw) {
    return;
  }

  // paste the processed text to textarea
  insertAtCursor(
    evt.target,
    paste,
    (text, selectedText) => {
      // use selected text as the labels in the markdown
      return text.replace(/\[.+\]/, `[${selectedText}]`);
    },
    (text, startPos) => {
      const markdownLinkTitleIdx = text.indexOf('[Title]');
      if (markdownLinkTitleIdx >= 0) {
        // case inserted text is markdown link, select the title so that the user can replace it.
        // OPEN: the logic of handling markdown link text differently should not have baked into this generic function
        return [
          startPos + markdownLinkTitleIdx + 1,
          startPos + markdownLinkTitleIdx + 1 + 'Title'.length,
        ];
      } else {
        return null;
      }
    },
  );

  // OPEN: after the textarea is changed, somehow zooniverse won't recognize the changes unless
  // the user types something more in the textarea.
  // If the user simply moves around by pressing arrow keys, it won't work either. The user must
  // type something.
  //
  // Attempts to simulate to pressing space so far yields nothing.
  evt.preventDefault();
}
window.addEventListener('paste', onPasteProcessLinksImages);

//
// Add keyboard shortcuts
//

function insertBold(target) {
  insertAtCursor(target, '**Bold Text**', (_, selected) => `**${selected}**`);
}

function insertItalic(target) {
  insertAtCursor(target, '*Italic Text*', (_, selected) => `*${selected}*`);
}

function submitComment(textarea) {
  textarea.form.querySelector('button[type="submit"]').click();
}

function toggleCommentPreview(textarea) {
  const btn =
    textarea.form.querySelector('button[title="preview"]') ||
    textarea.form.querySelector('button[title="edit"]');
  if (btn) {
    btn.click();
  } else {
    console.warn('toggleCommentPreview() - cannot find the button to toggle');
  }
}

function handleKeyboardShortcuts(evt) {
  if (!isTalkCommentTextArea(evt.target)) {
    return;
  }
  const keyMap = {
    KeyB: insertBold,
    KeyI: insertItalic,
    Enter: submitComment,
    KeyP: toggleCommentPreview,
  };

  if (evt.ctrlKey) {
    const handler = keyMap[evt.code];
    if (handler) {
      handler(evt.target);
      evt.preventDefault();
    }
  }
}
window.addEventListener('keydown', handleKeyboardShortcuts);

//
// Tweak Talk Search Result
//

function fixSearchResultImgLayout() {
  GM_addStyle(`
  .talk .talk-search-result img, .talk .talk-search-result video {
    /* override the default float: left.
       The default  makes the comment summary below the body squished
       to the right, and becomes harder to be spotted.
       It's particularly confusing when multiple comments have images.
      */
    float: none;

    /* ensure images aren't too large, taking up all the spaces  */
    max-width: 50vw;
    max-height: 25vh;
}
`);
}
fixSearchResultImgLayout();

/**
 * When multiple comments of a given thread / subject matches the search result,
 * condense them into 1 entry.
 */
function condenseSearchResultBySubject() {
  const entries = Array.from(
    document.querySelectorAll('.talk-search-results > .talk-search-result'),
  );
  if (entries.length < 1) {
    return null;
  }

  GM_addStyle(`
.talk-search-result.thread-seen {
  display: none;
}
`);

  const threadCountMap = {}; // number of comments for a given thread in search result
  const uniqThreadMap = {};
  function incCount(threadUrl, srEl) {
    const cur = threadCountMap[threadUrl] || 0;
    threadCountMap[threadUrl] = cur + 1;
    if (cur < 1) {
      uniqThreadMap[threadUrl] = srEl;
    }
    return cur + 1;
  }

  entries.forEach((sr) => {
    const threadUrl = sr.querySelector('.preview-content h1 a').href;
    const countSoFar = incCount(threadUrl, sr);
    if (countSoFar > 1) {
      sr.classList.add('thread-seen');
    }
  });

  // indicate in thread /  subjects that there are multiple matches
  for (const threadUrl in threadCountMap) {
    const count = threadCountMap[threadUrl];
    if (count > 1) {
      const sr = uniqThreadMap[threadUrl];
      sr.querySelector('.preview-content h1 a').insertAdjacentHTML(
        'afterend',
        `
<span title="additional matches"> (+${count - 1})</span>`,
      );
    }
  }

  return [threadCountMap, uniqThreadMap]; // only useful for debugging
} // function condenseSearchResultBySubject() {

function highlightSearchTermInResults() {
  let [, term] = location.search.match(/[?&]query=([^&]+)/) || [null, null];
  if (!term) {
    return;
  }
  term = term.replaceAll('+', ' '); // space got encoded as +
  term = decodeURIComponent(term);

  const entries = Array.from(
    document.querySelectorAll('.talk-search-results > .talk-search-result'),
  );
  if (entries.length < 1) {
    return null;
  }

  GM_addStyle(`
.talk-search-result .markdown .hl {
  background-color: rgba(255, 192, 0, 0.7);
}
`);

  entries.forEach((sr) => {
    const body = sr.querySelector('.markdown');
    body.innerHTML = body.innerHTML.replaceAll(
      term,
      `<span class="hl">${term}</span>`,
    );
  });
} // function highlightSearchTermInResults() {

function showSearchCountOnTitle() {
  if (!location.pathname.endsWith('/talk/search')) {
    return;
  }

  const searchTerm = (() => {
    const [, term] = location.search.match(/query=([^&]+)/) || [null, ''];
    return decodeURIComponent(term);
  })();

  const searchCountMsg = document.querySelector(
    '.talk-search-counts',
  )?.textContent;
  if (searchCountMsg) {
    // case search has matches
    const [, count] = searchCountMsg.match(/returned\s+(\d+)/) || [null, null];
    document.title = `(${count}) - Search ${searchTerm} | Zooniverse Talk`;
    return;
  }

  if (document.querySelector('.talk-search button + p')) {
    // case No results found.
    document.title = `(0) - Search ${searchTerm} | Zooniverse Talk`;
    return;
  }
  console.warn(
    'showSearchCountOnTitle(): Expected DOM elements not found. Perhaps the ajax load is not yet complete.',
  );
}

function tweakSearchResult() {
  if (!location.pathname.endsWith('/talk/search')) {
    return;
  }
  console.debug('tweakSearchResult() called');
  condenseSearchResultBySubject();
  highlightSearchTermInResults();

  // tweak title, do it multiple times because some ZN's own ajax code
  // could overwrite it.
  setTimeout(showSearchCountOnTitle, 10);
  setTimeout(showSearchCountOnTitle, 1000);
  setTimeout(showSearchCountOnTitle, 4000);
  // upon focus ZN codes change the title again, so we fight it.
  window.addEventListener('focus', showSearchCountOnTitle);
}

// better implementation would wait till SearchResult ajax is rendered.
// Use setTimeout as a crude approximation
// TODO: the tweaks are not applied upon result pagination, as it is done via ajax
setTimeout(tweakSearchResult, 4000);

function tweakTalkThread() {
  const subscribeBtn = document.querySelector(
    '.talk-discussion-follow .single-submit-button',
  );
  if (!subscribeBtn) {
    return;
  }

  if (subscribeBtn.textContent === 'Unsubscribe') {
    // highlight it so that one can easily know they have already subscribed
    // - it's done by adding the inner <span> so that if user unsubscribe it
    //   Zooniverse's logic would naturally destroy the highlight.
    const descEl = document.querySelector(
      '.talk-discussion-follow .description',
    );
    descEl.innerHTML = `<span style="background-color: rgba(255, 192, 0, 0.8); padding: 0.2ex 1ch;">${descEl.textContent}</span>`;
  }
}
setTimeout(tweakTalkThread, 4000); // use setTimeout to wait for ajax rendering done

// Double click on talk sidebar heading to expand talk message body's width.
// Useful when there is large graph in messages.
GM_addStyle(`/* expand talk message body by shrinking right sidebar and left author */
.talk.expand-body .talk-sidebar {
  max-width: 40px;
  white-space: nowrap;
}
.talk.expand-body .talk-comment-author {
  width: 100px;
}
.talk.expand-body .talk-comment-body {
  width: calc(100% - 100px);
}

.talk-sidebar h3 { /* visual hint that the heading is clickable */
  cursor: pointer;
}
`);
function toggleTalkBodyWidthOnDblClick(evt) {
  if (
    !(
      (isElementOrAncestor(evt.target, (el) => el.tagName === 'H3') &&
        isElementOrAncestor(evt.target, (el) =>
          el.classList.contains('talk-sidebar'),
        )) ||
      evt.target.classList.contains('talk-sidebar')
    )
  ) {
    return;
  }
  // we only accept double click in the heading of talk sidebar, or the sidebar empty area

  document.querySelector('.talk').classList.toggle('expand-body');
  evt.preventDefault();
}
window.addEventListener('dblclick', toggleTalkBodyWidthOnDblClick);

//
// Restyle quotes (markdown > ...), so that the text looks more solid.
//
GM_addStyle(`
.talk .talk-comment .markdown > blockquote {
  opacity: 0.75;  /* override the default 0.5 */
  border-left: 3px solid grey;
  margin-left: 6px;
  padding-left: 18px;
}
`);
