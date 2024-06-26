# Enhance Zooniverse Planet Hunters TESS experience

A collection of [userscripts](https://en.wikipedia.org/wiki/Userscript) (aka lightweight browser extensions) to enhance [Zooniverse Planet Hunters TESS](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/classify) experience.

Prerequisites: a userscript manager installed on your browser, e.g., [Tampermonkey](https://www.tampermonkey.net/), [violentmonkey](https://violentmonkey.github.io/), etc.

---

## Script Planter Hunter TESS Tweak

[Click to install](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/zn_planet_hunter_tess.user.js)


- Make lightcurve viewer wider.
- Zooming with mouse wheel: prevent accidental scrolling the browser window.
- On lightcurve viewer: click with middle mouse button toggles between Annotate and Move subject.
- More keyboard shortcuts for lightcurve viewer.
- On subject talk pages:
  - button to let one copy TIC easily.
  - the TIC's links to ExoMAST, ExoFOP and viewing tool (that tells you the sectors a TIC was / will be observed)
  - open search result in a new tab by Ctrl-Enter, Ctrl-Click, or middle button click.
  - Auto link TICs (to ExoFOP and search of Talk)
- *<font color="red">(NEW)</font>* Show subject numbers in a collection so that it is easier to find a subject.
- *<font color="red">(NEW)</font>* Calculator to gauge if a dip's depth could be due to planet-sized objects.

Lightcurve viewer Keyboard shortcuts :

Action | Shortcuts
-------|----------
Move subject| M
Annotate | A, or Comma (next to M for ease of toggle)
Reset | 0, or O
Subject Info| I , or Numpad 1
Done | Ctrl/Shit/Alt/⌘ + Enter
---

## Other helpful scripts

They could be useful if you follow up on ExoMAST, ExoFOP, and SIMBAD

[ExoMAST TCE tweak](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/tess_exomast_tce_tweak.user.js)

- convert transit epoch from MJD to BTJD, and show sector + relative time, so that they can compared to the subjects on Zooniverse.
- provide a warning if the reported planet radius might be way off, e.g., due to lack of star radius at the time of calculation.


[ExoMAST search tweak](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/tess_exomast_search_tweak.user.js)

- auto search the given TIC, that works with the ExoMAST links generated by Subject Talk page with Planter Hunter TESS Tweak above.

[ExoFOP tweak](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/tess_exofop_tweak.user.js) + [SIMBAD tweak](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/tess_simbad_tweak.user.js) +
[VSX tweak](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/tess_vsx_tweak.user.js) + [ASAS-SN tweak](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/tess_asas_sn_tweak.user.js)
- They work together so that when one follows up on SIMBAD / VSX / ASAS-SN from ExoFOP page, you can easily reference the IDs of the target to ensure SIMBAD referenced the same star.
- Consider to add following sets of Vizier tweaks: [auto search](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/tess_vizier_autosearch.user.js), [main tweak](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/tess_vizier_tweak.user.js), and [match id](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/tess_vizier_match_id.user.js)
- For [WTVv2](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/generic_auto_fill_form_submit.user.js), aka Web Viewing Tool v2: auto search the given TIC (from the link of the cusotmized ExoFOP).



### Zooniverse Generic

[(Zooniverse generic) Commenting tweak](https://github.com/orionlee/planet_hunters_tess_userscripts/raw/master/zn_talk_commenting_tweak.user.js)

- For entering comments in Talk, when one pastes a link (or a link to an image), it will be converted into a markdown link or markdown image, effectively doing the job of the link / image  button by simply pasting.
- Provides keyboard shortcuts: `Ctrl-I` for italic, `Ctrl-B` for bold, `Ctrl-Enter` to submit the comment
- On Talk search result pages, tweak the layout so that comments with large images won't skew the layout, e.g., the comment summary at the bottom of each comment will not be pushed to the right anymore.

---

## Screenshots

- Wider lightcurve viewer (by shrinking Done &Talk / Done panel):

![Wide Lightcurve viewer screenshot](https://imgur.com/PLtc0fh.png)
- There is also a dip's depth calculator next to Subject Info. In this case,
  - one could one could estimate the companion causing the dip is about 2 R<sub>jupiter</sub>: too large to be a planet, and likely too small for a proper eclipsing binary.
  - One could then conclude that the lightcurve is likely to be contaminated by a nearby eclipsing binary.

---

- Show subject number while viewing a collection:

![Subject number in a collection](https://imgur.com/X1gAhbf.png)


---

- Highlight TIC IDs in talk, with links to search talk with the TIC and to ExoFOP page on hover:

![TIC IDs on hover tooltip](https://imgur.com/PThBEPt.png)
