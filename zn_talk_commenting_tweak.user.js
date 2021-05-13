// ==UserScript==
// @name        Zooniverse Talk - Better Commenting
// @namespace   zooniverse.org
// @match       https://www.zooniverse.org/*
// @grant       GM_addStyle
// @noframes
// @version     1.4.0
// @author      -
// @description For zooniverse talk, provides shortcuts in typing comments. 1) when the user tries to paste a link / link to image,
//              it will be converted to markdown automatically. 2) Keyboard shortcuts for bold (Ctrl-B) and italic (Ctrl-I).
// @icon        https://www.zooniverse.org/favicon.ico
// ==/UserScript==


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
      return `[Title](${text})`;
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
      return text.replace(/(Alt Title|Title)/, selectedText);
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
