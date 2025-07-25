// ==UserScript==
// @name        Vizier UI tweak
// @namespace   astro.tess
// @match       https://vizier.cds.unistra.fr/viz-bin/VizieR-S?*
// @match       https://vizier.cds.unistra.fr/viz-bin/VizieR-*
// @match       https://vizier.cfa.harvard.edu/viz-bin/VizieR-S?*
// @match       https://vizier.cfa.harvard.edu/viz-bin/VizieR-*
// @noframes
// @grant       GM_addStyle
// @version     1.10.1
// @author      -
// @description
// @icon        http://vizier.u-strasbg.fr/favicon.ico
// ==/UserScript==

// For single target page, in URL pattern
// http://vizier.u-strasbg.fr/viz-bin/VizieR-S?*
//
function addExternalLinks() {
  if (location.pathname != '/viz-bin/VizieR-S') {
    return;
  }
  const id = location.search?.replace(/^[?]/, '');
  if (!id) {
    return;
  }

  document.querySelector('.cdsPageTitle h1').insertAdjacentHTML('afterend', `
<div id="extLinksCtr" style="
    text-align: center;
    font-size: 80%;
">
    <a href="http://simbad.u-strasbg.fr/simbad/sim-id?Ident=${id}">SIMBAD</a>&emsp;|&emsp;<a href="https://aladin.u-strasbg.fr/AladinLite/?target=${id}&fov=0.08">Aladin Lite</a>
</div>`);
  console.debug(document.getElementById('extLinksCtr'));
}
addExternalLinks();


function isSearchForm() {
  // the URL for search form and search result is somewhat similar
  // So we use a heuristics, looking search form's checkboxes for columns to display
  return document.querySelector(`input[name="-out"][type="checkbox"]`);
}


// For search result (possibly with multiple rows) pages with pattern
//   https://vizier.cds.unistra.fr/viz-bin/VizieR-1?   (VizieR-2, VizieR-3, VizieR-4, ...)
// This function tweak those that search across multiple tables, e.g.,
// https://vizier.cds.unistra.fr/viz-bin/VizieR-4?-source=+I%2F358&-from=nav&-nav=cat%3AI%2F358%26tab%3A%7BI%2F358%2Fvclassre%7D%26key%3Asource%3DI%2F358%2Fvclassre%26pos%3A20%3A41%3A37.07+%2B43%3A50%3A12.27%28+++2+arcmin+J2000%29%26HTTPPRM%3A%26%26-ref%3DVIZ637fa85316752f%26-out.max%3D50%26-out.form%3DHTML+Table%26-out.add%3D_r%26-sort%3D_r%26-order%3DI%26-oc.form%3Dsexa%26-c%3D20%3A41%3A37.07+%2B43%3A50%3A12.27%26-c.eq%3DJ2000%26-c.r%3D5%26-c.u%3Darcsec%26-c.geom%3Dr%26-out.src%3DI%2F358%2Fvclassre%26-out.orig%3Dstandard%26-out%3DSource%26-out%3DSolID%26-out%3DClassifier%26-out%3DClass%26-out%3DRA_ICRS%26-out%3DDE_ICRS%26-out%3D_RA.icrs%26-out%3D_DE.icrs%26-meta.ucd%3D2%26-meta%3D1%26-meta.foot%3D1%26-meta.form%3D1%26-usenav%3D1%26-bmark%3DPOST%26
// https://vizier.cds.unistra.fr/viz-bin/VizieR-4?-ref=VIZ638112dc1d2c37&-to=-4b&-from=-4&-this=-4&%2F%2Fsource=I%2F358%2Fvclassre&-out.max=50&%2F%2FCDSportal=http%3A%2F%2Fcdsportal.u-strasbg.fr%2FStoreVizierData.html&-out.form=HTML+Table&-out.add=_r&%2F%2Foutaddvalue=default&-order=I&-oc.form=sexa&-nav=cat%3AI%2F358%26key%3Asource%3DI%2F358%2Fvclassre%26pos%3A20%3A27%3A53.85+%2B63%3A24%3A53.58%28+++2+arcmin+J2000%29%26HTTPPRM%3A&-c=20%3A27%3A53.85+%2B63%3A24%3A53.58&-c.eq=J2000&-c.r=++1&-c.u=arcsec&-c.geom=r&-source=&-source=+I%2F358&-out.src=I%2F358%2Fvclassre&-out.orig=standard&-out=Source&-out=SolID&-out=Classifier&-out=Class&-out=RA_ICRS&-out=DE_ICRS&-out=_RA.icrs&-out=_DE.icrs&-meta.ucd=2&-meta=1&-meta.foot=1&-meta.form=1&-usenav=5&-bmark=GET
//  ^^^ bookmark URL pattern
function hideEmptyTableInMulitTableSearchResults() {
  // only support patterns like /viz-bin/VizieR-4
  if (!location.pathname.match(/^\/viz-bin\/VizieR-\d+/)) {
    return;
  }
  if (isSearchForm()) {
    return;
  }

  GM_addStyle(`
.empty {
  display: none;
}

.show-empty .empty {
  display: inherit;
}

/* table description element,
  increase vetical spacing to distinguish one table from another */

table.sort {  /* Search result of a Vizier table */
  padding-bottom: 0.5em;
  border-bottom: 1px lightgray dashed;
}

table.tablist { /* Description of a Vizier table */
  margin-top: 1.0em !important;
}

table.tabList tr > td > b > a { /* Vizier table names. Make them stand out more */
  font-family: serif;
  font-size: 110%;
}

`);

  let numTablesHidden = 0;
  function hideOneEmptyTable(tabEl) {
    // tabEl should be a message indicating there is no row for the given table, e.g.,
    // <span class="warning">No object found around (ICRS) position 20:41:37.1+43:50:12</span>
    if (!(
      tabEl.tagName == 'SPAN' &&
      tabEl.classList.contains('warning') &&
      tabEl.textContent.startsWith('No object found')
      )) {
      return;
    }
    numTablesHidden++;
    tabEl.classList.add('empty');
    tabEl.previousElementSibling.classList.add('empty');  // The <div> for Start AladinLite
    tabEl.previousElementSibling.previousElementSibling.classList.add('empty');  // The actual <table>
  }

  document.querySelectorAll('span.warning').forEach(hideOneEmptyTable);
  console.debug('hideEmptyTableInMulitTableSearchResults(): Num. of tables hidden =', numTablesHidden);
  if (numTablesHidden > 0) {
    document.querySelector("#CDScore")?.insertAdjacentHTML('beforeend', `
<div id="hiddenTablesMsg" style="font-family: monospace; font-size: 0.9rem; padding-top: 0.5rem;">
${numTablesHidden} empty tables(s) hidden.
&ensp;<button id="ctlShowHideEmptyTables">Toggle</button>
</div>`);
    document.getElementById('ctlShowHideEmptyTables').onclick = (evt) => {
      document.documentElement.classList.toggle('show-empty');
      evt.preventDefault();
    };
  }
}
hideEmptyTableInMulitTableSearchResults();


