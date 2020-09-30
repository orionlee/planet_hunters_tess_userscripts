// ==UserScript==
// @name        TESS - ExoFOP tweak
// @namespace   astro.tess
// @match       https://exofop.ipac.caltech.edu/tess/target.php?id=*
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @noframes
// @version     1.1.1
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

//
// Generate modified SIMBAD URLs to pass along TIC's identifiers, etc.
// to aid in checking the result from SIMBAD link refers to the same object or not.
// (The SIMBAD link is coordinate-based, so at times it might be off target if there are nearby stars.)
//
function getAliases() {
  return document.querySelector('a[name="basic"] ~ table tr:last-of-type td:first-of-type').textContent;
}

function getOtherParams() {
  function getDistance() {
    return (document.querySelector('a[name="stellar"] ~ table tr:nth-child(4) > td:nth-child(17)') || { textContent: ''})
      .textContent;
  } // function getDistance()


  function getMagnitudeOfRow(trEl) {
    if (!trEl) {
      return '';
    }
    return trEl.querySelector('td:nth-child(1)').textContent + '-' + trEl.querySelector('td:nth-child(2)').textContent;
  }

  function getMagnitudes() {
    // try to get magnitudes in B and V bands
    // - row 3 is usually TESS band, rows 1 and 2 are headers
    return getMagnitudeOfRow(document.querySelector('a[name="magnitudes"] ~ table tr:nth-child(4)'))
      + ', '
      + getMagnitudeOfRow(document.querySelector('a[name="magnitudes"] ~ table tr:nth-child(5)'));
  }

  return `Distance(pc): ${getDistance()} ; Magnitudes: ${getMagnitudes()} ;`;
} // function getOtherParams()

function getCoord() {
  const raDecEl = document.querySelector('a[name="basic"] ~table tbody tr:nth-of-type(3) td:nth-of-type(3)');
  const raDecMatch = raDecEl ? raDecEl.textContent.match(/([0-9:.]+)\s([0-9:.+-]+)[.\n\r]+([0-9.+-]+)°\s+([0-9.+-]+)°/) : null;
  if (raDecMatch) {
    return {
             ra:      raDecMatch[1],
             dec:     raDecMatch[2],
             ra_deg:  raDecMatch[3],
             dec_deg: raDecMatch[4],
           };
  }
  console.warn('getCoord() - cannot find coordinate: ', raDecEl);
  return null;
}
const coord = getCoord();

const simbadLinkEl = document.querySelector('a[target="simbad"]');
if (simbadLinkEl) {
  // add links to SIMBAD, VSX to the top

  const vsxUrl = 'https://www.aavso.org/vsx/index.php?view=search.top' +
    ((coord != null) ? `#coord=${encodeURIComponent(coord.ra + ' ' + coord.dec)}`  : '');
  document.querySelector('a[href="/tess"]').insertAdjacentHTML('afterend', `\
<span style="background-color: #ccc; padding: 0.3em 2ch;">
  ${simbadLinkEl.outerHTML} |
  <a href="${vsxUrl}" target="vsx" title="Variable Star Index, requires one to enter coordinates manually">VSX</a>
  <svg class="svg-inline--fa fa-external-link-alt fa-w-18" aria-hidden="true" data-prefix="fas" data-icon="external-link-alt" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M576 24v127.984c0 21.461-25.96 31.98-40.971 16.971l-35.707-35.709-243.523 243.523c-9.373 9.373-24.568 9.373-33.941 0l-22.627-22.627c-9.373-9.373-9.373-24.569 0-33.941L442.756 76.676l-35.703-35.705C391.982 25.9 402.656 0 424.024 0H552c13.255 0 24 10.745 24 24zM407.029 270.794l-16 16A23.999 23.999 0 0 0 384 303.765V448H64V128h264a24.003 24.003 0 0 0 16.97-7.029l16-16C376.089 89.851 365.381 64 344 64H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V287.764c0-21.382-25.852-32.09-40.971-16.97z"></path></svg>
</span>`);

  // Add aliases to simbad links
  Array.from(document.querySelectorAll('a[target="simbad"]'), (a) => a.href += `#aliases=${getAliases()}&other_params=${getOtherParams()}`);

} else {
  console.warn('Cannot find Links to SIMBAD');
}


//
// Highlight observation notes if any
//
const observationNoteBtn = document.querySelector('button.commentsbtn');
if (observationNoteBtn && observationNoteBtn.textContent.trim() !== 'Open Observing Notes (0)') {
  GM_addStyle(`
@keyframes blink-color {
  from {
    color: white;
    margin-left: 5px;
  }
  to {
    color: yellow;
    margin-left: 0px;
  }
}

.blinked {
  animation-name: blink-color;
  animation-duration: 1s;
  animation-iteration-count: 5;
  animation-play-state: paused; /* start only when the tab is visible */
  font-weight: bold;
  color: yellow;
}
`);
  observationNoteBtn.classList.add('blinked');

  // start blink animation only when the tab is visible
  const startAnimate = () => {
    if (!document.hidden) {
      observationNoteBtn.style.animationPlayState = 'running';
    }
  };
  document.addEventListener("visibilitychange", startAnimate, false);
}

// Highlight TOI / CTOI tables if there are entries.
(() => {
  GM_addStyle(`\
table.highlighted tr:nth-of-type(1) th {
    background-color: rgba(255, 255, 0, 0.7);
}`);

  function highlightSectionTableIfNonEmpty(anchorName, numHeaderRows) {
    const numTrs = document.querySelectorAll(`a[name="${anchorName}"] + table tr`).length;
    if (numTrs > numHeaderRows) {
      document.querySelector(`a[name="${anchorName}"] + table`).classList.add('highlighted');
    } else if (numTrs < 1) {
      console.warn('highlightSectionTableIfNonEmpty() no Rows founds, CSS path to the table possibly outdated. anchor:', anchorName);
    }
  }

  highlightSectionTableIfNonEmpty('tois', 3);
  highlightSectionTableIfNonEmpty('ctois', 2);
})();

// Extract coordinate for ease of copy/paste
if (coord) {
  // put the copy button at the header, (reducing the need of horizontal scrolling)
  const headerEl = document.querySelector('a[name="basic"] ~table tbody tr:nth-of-type(2) th:nth-of-type(3)');
  headerEl.insertAdjacentHTML('beforeend', '<br><button id="raDecCopyCtl" style="font-size: 80%;">Copy</button>');
  document.getElementById('raDecCopyCtl').onclick = (evt) => {
    const raDecStr = `${coord.ra_deg} ${coord.dec_deg}`;
    GM_setClipboard(raDecStr);
    evt.target.textContent = 'Copied';
  }
}
