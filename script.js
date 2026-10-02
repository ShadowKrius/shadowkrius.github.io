function hue(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360;return h}
document.querySelectorAll('[data-list]').forEach(function(box){
  var k=box.dataset.list;
  DATA[k].forEach(function(x){
    var d=document.createElement('div');d.className='tile'+(k==='books'?' book':k==='hikes'?' hike':'');
    var g=hue(x.t+x.a);
    d.style.background='linear-gradient('+(g)+'deg,#2a2a2a,#8a8a8a)';
    d.innerHTML='<span>'+x.t+'<em>'+x.a+'</em></span>';
    if(x.img){var im=new Image();im.alt=x.t;im.loading='lazy';im.onload=function(){d.classList.add('has-img')};im.onerror=function(){im.remove()};im.src=x.img;d.insertBefore(im,d.firstChild)}
    box.appendChild(d);
  });
});
/* tabs */
var tabs=document.querySelectorAll('.tabs button');
tabs.forEach(function(b){b.onclick=function(){
  tabs.forEach(function(o){o.setAttribute('aria-selected',o===b)});
  document.querySelectorAll('.panel').forEach(function(p){var off=p.id!==b.dataset.p;p.classList.toggle('off',off);p.inert=off});arrows();
}});
/* shelves: each one shows only whole tiles; arrows page through the rest */
var GAP=14;
function shelf(){return document.querySelector('.panel:not(.off) .tiles')}
function fit(){
  document.querySelectorAll('.tiles').forEach(function(t){
    var c=t.firstElementChild;if(!c)return;
    var w=c.offsetWidth,room=t.parentNode.offsetWidth;
    t._page=Math.max(1,Math.floor((room-4+GAP)/(w+GAP)))*(w+GAP);
  });arrows();
}
function arrows(){
  var t=shelf();if(!t)return;
  document.getElementById('arrows').classList.toggle('off',t.scrollWidth<=t.clientWidth+2);
  t.classList.toggle('fade-r',t.scrollLeft+t.clientWidth<t.scrollWidth-2);
  t.classList.toggle('fade-l',t.scrollLeft>2);
  document.getElementById('prev').disabled=t.scrollLeft<=2;
  document.getElementById('next').disabled=t.scrollLeft+t.clientWidth>=t.scrollWidth-2;
}
document.querySelectorAll('.tiles').forEach(function(t){t.addEventListener('scroll',arrows,{passive:true})});
document.getElementById('prev').onclick=function(){var t=shelf();t.scrollBy({left:-t._page,behavior:'smooth'})};
document.getElementById('next').onclick=function(){var t=shelf();t.scrollBy({left:t._page,behavior:'smooth'})};
addEventListener('resize',fit);addEventListener('load',fit);fit();
/* piano: home row = white keys, row above = black keys. Semitone 0 = C3 */
var ctx,P=document.getElementById('piano'),act={},keys={},timers=[],playing=false;
var WK=[['a',0],['s',2],['d',4],['f',5],['g',7],['h',9],['j',11],['k',12],['l',14],[';',16],["'",17]];
var BK=[['w',1,0],['e',3,1],['t',6,3],['y',8,4],['u',10,5],['o',13,7],['p',15,8]];
var map={};
WK.forEach(function(k){map[k[0]]=k[1];var b=document.createElement('button');b.className='key';b.textContent=k[0].toUpperCase();b.tabIndex=-1;bind(b,k[1]);keys[k[1]]=b;P.appendChild(b)});
BK.forEach(function(k){map[k[0]]=k[1];var b=document.createElement('button');b.className='key blk';b.textContent=k[0].toUpperCase();b.tabIndex=-1;
  b.style.left='calc(100%/11*'+(k[2]+1)+' - 100%/11*.3)';b.style.width='calc(100%/11*.6)';bind(b,k[1]);keys[k[1]]=b;P.appendChild(b)});
function bind(b,s){b.onpointerdown=function(e){e.preventDefault();on(s)};b.onpointerup=b.onpointerleave=b.onpointercancel=function(){off(s)}}
function on(s){
  if(act[s])return;
  try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();
  var t=ctx.currentTime,f=130.81*Math.pow(2,s/12),g=ctx.createGain(),os=[];
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.32,t+.008);g.gain.exponentialRampToValueAtTime(.06,t+1.6);g.gain.exponentialRampToValueAtTime(.001,t+5);
  g.connect(ctx.destination);
  [[1,1],[2,.45],[3,.22],[4,.1]].forEach(function(p){var o=ctx.createOscillator(),pg=ctx.createGain();o.type='sine';o.frequency.value=f*p[0];pg.gain.value=p[1]*.6;o.connect(pg);pg.connect(g);o.start(t);os.push(o)});
  act[s]={g:g,os:os};}catch(e){act[s]={g:null,os:[]}}
  keys[s].classList.add('on');
}
function off(s){
  var a=act[s];if(!a)return;delete act[s];keys[s].classList.remove('on');
  if(!a.g)return;var t=ctx.currentTime;a.g.gain.cancelScheduledValues(t);a.g.gain.setValueAtTime(Math.max(a.g.gain.value,.001),t);a.g.gain.exponentialRampToValueAtTime(.0005,t+.35);
  a.os.forEach(function(o){o.stop(t+.4)});
}
function live(e){return !e.ctrlKey&&!e.metaKey&&!e.altKey}
addEventListener('keydown',function(e){var k=e.key.toLowerCase();if(!live(e)||e.repeat||!(k in map))return;e.preventDefault();on(map[k])});
addEventListener('keyup',function(e){var k=e.key.toLowerCase();if(k in map)off(map[k])});
/* Moonlight Sonata: simplified arrangement of the opening, using only keys on screen */
var SONG=[],T=0,N=.36;
function bar(bass,tri){SONG.push([T,bass,4.2]);for(var r=0;r<4;r++)tri.forEach(function(n){SONG.push([T,n,.55]);T+=N})}
bar(1,[8,13,16]);bar(1,[8,13,16]);bar(6,[9,13,16]);bar(6,[8,11,15]);bar(1,[8,13,16]);
[1,8,13,16].forEach(function(n){SONG.push([T,n,3.5])});
var btn=document.getElementById('play');
function stopSong(){timers.forEach(clearTimeout);timers=[];playing=false;for(var k in act)off(+k);btn.innerHTML='&#9654; Play Moonlight Sonata'}
btn.onclick=function(){
  if(playing){stopSong();return}
  playing=true;btn.innerHTML='&#9632; Stop';
  SONG.forEach(function(e){timers.push(setTimeout(function(){on(e[1])},e[0]*1000),setTimeout(function(){off(e[1])},(e[0]+e[2])*1000))});
  timers.push(setTimeout(stopSong,(T+3.8)*1000));
};