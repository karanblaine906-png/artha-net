'use strict';
(function(){
 const q=(x)=>document.querySelector(x);
 const courses=window.ARTHA_CATALOG || [];
 const search=q('#search'),filter=q('#category'),status=q('#status'),grid=q('#catalog'),count=q('#results-count'),more=q('#show-more');
 const cats=[...new Set(courses.map(c=>c.category))];cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;filter.append(o)});
 let visible=24;
 const statusLabels={'full-track':'Guided track','source-material':'Source material','syllabus':'Curriculum'};
 const favoriteKey='artha-favorites-v1';let fav=[];try{fav=JSON.parse(localStorage.getItem(favoriteKey)||'[]')}catch(e){}
 function render(){const s=search.value.trim().toLowerCase(),category=filter.value,stat=status.value;const result=courses.filter(c=>(!category||c.category===category)&&(!stat||c.status===stat)&&(!s||[c.title,c.category,...c.chapters].join(' ').toLowerCase().includes(s)));
  grid.replaceChildren();count.textContent=`Showing ${Math.min(visible,result.length)} of ${result.length} topics`;
  result.slice(0,visible).forEach(c=>{const art=document.createElement('article');art.className='course-card';let badge=c.status==='full-track'?'full':c.status==='source-material'?'source':'';
   const top=document.createElement('span');top.className='meta';top.textContent=`#${String(c.number).padStart(3,'0')} · ${c.category}`;const h=document.createElement('h3');h.textContent=c.title;
   const foot=document.createElement('div');foot.className='foot';const sp=document.createElement('span');sp.className='pill '+badge;sp.textContent=statusLabels[c.status];const link=document.createElement('a');link.className='go';link.href=c.href||('course.html?id='+encodeURIComponent(c.id));link.textContent=c.href?'Start lessons →':'View curriculum →';foot.append(sp,link);art.append(top,h,foot);grid.append(art);
  });if(!result.length){const p=document.createElement('p');p.className='empty';p.textContent='No matching courses. Try a different keyword or category.';grid.append(p);}more.hidden=visible>=result.length;
 }
 [search,filter,status].forEach(x=>x.addEventListener(x===search?'input':'change',()=>{visible=24;render()}));more.addEventListener('click',()=>{visible+=24;render()});render();
 const b=q('#theme');let theme='dark';try{theme=localStorage.getItem('artha-theme')||'dark'}catch(e){}document.body.classList.toggle('light',theme==='light');b?.addEventListener('click',()=>{document.body.classList.toggle('light');try{localStorage.setItem('artha-theme',document.body.classList.contains('light')?'light':'dark')}catch(e){}});
})();
