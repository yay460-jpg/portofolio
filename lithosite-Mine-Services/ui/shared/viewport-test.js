/* Temporary 1366 × 768 viewport frame toggle for responsive QA. */
(function(){
  'use strict';
  function initViewportTest(){
    const topbar=document.querySelector('.topbar');
    if(!topbar||document.getElementById('viewportTestToggle'))return;
    const button=document.createElement('button');
    button.type='button';
    button.id='viewportTestToggle';
    button.className='viewport-test-toggle';
    button.setAttribute('aria-label','Enable 14-inch viewport test');
    button.setAttribute('aria-pressed','false');
    button.title='Temporary 14-inch viewport test (1366 × 768)';
    button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>';
    const meta=topbar.querySelector('.topmeta');
    if(meta)meta.insertAdjacentElement('afterend',button);
    else topbar.appendChild(button);
    const setMode=function(enabled){
      document.body.classList.toggle('viewport-test-mode',enabled);
      button.setAttribute('aria-pressed',String(enabled));
      button.setAttribute('aria-label',enabled?'Exit 14-inch viewport test':'Enable 14-inch viewport test');
      button.title=enabled?'Return to normal application view':'Temporary 14-inch viewport test (1366 × 768)';
      button.style.order=enabled?'1':'';
    };
    button.addEventListener('click',function(){
      setMode(button.getAttribute('aria-pressed')!=='true');
    });
    document.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&button.getAttribute('aria-pressed')==='true')setMode(false);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initViewportTest,{once:true});
  else initViewportTest();
})();
