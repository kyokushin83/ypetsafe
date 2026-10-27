(function(root){'use strict';
function assess(record,pet,symptoms=false){
 if(symptoms)return 'symptoms';if(!record)return 'none';
 const n=Number(record.temp);if(!Number.isFinite(n))return 'none';
 if(record.method==='chip'){
  if(n<30||n>45)return 'sensor';
  if(n>=40.5||n<=35)return 'chipExtreme';
  if(pet?.baseline==null)return 'chipNoBase';
  return Math.abs(n-Number(pet.baseline))>=Number(pet.threshold||.5)?'chipShift':'chipStable';
 }
 if(n>=40.5)return 'urgentHigh';if(n<=37)return 'urgentLow';
 if(n>39.2)return 'high';if(n<37.5)return 'low';return 'normal';
}
function trend(records){
 const rows=records.filter(r=>r.method!=='chip'||(r.temp>=30&&r.temp<=45)).slice().sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
 if(rows.length<3)return 'needMore';const a=rows.slice(-3);
 if(Date.parse(a[2].time)-Date.parse(a[0].time)<=86400000&&a[1].temp>a[0].temp&&a[2].temp>a[1].temp&&a[2].temp-a[0].temp>=.5)return 'rising';
 if(Date.parse(a[2].time)-Date.parse(a[0].time)<=86400000&&a[1].temp<a[0].temp&&a[2].temp<a[1].temp&&a[0].temp-a[2].temp>=.5)return 'falling';
 const prev=rows.at(-2),last=rows.at(-1);
 if(Date.parse(last.time)-Date.parse(prev.time)<=3600000&&Math.abs(last.temp-prev.temp)>=1)return 'rapid';
 return 'steady';
}
function validateBackup(value){
 if(value?.format!=='ypet-vitals-v1'||!Array.isArray(value.pets)||!Array.isArray(value.records)||value.pets.length>300||value.records.length>5000)return false;
 const ids=new Set();
 for(const p of value.pets){if(typeof p.id!=='string'||p.id.length>100||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>40||p.chip!=null&&(typeof p.chip!=='string'||!/^\d{15}$/.test(p.chip))||p.baseline!=null&&(!Number.isFinite(p.baseline)||p.baseline<30||p.baseline>45)||p.threshold!=null&&(!Number.isFinite(p.threshold)||p.threshold<.2||p.threshold>2))return false;ids.add(p.id);}
 const seen=new Set();for(const r of value.records){if(typeof r.id!=='string'||r.id.length>100||seen.has(r.id)||!ids.has(r.petId)||!['chip','rectal'].includes(r.method)||typeof r.temp!=='number'||!Number.isFinite(r.temp)||r.temp<20||r.temp>45||!Number.isFinite(Date.parse(r.time))||Date.parse(r.time)>Date.now()+300000||r.note!=null&&(typeof r.note!=='string'||r.note.length>300)||r.chip!=null&&(typeof r.chip!=='string'||!/^\d{15}$/.test(r.chip)))return false;seen.add(r.id);}
 return true;
}
const api={assess,trend,validateBackup};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VitalsModel=api;
})(typeof window!=='undefined'?window:globalThis);
