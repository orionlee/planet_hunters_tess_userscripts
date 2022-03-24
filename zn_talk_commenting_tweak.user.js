// ==UserScript==
// @name        Zooniverse Talk - Better Commenting
// @namespace   zooniverse.org
// @match       https://www.zooniverse.org/*
// @grant       GM_addStyle
// @noframes
// @version     1.8.1
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
  return text.split(" ").map(capitalize1stLetter).join(" ");
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
    textarea.value = textarea.value.substring(0, startPos)
        + text
        + textarea.value.substring(endPos, textarea.value.length);

    // determine cursor position after the paste, defaulted to the end of the inserted text
    const [selectStart, selectEnd] = (selectFn ? selectFn(text, startPos) : null)
      || [startPos + text.length, startPos + text.length];
    textarea.setSelectionRange(selectStart, selectEnd);
  } else {
      textarea.value += text;
  }
}

//
// if the text to be pasted is link / link to images, convert the text to markdown.
//

const titleForLinkifiedUrlImplList = []
// subsumed by the default extraction logic.
// titleForLinkifiedUrlImplList.push(url => {
//   const [, title] = url.match(/.*[.]wikipedia[.]org\/wiki\/([^#]+)/) || [null, null];
//   return title?.replace(/_/g, ' ');
// });
titleForLinkifiedUrlImplList.push(url => {
  if (url.includes('simbad.u-strasbg.fr/simbad/sim-') ||
      url.includes('simbad.cds.unistra.fr/simbad/sim-')) {
    return 'SIMBAD';
  }
});
titleForLinkifiedUrlImplList.push(url => {
  if (url.includes('www.aavso.org/vsx/index.php?view=detail.top&oid=')) {
    return 'VSX';
  }
});
titleForLinkifiedUrlImplList.push(url => {
  if (url.includes('asas-sn.osu.edu/variables/')) {
    return 'ASAS-SN';
  }
});
titleForLinkifiedUrlImplList.push(url => {
  // TESS GI proposals
  const [, proposalId] = url.match(/heasarc.gsfc.nasa.gov\/docs\/tess\/data\/approved-programs\/[^/]+\/(.+).txt/) || [null, null];
  return proposalId;
});
titleForLinkifiedUrlImplList.push(url => {
  // TESS TCE on exomast
  const [, tceSubId] = url.match(/exo.mast.stsci.edu\/exomast_planet.html\?planet=.+TCE(\d)/) || [null, null];
  return tceSubId ? `TCE${tceSubId}` : null;
});
titleForLinkifiedUrlImplList.push(url => {
  // TESS TCE vetting summary. tceSubId: 1, 2, 3 (of a given sector / sectors)
  const [, tceSubId] = url.match(/exo.mast.stsci.edu\/api\/v0.1\/Download\/file\?uri=mast:TESS\/.+-0*(.+)-\d+_dvs.pdf/) || [null, null];
  return tceSubId ? `TCE${tceSubId} vetting summary` : null;
});
// A generic replacement scheme (should always be the last one!)
titleForLinkifiedUrlImplList.push(url => {
  // match the last portion of an URL path (ignoring query string)
  // for many link, the last portion tends to be the readable name
  // urls pattern to handle include:
  // - static page (possibly with an extension)
  //   https://heasarc.gsfc.nasa.gov/docs/tess/approved-programs.html
  // - with query string:
  //   https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html?searchQuery=%7B%22service%22FooBar
  // - no extension, nor query string
  //   https://en.wikipedia.org/wiki/Gamma_Doradus
  //  - hashes:
  //    https://en.wikipedia.org/wiki/Gamma_Doradus_variable#List
  //  - end with slash
  //    https://en.wikipedia.org/wiki/Gamma_Doradus/

  let [, text] = url.match(/.+\/([a-zA-Z0-9-_]+)([/.?#].*)?$/) || [null, null];
  text = text?.replace(/[-_]/g, " ");
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
  return target && target.tagName === 'TEXTAREA'
    && target.classList.contains('markdown-editor-input');
}

function onPasteProcessLinksImages(evt) {
  // only trap those pasting to  talk comments
  if (!( isTalkCommentTextArea(evt.target))) {
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
  insertAtCursor(evt.target, paste,
    (text, selectedText) => {
      // use selected text as the labels in the markdown
      return text.replace(/\[.+\]/, `[${selectedText}]`);
  },
    (text, startPos) => {
      const markdownLinkTitleIdx = text.indexOf('[Title]');
      if (markdownLinkTitleIdx >= 0) {
        // case inserted text is markdown link, select the title so that the user can replace it.
        // OPEN: the logic of handling markdown link text differently should not have baked into this generic function
        return [startPos + markdownLinkTitleIdx + 1, startPos + markdownLinkTitleIdx + 1 + 'Title'.length];
      } else {
        return null;
      }
    }
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
  const btn = textarea.form.querySelector('button[title="preview"]') ||
    textarea.form.querySelector('button[title="edit"]');
  if (btn) {
    btn.click();
  } else {
    console.warn("toggleCommentPreview() - cannot find the button to toggle");
  }
}


function handleKeyboardShortcuts(evt) {
  if (!( isTalkCommentTextArea(evt.target))) {
    return;
  }
  const keyMap = {
    'KeyB': insertBold,
    'KeyI': insertItalic,
    'Enter': submitComment,
    'KeyP': toggleCommentPreview,
  }

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
  const entries = Array.from(document.querySelectorAll('.talk-search-results > .talk-search-result'));
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

  entries.forEach(sr => {
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
      sr.querySelector('.preview-content h1 a').insertAdjacentHTML('afterend', `
<span title="additional matches"> (+${count - 1})</span>`);
    }
  }

  return [threadCountMap, uniqThreadMap]; // only useful for debugging
}

// better implementation would wait till SearchResult ajax is rendered.
// Use setTimeout as a crude approximation
setTimeout(condenseSearchResultBySubject, 4000);


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
  if (!( (isElementOrAncestor(evt.target, el => el.tagName === 'H3') &&
          isElementOrAncestor(evt.target, el => el.classList.contains('talk-sidebar'))) ||
          evt.target.classList.contains('talk-sidebar')
          )) {
    return;
  }
  // we only accept double click in the heading of talk sidebar, or the sidebar empty area

  document.querySelector('.talk').classList.toggle("expand-body");
  evt.preventDefault();
}
window.addEventListener('dblclick', toggleTalkBodyWidthOnDblClick);
