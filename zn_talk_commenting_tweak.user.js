// ==UserScript==
// @name        Zooniverse Talk - Better Commenting
// @namespace   zooniverse.org
// @match       https://www.zooniverse.org/*
// @grant       GM_addStyle
// @noframes
// @version     1.1.0
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

  const pasteRaw = (event.clipboardData || window.clipboardData).getData('text');
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

function handleKeyboardShortcuts(evt) {
  if (!( isTalkCommentTextArea(evt.target))) {
    return;
  }
  const keyMap = {
    'KeyB': insertBold,
    'KeyI': insertItalic,
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
