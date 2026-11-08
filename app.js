/* 교사 연수 웹교안 — 공유 스크립트
   - 학교급 레인(초/중/고) 전환: localStorage + body class, 부모창 postMessage 수신
   - 프롬프트 복사
   - 모듈 완료/배지 진도 저장(localStorage) + 부모창에 알림
   - 간단 퀴즈 채점 → 통과 시 배지 적립
*/
(function(){
  var LS_LEVEL='ges_level', LS_BADGES='ges_badges';

  // ---- 레인(학교급) ----
  function getLevel(){ return localStorage.getItem(LS_LEVEL) || 'elem'; }
  function applyLevel(lv){
    document.body.classList.remove('lv-elem','lv-mid','lv-high');
    document.body.classList.add('lv-'+lv);
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

  // ---- 배지/진도 ----
  function getBadges(){ try{ return JSON.parse(localStorage.getItem(LS_BADGES)||'{}'); }catch(e){ return {}; } }
  window.earnBadge=function(id,label){
    var b=getBadges(); if(b[id]) return notifyParent();
    b[id]={label:label||id,at:Date.now()}; localStorage.setItem(LS_BADGES,JSON.stringify(b));
    notifyParent();
  };
  function notifyParent(){
    try{ window.parent.postMessage({type:'badges',count:Object.keys(getBadges()).length},'*'); }catch(e){}
  }
  notifyParent();

  // ---- 퀴즈 ----
  // <div class="quiz" data-badge="id" data-badge-label="..."> 안에 .quiz-q (data-answer=인덱스), .opt 버튼들
  window.initQuiz=function(root){
    var qs=root.querySelectorAll('.quiz-q'); var answered=0; var correct=0;
    qs.forEach(function(q){
      var ans=parseInt(q.getAttribute('data-answer'),10);
      var opts=q.querySelectorAll('.opt'); var done=false;
      opts.forEach(function(op,i){
        op.addEventListener('click',function(){
          if(done) return; done=true; answered++;
          if(i===ans){ op.classList.add('ok'); correct++; }
          else{ op.classList.add('no'); opts[ans].classList.add('ok'); }
          if(answered===qs.length){
            var msg=root.querySelector('.quiz-result');
            var pass=correct===qs.length;
            if(msg){ msg.style.display='block';
              msg.innerHTML = pass
                ? '🎉 모두 정답! 배지를 획득했어요.'
                : ('👍 '+correct+'/'+qs.length+' 정답. 다시 눌러 복습해도 좋아요.'); }
            if(pass){ window.earnBadge(root.getAttribute('data-badge'), root.getAttribute('data-badge-label')); }
          }
        });
      });
    });
  };

  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('.quiz').forEach(function(q){ window.initQuiz(q); });
  });
})();
