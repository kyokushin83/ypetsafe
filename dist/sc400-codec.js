/* SC400 F1 decoder: sample-verified layout; checksum algorithm not supplied by the manufacturer. */
(function(root){
'use strict';
const SIGN=[0xFE,0x9B,0x81,0x01,0xF1];
function decode(input){
 const b=Uint8Array.from(input);
 if(b.length!==24||!SIGN.every((v,i)=>b[i]===v)||b[5]!==17||b[6]!==0)return null;
 if(b[14]!==0||b[15]>50||b[16]>9)return null;
 let code=0n;for(let i=8;i<14;i++)code=(code<<8n)|BigInt(b[i]);
 const country=Number(code>>38n),national=code&((1n<<38n)-1n);
 if(country<1||country>999)return null;
 const parts=Array.from(b.slice(17,23));
 if(parts[1]<1||parts[1]>12||parts[2]<1||parts[2]>31||parts[3]>23||parts[4]>59||parts[5]>59)return null;
 const year=2000+parts[0],test=new Date(Date.UTC(year,parts[1]-1,parts[2]));
 if(test.getUTCMonth()!==parts[1]-1||test.getUTCDate()!==parts[2])return null;
 const temp=Number((b[15]+b[16]/10).toFixed(1));
 return {chip:String(country).padStart(3,'0')+national.toString().padStart(12,'0'),temp,deviceTime:`${year}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')} ${parts.slice(3).map(v=>String(v).padStart(2,'0')).join(':')}`,hex:Array.from(b).map(v=>v.toString(16).padStart(2,'0').toUpperCase()).join('-'),sensorInRange:temp>=30&&temp<=45,checksumVerified:false};
}
class Stream{
 constructor(){this.buffer=[];}
 push(bytes){
  this.buffer.push(...bytes);if(this.buffer.length>4096)this.buffer=this.buffer.slice(-512);
  const frames=[];
  while(this.buffer.length>=2){
   const start=this.buffer.findIndex((v,i)=>v===0xFE&&this.buffer[i+1]===0x9B);
   if(start<0){this.buffer=this.buffer.at(-1)===0xFE?[0xFE]:[];break;}
   if(start)this.buffer.splice(0,start);
   if(this.buffer.length<7)break;
   const len=7+this.buffer[5]+256*this.buffer[6];
   if(len!==24||!SIGN.every((v,i)=>this.buffer[i]===v)){this.buffer.shift();continue;}
   if(this.buffer.length<len)break;
   const packet=this.buffer.slice(0,len);const frame=decode(packet);
   if(frame){frames.push(frame);this.buffer.splice(0,len);}else this.buffer.shift();
  }
  return frames;
 }
}
const api={decode,Stream};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SC400Codec=api;
})(typeof window!=='undefined'?window:globalThis);
