/* Orrery Sky Phase 4D-1 - keyboard helpers. Loaded last. Adds NO new visible controls and changes no existing shortcut.
   - Enter in the date, latitude or longitude box presses Go (before, only Tab + Enter on the Go button worked).
   - Escape from any control (or the info card) puts the focus back on the sky view, so the arrow keys, + - = and W A S D act again.
   - The info card (it scrolls when its text is long) becomes a keyboard stop only while it really overflows, so it can be scrolled without a mouse;
     while the card itself has focus the arrow keys scroll it instead of turning the view (camera-input.js honours data-own-arrows).
   Not tested with a real screen reader. */
(function(){'use strict';
const doc=document,$=id=>doc.getElementById(id),cv=$('c'),card=$('card'),ui=$('ui'),go=$('go');
for(const id of['dt','la','lo']){const el=$(id);if(el)el.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&go){e.preventDefault();go.click()}})}
addEventListener('keydown',e=>{if(e.key!=='Escape'||e.defaultPrevented||!cv)return;const t=e.target;
 if(t&&(t===card||(ui&&ui.contains(t))||(card&&card.contains(t)))&&doc.activeElement!==cv){cv.focus();e.preventDefault()}});
if(card){card.setAttribute('data-own-arrows','');
 const fit=()=>{const over=card.scrollHeight>card.clientHeight+1||card.scrollWidth>card.clientWidth+1;
  if(over){if(!card.hasAttribute('tabindex'))card.setAttribute('tabindex','0');card.setAttribute('aria-label','Sky information, scrollable with the arrow keys')}
  else if(card.getAttribute('tabindex')==='0'){if(doc.activeElement===card&&cv)cv.focus();card.removeAttribute('tabindex');card.removeAttribute('aria-label')}};
 if(typeof ResizeObserver==='function')new ResizeObserver(fit).observe(card);
 if(typeof MutationObserver==='function')new MutationObserver(fit).observe(card,{childList:true,subtree:true,characterData:true});
 addEventListener('resize',fit);fit()}
})();
