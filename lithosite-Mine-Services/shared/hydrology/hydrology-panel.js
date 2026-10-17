(function(global){
  'use strict';

  function mountRainfallButton(){
    var host=document.getElementById('dashboardSiteMap');
    var panel=host&&host.closest('.panel');
    var toolbar=panel&&panel.querySelector('.topo3d-toolbar');
    if(!toolbar||toolbar.querySelector('#dashboardHydrologyRainfallToggle'))return;

    var button=document.createElement('button');
    button.type='button';
    button.id='dashboardHydrologyRainfallToggle';
    button.textContent='Rainfall';
    button.title='Rainfall simulation entry point';
    button.setAttribute('aria-label','Rainfall simulation');

    button.addEventListener('click',function(){
      var status=host.querySelector('#dashboardTopo3DStatus');
      if(status){
        status.textContent='Rainfall simulation is not implemented yet.';
        status.classList.remove('error');
      }
    });

    var markerLocation=toolbar.querySelector('#markerLocationToggle');
    if(markerLocation)markerLocation.insertAdjacentElement('afterend',button);
    else toolbar.appendChild(button);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',mountRainfallButton);
  }else{
    mountRainfallButton();
  }
})(window);
