/* 프롬프트 빌더 엔진
   왼쪽에서 고르면 오른쪽 프롬프트에 바로 반영되고, 바뀐 줄이 잠깐 반짝입니다.
   GESB.register(id, cfg)  →  <div class="builder" data-b="id"></div> 자리에 그려짐

   cfg = { hint, levels:{elem:{groups,tpl}, mid:{...}, high:{...}} }  또는  { groups, tpl }
   group = { key, label, max(기본 1; 2 이상이면 여러 개), adv(세부 설정), custom(직접 쓰기),
             text(입력칸: ph 안내문, def 기본값), opts:[ 이름 | [이름, 프롬프트에 들어갈 문장, 기본선택(true)] ] }
   tpl   = 줄바꿈으로 나뉜 템플릿. {키} 자리에 선택한 값이 들어감.
           선택값이 모두 비어 있는 줄은 자동으로 빠짐.
*/
(function(){
  var REG={}, INST=[];
  window.GESB={register:function(id,cfg){REG[id]=cfg;}};

  function curLevel(){ try{ return localStorage.getItem('ges_level')||'elem'; }catch(e){ return 'elem'; } }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function norm(o){ return typeof o==='string' ? {l:o,v:o,d:false} : {l:o[0],v:(o[1]!=null?o[1]:o[0]),d:!!o[2]}; }

  function Builder(root,cfg){
    this.root=root; this.cfg=cfg; this.state={}; this.advOpen=false; this.editing=false; this.dirty=false; this.level=curLevel();
    this.draw();
  }
  Builder.prototype.conf=function(){ return this.cfg.levels ? (this.cfg.levels[this.level]||this.cfg.levels.elem) : this.cfg; };
  Builder.prototype.initState=function(){
    var self=this, st=this.state;
    this.conf().groups.forEach(function(g){
      var s=st[g.key];
      if(g.calc) return;
      if(g.text){ if(s==null) st[g.key]={t:g.def||''}; return; }
      var opts=(g.opts||[]).map(norm);
      if(!s){ s=st[g.key]={sel:[],cus:false,ct:''};
        opts.forEach(function(o,i){ if(o.d) s.sel.push(i); });
        if(!s.sel.length && !g.none && !g.multiOnly && (g.max||1)===1 && opts.length) s.sel=[0];
      }
      // 레벨이 바뀌어 선택지가 사라졌으면 기본값으로
      s.sel=s.sel.filter(function(i){ return i<opts.length; });
      if(!s.sel.length && !s.cus && !g.none && (g.max||1)===1 && opts.length) s.sel=[0];
    });
  };
  Builder.prototype.val=function(g){
    if(g.calc){ var me=this; return g.calc(function(k){ var gg=me.conf().groups.filter(function(x){return x.key===k;})[0]; return gg?me.val(gg):''; }); }
    var s=this.state[g.key]; if(!s) return '';
    if(g.text) return (s.t||'').trim();
    var opts=(g.opts||[]).map(norm), out=[];
    s.sel.slice().sort(function(a,b){return a-b;}).forEach(function(i){ if(opts[i]) out.push(opts[i].v); });
    if(s.cus && (s.ct||'').trim()) out.push(s.ct.trim());
    return out.join(g.join||', ');
  };
  Builder.prototype.draw=function(){
    var self=this, c=this.conf(); this.initState();
    var left='', adv='', num=0;
    c.groups.forEach(function(g){
      if(g.calc) return;
      num++;
      var html='<div class="bg" data-k="'+g.key+'"><h4><span class="gn">'+num+'</span><span class="gt">'+esc(g.label)+'</span>'+(g.text?'<small>직접 입력</small>':'<small>'+((g.max||1)>1?('여러 개 · 최대 '+g.max+'개'):'하나 고르기')+'</small>')+'</h4>';
      if(g.text){
        html+='<input class="btext" type="text" data-k="'+g.key+'" placeholder="'+esc(g.ph||'')+'" value="'+esc(self.state[g.key].t)+'">';
      }else{
        var s=self.state[g.key]; html+='<div class="chips">';
        (g.opts||[]).map(norm).forEach(function(o,i){
          html+='<button type="button" class="chip'+(s.sel.indexOf(i)>=0?' on':'')+'" data-k="'+g.key+'" data-i="'+i+'">'+esc(o.l)+'</button>';
        });
        if(g.custom) html+='<button type="button" class="chip cus'+(s.cus?' on':'')+'" data-k="'+g.key+'" data-i="c">✏️ 직접 쓰기</button>';
        html+='</div>';
        if(g.custom) html+='<input class="btext cinp" type="text" data-k="'+g.key+'" data-c="1" placeholder="'+esc(g.cph||'직접 입력')+'" value="'+esc(s.ct||'')+'" style="'+(s.cus?'':'display:none')+'">';
      }
      html+='</div>';
      if(g.adv) adv+=html; else left+=html;
    });
    var advBtn = adv ? '<button type="button" class="advbtn">'+(this.advOpen?'− 세부 설정 접기':'+ 더 바꾸기 · 세부 설정')+'</button><div class="advbox" style="display:'+(this.advOpen?'block':'none')+'">'+adv+'</div>' : '';
    this.root.innerHTML='<div class="bsteps"><span><b>1</b> 왼쪽에서 고르기</span><i>→</i><span><b>2</b> 필요하면 직접 고치기</span><i>→</i><span><b>3</b> 복사해서 붙여넣기</span></div>'+
      '<div class="bl"><div class="bltitle">① 선택하기</div>'+left+advBtn+'</div>'+
      '<div class="br"><div class="bhint">'+esc(this.cfg.hint||'💡 왼쪽에서 고르면 오른쪽 프롬프트에 바로 반영돼요.')+'</div>'+
      '<div class="bbar"><div class="bnote">핑크색 글자가 내가 고른 부분이에요.<br>누르면 왼쪽 선택 창으로 이동합니다.</div><div class="bbtns"><button type="button" class="bedit">✏️ 직접 고치기</button><button type="button" class="bcopy">📋 프롬프트 복사</button></div></div>'+
      '<div class="beditnote">✏️ 오른쪽 프롬프트를 눌러 글자를 직접 고칠 수 있어요. 고친 내용 그대로 복사됩니다. (왼쪽 선택을 바꾸면 선택한 내용으로 다시 만들어집니다)</div>'+
      '<pre class="bout'+(this.cfg.code?' code':'')+'"></pre></div>';
    this.bind(); this.renderOut(null);
  };
  Builder.prototype.lines=function(){
    var self=this, c=this.conf(), gm={};
    c.groups.forEach(function(g){ gm[g.key]=g; });
    var out=[];
    c.tpl.split('\n').forEach(function(line){
      var keys=[], toks=(line.match(/\{[a-zA-Z0-9_]+\}/g)||[]).filter(function(t){ return gm[t.slice(1,-1)]; });
      var vals={}, allEmptyOpt=toks.length>0;
      toks.forEach(function(t){
        var k=t.slice(1,-1), g=gm[k]; if(!g){ vals[k]=''; return; }
        var v=self.val(g); vals[k]=v; keys.push(k);
        if(g.text || g.calc || v) allEmptyOpt=false;
      });
      if(toks.length && allEmptyOpt) return;
      var html='', plain='', last=0, re=/\{([a-zA-Z0-9_]+)\}/g, m;
      var lbm=!self.cfg.code && line.match(/^(\[[^\]{}]+\])/);
      if(lbm){ html='<span class="lb">'+esc(lbm[1])+'</span>'; plain=lbm[1]; last=lbm[1].length; re.lastIndex=last; }
      while((m=re.exec(line))){
        var pre=line.slice(last,m.index); html+=esc(pre); plain+=pre;
        var k=m[1], g=gm[k], v=vals[k];
        if(!g){ html+=esc(m[0]); plain+=m[0]; last=m.index+m[0].length; continue; }
        if(g && g.text && !v){ var phv=self.cfg.code ? (g.ph||k) : '['+(g.ph||k)+']'; html+='<span class="tok ph" data-k="'+k+'">'+esc(phv)+'</span>'; plain+=phv; }
        else{ html+='<span class="tok" data-k="'+k+'">'+esc(v)+'</span>'; plain+=v; }
        last=m.index+m[0].length;
      }
      html+=esc(line.slice(last)); plain+=line.slice(last);
      out.push({html:html,plain:plain,keys:keys});
    });
    return out;
  };
  Builder.prototype.renderOut=function(changed){
    var L=this.lines(), pre=this.root.querySelector('.bout'), plain=[];
    pre.innerHTML=L.map(function(l){
      plain.push(l.plain);
      var fl=changed && l.keys.indexOf(changed)>=0 ? ' flash' : '';
      return '<div class="ln'+fl+'">'+(l.html||'&nbsp;')+'</div>';
    }).join('');
    this.plain=plain.join('\n').replace(/\n{3,}/g,'\n\n');
    this.dirty=false; if(this.editing) pre.setAttribute('contenteditable','true');
  };
  Builder.prototype.bind=function(){
    var self=this, root=this.root;
    root.querySelectorAll('.chip').forEach(function(b){
      b.addEventListener('click',function(){
        var k=b.dataset.k, g=self.conf().groups.filter(function(x){return x.key===k;})[0], s=self.state[k], i=b.dataset.i, max=g.max||1;
        if(i==='c'){
          if(s.cus){ s.cus=false; }
          else{ if(max===1){ s.sel=[]; } else if(s.sel.length+(s.cus?1:0)>=max){ s.sel.shift(); } s.cus=true; }
        }else{
          i=parseInt(i,10); var pos=s.sel.indexOf(i);
          if(max===1){
            if(pos>=0){ if(g.none||g.multiOnly){ s.sel=[]; } } else { s.sel=[i]; s.cus=false; }
          }else{
            if(pos>=0) s.sel.splice(pos,1);
            else{ if(s.sel.length+(s.cus?1:0)>=max) s.sel.shift(); s.sel.push(i); }
          }
        }
        // chip 상태 갱신
        root.querySelectorAll('.chip[data-k="'+k+'"]').forEach(function(x){
          var xi=x.dataset.i; x.classList.toggle('on', xi==='c' ? !!s.cus : s.sel.indexOf(parseInt(xi,10))>=0);
        });
        var ci=root.querySelector('.cinp[data-k="'+k+'"]'); if(ci){ ci.style.display=s.cus?'':'none'; if(s.cus) ci.focus(); }
        self.renderOut(k);
      });
    });
    root.querySelectorAll('.btext').forEach(function(inp){
      inp.addEventListener('input',function(){
        var k=inp.dataset.k, s=self.state[k];
        if(inp.dataset.c){ s.ct=inp.value; } else { s.t=inp.value; }
        self.renderOut(k);
      });
    });
    var outEl=root.querySelector('.bout'), eb=root.querySelector('.bedit');
    function setEdit(on){
      self.editing=on; root.classList.toggle('editing',on);
      if(on){ outEl.setAttribute('contenteditable','true'); outEl.focus(); eb.textContent='✅ 고치기 끝'; }
      else{ outEl.removeAttribute('contenteditable'); eb.textContent='✏️ 직접 고치기'; }
    }
    eb.addEventListener('click',function(){ setEdit(!self.editing); });
    outEl.addEventListener('input',function(){ self.dirty=true; });
    outEl.addEventListener('click',function(ev){
      if(self.editing) return;
      var t=ev.target.closest('.tok'); if(!t) return;
      var grp=root.querySelector('.bg[data-k="'+t.dataset.k+'"]'); if(!grp) return;
      var box=root.querySelector('.advbox'), btn=root.querySelector('.advbtn');
      if(box && box.contains(grp) && box.style.display==='none'){ self.advOpen=true; box.style.display='block'; if(btn) btn.textContent='− 세부 설정 접기'; }
      grp.scrollIntoView({block:'center',behavior:'smooth'});
      grp.classList.remove('pulse'); void grp.offsetWidth; grp.classList.add('pulse');
    });
    var ab=root.querySelector('.advbtn');
    if(ab) ab.addEventListener('click',function(){
      self.advOpen=!self.advOpen;
      root.querySelector('.advbox').style.display=self.advOpen?'block':'none';
      ab.textContent=self.advOpen?'− 세부 설정 접기':'+ 더 바꾸기 · 세부 설정';
    });
    root.querySelector('.bcopy').addEventListener('click',function(){
      var btn=this, t=self.dirty ? self.root.querySelector('.bout').innerText.replace(/\u00a0/g,' ') : self.plain;
      function ok(){ var o=btn.textContent; btn.textContent='✅ 복사됨'; setTimeout(function(){ btn.textContent='📋 프롬프트 복사'; },1500); }
      function fb(){ var ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select();
        try{ document.execCommand('copy'); ok(); }catch(e){ btn.textContent='⚠️ 실패'; } document.body.removeChild(ta); }
      if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(ok).catch(fb); } else fb();
    });
  };

  function boot(){
    if(document.querySelector('.builder[data-b]')) document.body.classList.add('hasb');
    document.querySelectorAll('.builder[data-b]').forEach(function(el){
      var cfg=REG[el.getAttribute('data-b')]; if(!cfg) return;
      INST.push(new Builder(el,cfg));
    });
  }
  (window.__lvCbs=window.__lvCbs||[]).push(function(lv){
    INST.forEach(function(b){ if(b.level!==lv){ b.level=lv; b.draw(); } });
  });
  window.GESB_boot=boot;
  document.addEventListener('DOMContentLoaded',function(){ setTimeout(boot,0); });
})();
