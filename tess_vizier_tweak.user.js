// ==UserScript==
// @name        Vizier UI tweak
// @namespace   astro.tess
// @match       https://vizier.cds.unistra.fr/viz-bin/VizieR-S?*
// @match       http://vizier.u-strasbg.fr/viz-bin/VizieR-S?*
// @match       https://vizier.cds.unistra.fr/viz-bin/VizieR-*
// @noframes
// @grant       GM_addStyle
// @version     1.4.0
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
    document.querySelector("#CDScore > table:last-of-type")?.insertAdjacentHTML('afterend', `
<div id="hiddenTablesMsg" style="font-family: monospace; font-size: 0.9rem; padding-top: 0.5rem;">
${numTablesHidden} empty tables(s) hidden.
</div>`);
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
  const tableEls = Array.from(document.querySelectorAll('table.tabList + div + table.sort'));

  // the first <tr> is actually table header, so it's excldued by the CSS selector
  const numRowsOfTables = tableEls.map( tab => tab.querySelectorAll('tr:nth-child(n+2)').length);
  numRowsOfTables.push(0)  // accomodate case no non-empyt table
  const maxNumOfRows = Math.max.apply(null, numRowsOfTables);

  const firsTableName = allTableMeta[0].querySelector('b')?.textContent; //. e.g., I/355/gaiadr3
  const multiTabStr = numOfTables > 1 ? " ++" : "";

  document.title = `(${maxNumOfRows}) ${firsTableName}${multiTabStr} | ${document.title}`;
}
summarizeNumEntriesInTitle();
