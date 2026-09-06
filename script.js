(function(){
  "use strict";
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* year */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* header + progress */
  var header = document.getElementById('header');
  var bar = document.getElementById('progressBar');
  function onScroll(){
    var h = document.documentElement;
    var p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    bar.style.transform = 'scaleX(' + p + ')';
    header.classList.toggle('scrolled', h.scrollTop > 10);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* mobile menu */
  var burger = document.getElementById('burger');
  burger.addEventListener('click', function(){ document.body.classList.toggle('menu-open'); });
  document.querySelectorAll('.m-menu a').forEach(function(a){
    a.addEventListener('click', function(){ document.body.classList.remove('menu-open'); });
  });

  /* reveal on scroll */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {threshold:.12, rootMargin:'0px 0px -36px 0px'});
  document.querySelectorAll('.rv, .dash').forEach(function(el){ io.observe(el); });

  /* counters */
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var plain = el.getAttribute('data-plain') === '1';
    if(REDUCED){
      el.textContent = prefix + (plain ? String(target) : target.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec})) + suffix;
      return;
    }
    var dur = 1700, start = null;
    function frame(t){
      if(start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      var v = target * ease;
      el.textContent = prefix + (plain ? String(Math.round(v)) : v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec})) + suffix;
      if(p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var cio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ animateCount(e.target); cio.unobserve(e.target); }
    });
  }, {threshold:.5});
  document.querySelectorAll('[data-count]').forEach(function(el){ cio.observe(el); });

  /* scramble decode */
  var CHARS = '!<>-_\\/[]{}=+*^?#0123456789';
  function scrambleEl(el){
    var finalText = el.getAttribute('data-text') || el.textContent;
    if(REDUCED){ el.textContent = finalText; return; }
    var frame = 0, total = Math.max(18, finalText.length * 1.6);
    var timer = setInterval(function(){
      frame++;
      var out = '', reveal = (frame / total) * finalText.length * 1.3;
      for(var i = 0; i < finalText.length; i++){
        var ch = finalText[i];
        if(ch === ' ' || ch === '—' || ch === '.'){ out += ch; continue; }
        out += (i < reveal) ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      el.textContent = out;
      if(frame >= total){ el.textContent = finalText; clearInterval(timer); }
    }, 28);
  }
  var sio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ scrambleEl(e.target); sio.unobserve(e.target); }
    });
  }, {threshold:.6});
  document.querySelectorAll('.scramble').forEach(function(el){ sio.observe(el); });
  window.addEventListener('load', function(){
    var hero = document.getElementById('heroScramble');
    if(hero) setTimeout(function(){ scrambleEl(hero); }, 900);
  });

  /* live dashboard ticking */
  if(!REDUCED){
    var live = [
      {id:'lvTraffic', base:187, jit:4, fmt:function(v){ return '+' + Math.round(v) + '%'; }},
      {id:'lvKeys',    base:342, jit:3, fmt:function(v){ return String(Math.round(v)); }},
      {id:'lvPack',    base:256, jit:5, fmt:function(v){ return '+' + Math.round(v) + '%'; }},
      {id:'lvLeads',   base:127, jit:3, fmt:function(v){ return String(Math.round(v)); }}
    ];
    setInterval(function(){
      var pick = live[Math.floor(Math.random() * live.length)];
      var el = document.getElementById(pick.id);
      if(!el) return;
      var v = pick.base + (Math.random() * pick.jit - pick.jit / 2);
      el.textContent = pick.fmt(v);
      el.classList.remove('blip');
      void el.offsetWidth;
      el.classList.add('blip');
    }, 2400);
  }

  /* hero dashboard subtle parallax */
  var dash = document.getElementById('dashCard');
  if(dash && !REDUCED && window.matchMedia('(pointer:fine)').matches){
    var heroSec = document.querySelector('.hero');
    heroSec.addEventListener('mousemove', function(ev){
      var r = heroSec.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - .5;
      var y = (ev.clientY - r.top) / r.height - .5;
      dash.style.transform = 'perspective(1100px) rotateY(' + (x * 4) + 'deg) rotateX(' + (-y * 4) + 'deg)';
    });
    heroSec.addEventListener('mouseleave', function(){ dash.style.transform = 'none'; });
  }

  /* industry tabs */
  var tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(function(btn){
    btn.addEventListener('click', function(){
      tabs.forEach(function(b){ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      document.querySelectorAll('.ind-panel').forEach(function(p){ p.classList.remove('active'); });
      var panel = document.getElementById(btn.getAttribute('data-target'));
      if(panel) panel.classList.add('active');
    });
  });

  /* mobile hint: nudge the industries tab row to signal it scrolls sideways */
  var tabsRow = document.querySelector('.tabs-row');
  if(tabsRow && window.innerWidth <= 760 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var hintObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          setTimeout(function(){
            tabsRow.scrollTo({ left: 90, behavior: 'smooth' });
            setTimeout(function(){ tabsRow.scrollTo({ left: 0, behavior: 'smooth' }); }, 650);
          }, 400);
          hintObserver.disconnect();
        }
      });
    }, { threshold: 0.6 });
    hintObserver.observe(tabsRow);
  }

  /* faq accordion */
  document.querySelectorAll('.faq-q').forEach(function(q){
    q.addEventListener('click', function(){
      var item = q.parentElement;
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(i){
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded','false');
      });
      if(!wasOpen){
        item.classList.add('open');
        q.setAttribute('aria-expanded','true');
      }
    });
  });
})();
