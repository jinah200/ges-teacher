/* 여는 성찰 → 다음 단계로 잇기
   1단계에서 적은 세 물음을 불러와 보여 주고, '내 문장' 칸에 그대로 넣어 줍니다. */
(function(){
  var K='reflect_journal';
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function get(){ try{ return JSON.parse(localStorage.getItem(K)||'{}'); }catch(e){ return {}; } }

  function render(){
    var wrap=document.querySelector('.wrap'); if(!wrap) return;
    var j=get();
    var give=(j.give||'').trim(), keep=(j.keep||'').trim(), ask=(j.ask||'').trim();
    var any=give||keep||ask;
    var host=document.getElementById('recall');
    if(!host){
      host=document.createElement('div'); host.id='recall'; host.className='recall';
      var h1=wrap.querySelector('h1'); if(!h1) return;
      var anchor=h1;
      var nx=h1.nextElementSibling;
      if(nx && nx.classList && nx.classList.contains('lead')) anchor=nx;
      anchor.parentNode.insertBefore(host,anchor.nextSibling);
    }
    if(!any){
      host.innerHTML='<div class="rc-k">내 물음에서 출발합니다</div>'+
        '<p class="rc-empty">아직 적지 않으셨네요. <b>〈1 · 여는 성찰〉</b>에서 세 물음에 답하고 오면, 여기로 그대로 불러옵니다.</p>';
      return;
    }
    host.innerHTML='<div class="rc-k">여는 성찰에서 적은 내 물음</div>'+
      (give?'<p><span>맡기고 싶은 것</span>'+esc(give)+'</p>':'')+
      (keep?'<p><span>지키고 싶은 것</span>'+esc(keep)+'</p>':'')+
      (ask?'<p><span>오늘의 물음</span>'+esc(ask)+'</p>':'')+
      '<button type="button" class="rc-btn">이 문장을 아래 ‘내 문장’ 칸에 넣기</button>'+
      '<span class="rc-msg"></span>';
    host.querySelector('.rc-btn').addEventListener('click',function(){
      var j2=get();
      var text=(j2.ask||'').trim()||(j2.keep||'').trim()||(j2.give||'').trim();
      var n=0;
      document.querySelectorAll('.bg.mine input, .bg.mine textarea').forEach(function(el){
        if(!el.value.trim()){
          el.value=text;
          el.dispatchEvent(new Event('input',{bubbles:true}));
          n++;
          var g=el.closest('.bg'); if(g){ g.classList.remove('pulse'); void g.offsetWidth; g.classList.add('pulse'); }
        }
      });
      var m=host.querySelector('.rc-msg');
      m.textContent = n ? (n+'곳에 넣었어요. 내 말로 다듬어 주세요.') : '빈 ‘내 문장’ 칸이 없어요.';
    });
  }
  document.addEventListener('DOMContentLoaded',function(){ setTimeout(render,10); });
})();