// Show num of records found on the title
function summarizeNumEntriesInTitle() {
  // only support patterns like /viz-bin/VizieR-4
  if (!location.pathname.match(/^\/viz-bin\/VizieR-\d+/)) {
    return;
  }
  if (isSearchForm()) {
    return;
  }

  // each element is the metadata of a table, e.g.,  I/355/gaiadr3 Gaia DR3 Part 1....
  const allTableMeta = document.querySelectorAll('table.tabList');
  const numOfTables = allTableMeta.length

  if (numOfTables < 1) {
    // no query result table, e.g., case the URL is the detailed view of a single row
    return;
  }

  // We're sure it's query result table view (possibly multiple tables)
  // Proceed with main logic

  // all non-empty tables
  // 2024-09-13: the selector 'table.tabList + div + table.sort' is too restrictive
  //
  // e.g., https://vizier.cds.unistra.fr/viz-bin/VizieR-4?-source=J%2FA%2BA%2F677%2FA137%2Fcatalog&Source=4509671650278976384
  // to match it soemthing like 'table.tabList :parent + div + table.sort, but :parent does not exist
  // the simpler table.sort seems to match sufficeintly well.
  const tableEls = Array.from(document.querySelectorAll('table.sort'));

  // the first <tr> is actually table header, so it's excldued by the CSS selector
  const numRowsOfTables = tableEls.map( tab => tab.querySelectorAll('tr:nth-child(n+2)').length);
  numRowsOfTables.push(0)  // accomodate case no non-empyt table
  const maxNumOfRows = Math.max.apply(null, numRowsOfTables);

  const firsTableName = allTableMeta[0].querySelector('b')?.textContent; //. e.g., I/355/gaiadr3
  const multiTabStr = numOfTables > 1 ? " ++" : "";

  document.title = `(${maxNumOfRows}) ${firsTableName}${multiTabStr} | ${document.title}`;
}
summarizeNumEntriesInTitle();


