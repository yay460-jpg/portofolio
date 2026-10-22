(function(global){
'use strict';
const POLICY_KEY='lithosite.mine-services.v43.kpi-shift-pair-policy';
const PAIRS=Object.freeze({
 'TB-PROJECT-PAIR-0600-0600':Object.freeze({
  id:'TB-PROJECT-PAIR-0600-0600',name:'Default Pair',
  Day:Object.freeze({start:'06:00',end:'18:00',restStart:'12:00',restEnd:'13:00',overnight:false}),
  Night:Object.freeze({start:'18:00',end:'06:00',restStart:'00:00',restEnd:'01:00',overnight:true})
 }),
 'TB-PROJECT-PAIR-0700-0700':Object.freeze({
  id:'TB-PROJECT-PAIR-0700-0700',name:'Alternate Pair',
  Day:Object.freeze({start:'07:00',end:'18:00',restStart:'12:00',restEnd:'13:00',overnight:false}),
  Night:Object.freeze({start:'19:00',end:'06:00',restStart:'00:00',restEnd:'01:00',overnight:true})
 })
});
const DEFAULT_PAIR=PAIRS['TB-PROJECT-PAIR-0600-0600'];
function getPair(){
 try{
  const saved=global.localStorage&&global.localStorage.getItem(POLICY_KEY);
  const id=saved?JSON.parse(saved).shiftPairId:'';
  return PAIRS[id]||DEFAULT_PAIR;
 }catch(error){return DEFAULT_PAIR;}
}
function getShift(shift){const pair=getPair();return shift==='Day'?pair.Day:shift==='Night'?pair.Night:null;}
function minutes(value){
 const m=String(value||'').slice(0,5).match(/^(\d{2}):(\d{2})$/);
 if(!m)return null;
 const hours=Number(m[1]),mins=Number(m[2]);
 return hours<24&&mins<60?hours*60+mins:null;
}
function isTimeInShift(shift,time){
 const spec=getShift(shift),value=minutes(time);
 if(!spec||value===null)return false;
 const start=minutes(spec.start),end=minutes(spec.end);
 return end>start?(value>=start&&value<end):(value>=start||value<end);
}
function suggestShift(time){
 if(isTimeInShift('Day',time))return 'Day';
 if(isTimeInShift('Night',time))return 'Night';
 return '';
}
function describeShift(shift){
 const pair=getPair(),spec=getShift(shift);
 if(!spec)return pair.name+': Day '+pair.Day.start+'–'+pair.Day.end+' / Night '+pair.Night.start+'–'+pair.Night.end+' next day';
 return shift+' '+spec.start+'–'+spec.end+(spec.overnight?' next day':'')+' (rest '+spec.restStart+'–'+spec.restEnd+') · '+pair.name;
}
function shiftAnchorDate(date,time,shift){
 const day=String(date||'').slice(0,10),value=minutes(time),spec=getShift(shift);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!spec||!spec.overnight||value===null||value>=minutes(spec.end))return day;
 const parts=day.split('-').map(Number),d=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
 d.setUTCDate(d.getUTCDate()-1);
 return d.toISOString().slice(0,10);
}
global.LithositeShiftTime=Object.freeze({
 policyKey:POLICY_KEY,getPair,getShift,isTimeInShift,suggestShift,describeShift,shiftAnchorDate
});
})(window);
