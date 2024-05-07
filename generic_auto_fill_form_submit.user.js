// ==UserScript==
// @name        Auto Fill and Submit Form from Hash
// @namespace
// @include     /^https?:\/\/.+#.*autoFillForm=.*/
// @noframes
// @version     1.0
// @author      -
// @description Enables filling and submitting arbitrary form from hash, which can then be used to create URLs to forms with POST action.
// @icon
// ==/UserScript==


//
// The script is applicable to URLs with autoFillForm= in hash
// - userjs @match does not match hash, so @include is used here.
// - But some userjs managers do not support hash matching in @include either.
// - In such case, use the generic mathc-all rule instead :
//    @match       *://*/*
//
// Hash pattern:
// - autoFillForm=<action>, where <action> is the action param of the form element.
//   the first form is used if action is not specified.
// - autoSubmit= , submit the form as well, unless autoSubmit=false
// - form input parameters can be specified with the pattern _i_<name>=<value>
//

function autoFillFormAndSubmit() {
  if (location.hash.indexOf('autoFillForm=') < 0) {
    return false;
  }


  // parse the hash for the form specified and the input to be filled
  let autoSubmit = false;
  let formPath = null;
  const formInputNameValues = {};
  location.hash.replace(/^#/, '').split('&').forEach( (nameValStr) => {
    //  parse <name>=<value>
    let [, name, val] = nameValStr.match(/^([^=]+)=(.*)$/) || [null, nameValStr, ''];
    if (val) {
      val = decodeURIComponent(val);
    }
    /// console.debug('nvs:', nameValStr, '|', name, ' : ', val);
    if (name === 'autoFillForm') {
      formPath = `form[action="${val}"]`;
    } else if (name ==='autoSubmit') {
      autoSubmit = (val != 'false');
    } else if (name?.startsWith("_i_")) {
      name = name.replace(/^_i_/, '');
      formInputNameValues[name] = val;
    }
  });
  /// console.debug('fnv:', formInputNameValues);

  const formEl = (() => {
    if (!formPath) {
      console.info('autoFillFormAndSubmit(): Use the first <form> element');
      return document.querySelector('form');
    } else {
      return document.querySelector(formPath);
    }
  })();

  if (!formEl) {
    console.error('autoFillFormAndSubmit(): no <form> located. No-op.');
    return false;

  }

  // fill the form
  Object.entries(formInputNameValues).forEach(([name, val]) => {
    const inputEl = formEl.querySelector(`input[name="${name}"`);
    if (inputEl) {
      inputEl.value = val;
    } else {
      console.warn(`autoFillFormAndSubmit(): <input> with ${name} not found. It is skipped.`);
    }
  });

  if (autoSubmit) {
    /// console.debug('Submitting the form');
    formEl.submit();
  }
  return true;
}

autoFillFormAndSubmit();
