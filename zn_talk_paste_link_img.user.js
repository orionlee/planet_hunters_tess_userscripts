// ==UserScript==
// @name        Zooniverse Talk - Better Paste Links and Images
// @namespace   zooniverse.org
// @match       https://www.zooniverse.org/*
// @grant       none
// @noframes
// @version     1.0.1
// @author      -
// @description For zooniverse talk, when the user tries to paste a link / link to image,
//              it will be converted to markdown automatically.
// @icon        https://www.zooniverse.org/favicon.ico
// ==/UserScript==


function insertAtCursor(textarea, text, transformFn) {
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

    const markdownLinkTitleIdx = text.indexOf('[Title]');
    if (markdownLinkTitleIdx >= 0) {
      // case inserted text is markdown link, select the title so that the user can replace it.
      // OPEN: the logic of handling markdown link text differently should not have baked into this generic function
      textarea.setSelectionRange(startPos + markdownLinkTitleIdx + 1,
        startPos + markdownLinkTitleIdx + 1 + 'Title'.length);
    } else {
      // default: move cursor to the end of the selection.
      textarea.setSelectionRange(startPos + text.length, startPos + text.length);
    }

  } else {
      textarea.value += text;
  }
}

// if the text is link / link to images, convert the text to markdown.
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

function onPasteProcessLinksImages(evt) {
  // only trap those pasting to  talk comments
  if (!(evt.target && evt.target.tagName === 'TEXTAREA'
    && evt.target.classList.contains('markdown-editor-input'))) {
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
  insertAtCursor(evt.target, paste, (text, selectedText) => {
      // use selected text as the labels in the markdown
      return text.replace(/(Alt Title|Title)/, selectedText);
  })
  // OPEN: after the textarea is changed, somehow zooniverse won't recognize the changes unless
  // the user types something more in the textarea.
  // If the user simply moves around by pressing arrow keys, it won't work either. The user must
  // type something.
  //
  // Attempts to simulate to pressing space so far yields nothing.
  evt.preventDefault();
}
window.addEventListener('paste', onPasteProcessLinksImages);