// Annotate frequency values in 1/d with correspond period.
//
// The logic is intended for Gaia DR3 Variable I/358 tables, but is
// applicable to any column with title "Freq 1/d."
function annotateFrequencyValuesWithPeriod() {
  // only support patterns like /viz-bin/VizieR-4
  if (!location.pathname.match(/^\/viz-bin\/VizieR-\d+/)) {
    return;
  }
  if (isSearchForm()) {
    return;
  }

  function doAnnotatOnTable(tabEl) {
    const freqColIdx = (() => {
      const FREQ_HEADERS = [
        "Freqd-1",  // typical found in, e.g., I/358/veb
        "frequencyd-1", // I/358/veb, but from the table view link
                        // in the detail single object view
                        // (the header uses the long name in the detail view)
        "Freq1/d",  // Freq1/d used by I/358/vmsosc
      ];
      const thEls = tabEl.querySelectorAll('tr:first-of-type th');
      for (i = 0; i < thEls.length; i++) {
        if (FREQ_HEADERS.includes(thEls[i].textContent.replace(/[\r\n\s]/g, ""))) {
          return i + 1;  // 1-based index for CSS selector use
        }
      }
      return 0;
    })();

    if (freqColIdx <= 0) {
      return;
    }
    tabEl.querySelectorAll(`tr td:nth-of-type(${freqColIdx})`).forEach(td => {
      const freqValStr = td?.textContent;
      const freq = parseFloat(freqValStr);
      if (isNaN(freq)) {
        return;
      }
      const per = 1 / freq;
      const freqR = freq.toFixed(4);
      const perR = per.toFixed(4);
      td.outerHTML = `<td align="RIGHT" nowrap="" title="${freqValStr}">${freqR} (${perR}d)</td>`;

    });
    return freqColIdx;
  }


  // We're sure it's query result table view (possibly multiple tables)
  // Proceed with main logic

  // all non-empty tables
  const tableEls = Array.from(document.querySelectorAll('table.tabList + div + table.sort'));
  tableEls.forEach(doAnnotatOnTable);


}
annotateFrequencyValuesWithPeriod();


// Show angular distance of 1st mach for Gaia DR3 Xmatch Known Var in title,
// so one can easily identify cases that the match is far away
// (and likely to be bogus)
function addAngularDistanceOf1stMatchToTitle() {
  if (isSearchForm()) {
    return;
  }

  // add angular distance of the first match to the title

  // first non-empty table
  // Note: for `p + div + table.sort`, it matches some cases
  // where the metadata, table.tabList, is inside a <p> element
  const tableEl = document.querySelector(
    'table.tabList + div + table.sort, p + div + table.sort'

  );
  if (!tableEl) {
    return;  // no match
  }

  const colHeaderText = tableEl.querySelector('tr:nth-of-type(1) th:nth-of-type(2)')?.textContent?.trim();
  // no angular distance in the result, e.g., not a coordinate based query
  if ('_r\narcsec' != colHeaderText) {
    console.warn(
      "addAngularDistanceOf1stMatchToTitle(): the column is not angular distance. " +
      `Actual: ${colHeaderText}`
    );
    return;
  }

  const angDistStr =
    tableEl.querySelector('tr:nth-of-type(2) td:nth-of-type(2)')?.textContent?.trim();
  document.title = `${parseInt(angDistStr)}" ` + document.title;
}
addAngularDistanceOf1stMatchToTitle();


function highlightGaiaDR3XMatchVar() {
  // only applicable to search result of J/A+A/674/A22/catalog :
  // Gaia DR3. Cross-match with known variable objects (Gavras+, 2023)
  //  (the catalog string might be partly URI-encoded.)
  if (
      ( location.search.search('source=J%2FA%2BA%2F674%2FA22%2Fcatalog') < 0 &&
        location.search.search('source=J/A%2bA/674/A22/catalog') < 0 ) ||
      isSearchForm()
     ) {
    return;
  }

  function markSelFlaseRowsInPink() {
    const lastColHeader = document.querySelector('table.sort th:last-of-type')?.textContent?.trim();
    if ('Sel' !== lastColHeader) {
      console.warn(`\
  highlightGaiaDR3XMatchVar(): Expect the last column to be Sel. Actual: ${lastColHeader}. No-op.`);
      return;
    }

    //
    // For rows where Sel == false, hightlight them in light pink
    //
    GM_addStyle(`
  tr.dr3xmatch_sel_false {
      background-color: rgba(255, 0, 0, 0.2);
  }`)

    document.querySelectorAll('table.sort tr').forEach((tr) => {
      if ('true' !== tr.querySelector('td:last-of-type')?.textContent) {
        tr.classList.add('dr3xmatch_sel_false');
      }
    });
  } // function
  markSelFlaseRowsInPink();


  function addLinksToCats() {
    let catColIdx = 0;  // the idx is 1-based, (CSS selector)
    document.querySelectorAll('table.sort th').forEach((th, i) => {
      if (th.textContent.trim() == 'Cats') {
        catColIdx = i + 1;
      }
    });
    if (catColIdx <= 0) {
      return;
    }
    document.querySelectorAll(`table.sort tr td:nth-of-type(${catColIdx}`).forEach(td => {
      const refArys = td.textContent.trim().split(';');
      // convert each ref to a link <a>
      td.innerHTML = refArys.map(t => `<a target="_blank" href="VizieR-4?-source=J/A%2bA/674/A22/notes&Ref=${t}">${t}</a>`).join(" ; ")
    });

  } // function
  addLinksToCats();

}
highlightGaiaDR3XMatchVar();

