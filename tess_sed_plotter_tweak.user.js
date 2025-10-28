// ==UserScript==
// @name        SED Plotter UI tweak
// @namespace   astro.tess
// @match       http*://cdsportal.u-strasbg.fr/gadgets/ifr?url=http://cdsportal.unistra.fr/widgets/SED_plotter.xml&*
// @grant       GM_addStyle
// @version     0.9.1
// @author      -
// @description
// @icon        https://cdsportal.u-strasbg.fr/widgets/img/hub-disconnected.png
// ==/UserScript==


// Hide data points that do not have error (could be very unreliable, e.g., for ALLWISE, values with no error is only the upper limit)
function hideNoErrorValues() {

  const trNoErrorValueList = Array.from(document.querySelectorAll('table#SED_plot_results_table_dataTable tr:nth-of-type(n+2)')).filter( tr => {
    return ( tr.querySelector('td:nth-of-type(2)')  &&   // ignore subsection rows (that only has 1 td)
             !tr.querySelector('td:nth-of-type(9)')?.textContent  // those has no value in flux error
            );
  });

  trNoErrorValueList.forEach( (tr, i) => {
    /// console.debug('i: ', i, tr.querySelector('td:nth-of-type(9)')?.textContent, tr.querySelector('td:nth-of-type(10)')?.textContent);
    const elCheckBox = tr.querySelector('input[type="checkbox"]')
    if (elCheckBox?.checked) {
      elCheckBox.click();  // needed to trigger the update on the plot
      elCheckBox.checked = false; // needed to make the checkbox visually unchecked
    }
  });

}


function addUIOfHideNoErrorValues() {
  // wanted to append to document.getElementById('SED_plot_results_opt_a')
  // but it is rendered asynchronously
  // to keep things simple, I just add it to body instead
  document.body.insertAdjacentHTML('beforeend', `
<div style="position:fixed; right: 5px; top: 30px; padding: 6px 6px; background-color:rgba(255, 255, 0, 0.3);">
  <button id="ctlHideNoErrorValues">Hide No-error values</button>
</div>
`);

  document.getElementById('ctlHideNoErrorValues').onclick = hideNoErrorValues;
}
addUIOfHideNoErrorValues();
