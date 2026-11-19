/* 교사 연수 웹교안 — 공유 스크립트
   - 학교급 레인(초/중/고) 전환: localStorage + body class, 부모창 postMessage 수신
   - 프롬프트 복사
*/
(function(){
  var LS_LEVEL='ges_level';

  // ---- 레인(학교급) ----
  function getLevel(){ return localStorage.getItem(LS_LEVEL) || 'elem'; }
  function applyLevel(lv){
    document.body.classList.remove('lv-elem','lv-mid','lv-high');
    document.body.classList.add('lv-'+lv);
    (window.__lvCbs||[]).forEach(function(f){ try{ f(lv); }catch(e){} });
  }
  window.__setLevel=function(lv){
    if(['elem','mid','high'].indexOf(lv)<0) return;
    localStorage.setItem(LS_LEVEL,lv); applyLevel(lv);
    try{ window.parent.postMessage({type:'level-changed',level:lv},'*'); }catch(e){}
  };
  // 부모(index) → 자식(모듈) 레벨 지시 수신
  window.addEventListener('message',function(ev){
    var d=ev.data||{};
    if(d.type==='set-level'){ localStorage.setItem(LS_LEVEL,d.level); applyLevel(d.level); }
    if(d.type==='ping-level'){ try{ev.source.postMessage({type:'child-level',level:getLevel()},'*');}catch(e){} }
  });

  // ---- 학교급 안내 배너 ----
  var LVNAME={elem:'초등',mid:'중등',high:'고등'};
  function levelNotice(lv){
    var wrap=document.querySelector('.wrap'); if(!wrap) return;
    var hasLane=document.querySelector('[data-level]')||document.body.classList.contains('lv-aware');
    if(!hasLane) return;
    var el=document.getElementById('lvNotice');
    if(!el){
      el=document.createElement('div'); el.id='lvNotice'; el.className='lv-notice';
      var h1=wrap.querySelector('h1');
      if(h1&&h1.nextSibling) h1.parentNode.insertBefore(el,h1.nextSibling); else wrap.insertBefore(el,wrap.firstChild);
    }
    el.innerHTML='<b>학교급: '+(LVNAME[lv]||'초등')+'</b> <span>상단의 <b>초등·중등·고등</b>을 바꾸면 이 페이지의 <b>예시와 프롬프트 선택지</b>가 해당 학교급에 맞게 바뀝니다. 내용의 뼈대는 같고, 사례만 달라집니다.</span>';
  }
  (window.__lvCbs=window.__lvCbs||[]).push(levelNotice);
  document.addEventListener('DOMContentLoaded',function(){ levelNotice(getLevel()); });

  applyLevel(getLevel());

  // ---- 복사 버튼 ----
  window.copyPrompt=function(btn){
    var box=btn.closest('.prompt'); if(!box) return;
    var pres=[].slice.call(box.querySelectorAll('pre'));
    var pre=pres.filter(function(p){ return p.offsetParent!==null; })[0] || pres[0];
    if(!pre) return;
    var t=pre.innerText;
    navigator.clipboard.writeText(t).then(function(){
      var o=btn.textContent; btn.textContent='✅ 복사됨';
      setTimeout(function(){ btn.textContent=o; },1500);
    }).catch(function(){ btn.textContent='⚠️ 실패'; });
  };

})();
