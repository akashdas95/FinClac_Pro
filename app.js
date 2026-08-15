const gel=id=>document.getElementById(id);

// ── Comma-formatted numeric inputs ─────────────────────────────
// Inputs are type="text" inputmode="decimal" with commas shown for
// readability. We shadow the element's `value` accessor so every
// existing +gel(id).value / this.value read site keeps getting a
// clean, comma-free numeric string automatically — no call sites
// elsewhere in this file need to change.
const _nativeValueDesc=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
function _fmtDisplay(raw){
  if(raw===''||raw==null)return '';
  let s=String(raw);
  const neg=s.startsWith('-');
  if(neg)s=s.slice(1);
  let [intPart,decPart]=s.split('.');
  intPart=(intPart||'').replace(/\D/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');
  let out=intPart;
  if(decPart!==undefined)out+='.'+decPart.replace(/\D/g,'');
  return (neg?'-':'')+out;
}
function _enableCommaFormat(el){
  if(el.__commaFmt)return;
  el.__commaFmt=true;
  Object.defineProperty(el,'value',{
    get(){ return _nativeValueDesc.get.call(el).replace(/,/g,''); },
    set(v){ _nativeValueDesc.set.call(el,_fmtDisplay(v)); },
    configurable:true
  });
  _nativeValueDesc.set.call(el,_fmtDisplay(_nativeValueDesc.get.call(el)));
  el.addEventListener('input',()=>{
    const start=el.selectionStart, prevLen=_nativeValueDesc.get.call(el).length;
    const raw=_nativeValueDesc.get.call(el).replace(/,/g,'');
    const formatted=_fmtDisplay(raw);
    _nativeValueDesc.set.call(el,formatted);
    const pos=Math.max(0,start+(formatted.length-prevLen));
    el.setSelectionRange(pos,pos);
  });
}
function applyCommaFormatting(root){
  (root||document).querySelectorAll('input[type="text"][inputmode="decimal"]').forEach(_enableCommaFormat);
}
if(!window.__commaFmtObserverInit){
  window.__commaFmtObserverInit=true;
  new MutationObserver(muts=>{
    muts.forEach(m=>m.addedNodes.forEach(node=>{
      if(node.nodeType!==1)return;
      if(node.matches&&node.matches('input[type="text"][inputmode="decimal"]'))_enableCommaFormat(node);
      if(node.querySelectorAll)applyCommaFormatting(node);
    }));
  }).observe(document.documentElement,{childList:true,subtree:true});
}

const f$=n=>'$'+Math.abs(Math.round(n)).toLocaleString('en-US');
const pct=(n,d=1)=>isFinite(n)?n.toFixed(d)+'%':'∞';
const fk=n=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(0)+'K':Math.round(n).toString();
const askClaude=msg=>{try{sendPrompt(msg);}catch(e){}};
// type: 'good' (✓ green), 'bad' (✕ red), 'neutral' (i gold info)
const ICN={good:'✓',bad:'✕',neutral:'i'};
function renderInsights(id,lines){
  const el=gel(id);if(!el)return;
  if(!lines||!lines.length){el.innerHTML='';el.style.display='none';return;}
  el.style.display='';
  el.innerHTML='<div class="insight-title">💡 What This Means</div>'+lines.map(l=>
    `<div class="insight-line ${l.type}"><span class="ic">${ICN[l.type]||'i'}</span><span>${l.text}</span></div>`
  ).join('');
}

// ── Mobile guide accordions: group each guide-h3 + its content into a
// collapsible section. Pure DOM restructuring — CSS only activates the
// collapsed/click behavior at ≤700px; above that, everything still
// renders exactly as before (this just adds inert wrapper elements).
function fillExampleValues(){
  document.querySelectorAll('input[inputmode="decimal"]').forEach(input=>{
    const ph=input.placeholder;
    if(!ph||!ph.startsWith('e.g. '))return;
    input.value=ph.slice(5);
    const handler=input.getAttribute('oninput');
    if(handler){ try{ new Function(handler).call(input); }catch(e){} }
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('blur',{bubbles:true}));
  });
  // Equity Dilution page: founders/rounds are rendered from JS state, not
  // plain placeholder-driven inputs, so they need their own example reset.
  if(document.getElementById('eq-founders') && typeof founders!=='undefined' && typeof renderFounders==='function'){
    founders.length=0;
    EQ_EXAMPLE_FOUNDERS.forEach(f=>founders.push({...f}));
    renderFounders();
  }
  if(document.getElementById('eq-rounds') && typeof rounds!=='undefined' && typeof renderRounds==='function'){
    rounds.length=0;
    EQ_EXAMPLE_ROUNDS.forEach(r=>rounds.push({...r}));
    renderRounds();
  }
  // Debt Payoff Planner
  if(document.getElementById('debt-rows') && typeof debts!=='undefined' && typeof renderDebtRows==='function'){
    debts.length=0;
    DEBT_EXAMPLE.forEach(d=>debts.push({...d}));
    renderDebtRows();
  }
  // Debt Snowball vs Avalanche
  if(document.getElementById('dc2-rows') && typeof dc2Debts!=='undefined' && typeof renderDC2==='function'){
    dc2Debts.length=0;
    DC2_EXAMPLE.forEach(d=>dc2Debts.push({...d}));
    renderDC2();
  }
  // Itemized Bill Splitter
  if(document.getElementById('bs-people-rows') && typeof bsPeople!=='undefined' && typeof renderBSPeople==='function'){
    bsPeople.length=0;
    BS_EXAMPLE_PEOPLE.forEach(p=>bsPeople.push({...p}));
    bsItems.length=0;
    BS_EXAMPLE_ITEMS.forEach(it=>bsItems.push({...it}));
    renderBSPeople();
  }
  // Cash Flow Calculator
  if(document.getElementById('cf-i-rows') && typeof cfIncome!=='undefined' && typeof renderCFRows==='function'){
    cfIncome.length=0;
    CF_EXAMPLE_INCOME.forEach(r=>cfIncome.push({...r}));
    cfExpense.length=0;
    CF_EXAMPLE_EXPENSE.forEach(r=>cfExpense.push({...r}));
    renderCFRows();
  }
}
function resetCalculatorValues(){
  document.querySelectorAll('input[inputmode="decimal"]').forEach(input=>{
    input.value='';
    input.classList.remove('field-warn');
    const handler=input.getAttribute('oninput');
    if(handler){ try{ new Function(handler).call(input); }catch(e){} }
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('blur',{bubbles:true}));
  });
  document.querySelectorAll('.field-warn-msg').forEach(msg=>{ msg.style.display='none'; });
  if(document.getElementById('eq-founders') && typeof founders!=='undefined' && typeof renderFounders==='function'){
    founders.length=0;
    founders.push({name:'Founder A',pct:0},{name:'Founder B',pct:0});
    renderFounders();
  }
  if(document.getElementById('eq-rounds') && typeof rounds!=='undefined' && typeof renderRounds==='function'){
    rounds.length=0;
    renderRounds();
  }
  // Debt Payoff Planner
  if(document.getElementById('debt-rows') && typeof debts!=='undefined' && typeof renderDebtRows==='function'){
    debts.length=0;
    debts.push({name:'Debt 1',bal:0,rate:0,min:0});
    renderDebtRows();
  }
  // Debt Snowball vs Avalanche
  if(document.getElementById('dc2-rows') && typeof dc2Debts!=='undefined' && typeof renderDC2==='function'){
    dc2Debts.length=0;
    dc2Debts.push({name:'Debt 1',bal:0,rate:0,min:0});
    renderDC2();
  }
  // Itemized Bill Splitter
  if(document.getElementById('bs-people-rows') && typeof bsPeople!=='undefined' && typeof renderBSPeople==='function'){
    bsPeople.length=0;
    bsPeople.push({name:'Person 1'},{name:'Person 2'});
    bsItems.length=0;
    renderBSPeople();
  }
  // Cash Flow Calculator
  if(document.getElementById('cf-i-rows') && typeof cfIncome!=='undefined' && typeof renderCFRows==='function'){
    cfIncome.length=0;
    cfIncome.push({name:'Income 1',amt:0,freq:'monthly'});
    cfExpense.length=0;
    cfExpense.push({name:'Expense 1',amt:0,freq:'monthly'});
    renderCFRows();
  }
}
function attachInputGuards(){
  const GROWTH_WORDS=/growth|change in|decline/i;
  document.querySelectorAll('input[inputmode="decimal"]').forEach(input=>{
    if(input.dataset.guarded)return; // avoid double-binding if this ever re-runs
    input.dataset.guarded='1';
    const allowNeg=input.dataset.allowNegative==='1'||(()=>{
      const label=input.closest('.field')?.querySelector('label');
      return label&&GROWTH_WORDS.test(label.textContent);
    })();
    const showWarn=(msg)=>{
      input.classList.add('field-warn');
      let msgEl=input.closest('.field,.ip')?.parentElement?.querySelector('.field-warn-msg')||input.parentElement.querySelector('.field-warn-msg');
      if(!msgEl){
        msgEl=document.createElement('div');
        msgEl.className='field-warn-msg';
        const host=input.closest('.ip')||input;
        host.insertAdjacentElement('afterend',msgEl);
      }
      msgEl.textContent=msg;
      msgEl.style.display='';
    };
    const clearWarn=()=>{
      input.classList.remove('field-warn');
      const host=input.closest('.ip')||input;
      const msgEl=host.nextElementSibling;
      if(msgEl&&msgEl.classList.contains('field-warn-msg'))msgEl.style.display='none';
    };
    input.addEventListener('blur',()=>{
      const raw=input.value.trim();
      if(raw===''){clearWarn();return;}
      const v=parseFloat(raw);
      if(isNaN(v)){showWarn('Enter a valid number');return;}
      if(v<0&&!allowNeg){showWarn('Enter a positive number');return;}
      clearWarn();
    });
    input.addEventListener('input',()=>{
      if(input.classList.contains('field-warn'))clearWarn();
    });
  });
}
function initGuideAccordions(){
  document.querySelectorAll('.guide-body').forEach(body=>{
    if(body.dataset.accordionized)return;
    body.dataset.accordionized='1';
    const kids=Array.from(body.children);
    const frag=document.createDocumentFragment();
    let current=null;
    kids.forEach(node=>{
      if(node.classList.contains('guide-h3')){
        current=document.createElement('div');
        current.className='guide-sub';
        const head=document.createElement('div');
        head.className='guide-sub-head';
        head.onclick=function(){this.parentElement.classList.toggle('open');};
        const bodyWrap=document.createElement('div');
        bodyWrap.className='guide-sub-body';
        head.appendChild(node);
        const arrow=document.createElement('span');
        arrow.className='guide-sub-arrow';
        arrow.textContent='▾';
        head.appendChild(arrow);
        current.appendChild(head);
        current.appendChild(bodyWrap);
        frag.appendChild(current);
      }else if(current){
        current.querySelector('.guide-sub-body').appendChild(node);
      }else{
        frag.appendChild(node); // content before the first H3 (intro paragraph) stays unwrapped
      }
    });
    body.appendChild(frag);
  });
}

// ── SEO: per-calculator metadata + dynamic canonical/hreflang ────
// Languages currently supported for hreflang/SEO purposes (UI text itself
// is still English-only — this just tells search engines which language
// version maps to which URL once those language pages exist).

// id -> {title, description} for every panel. Used to set <title>,
// meta description, canonical and hreflang URLs as the user navigates.
// NOTE: canonical/hreflang URLs below assume each calculator becomes its
// own static page at /<lang>/<id>/ (e.g. /en/loan/, /es/loan/, /hi/loan/).
// Until those pages exist, the tags simply describe the intended URL.



// ── Canvas helpers ──────────────────────────────────────────────
function drawLine(id,datasets,H_=150){
  const c=gel(id);if(!c)return;
  const ctx=c.getContext('2d'),W=c.width,H=H_||c.height,p=28;
  ctx.clearRect(0,0,W,H);
  const all=datasets.flatMap(d=>d.data||[]);
  const mx=Math.max(...all)||1,mn=Math.min(0,...all),range=mx-mn||1;
  datasets.forEach(ds=>{
    if(!ds.data||!ds.data.length)return;
    const pts=ds.data.map((v,i)=>({x:p+i*(W-p*2)/((ds.data.length-1)||1),y:H-p-(v-mn)/range*(H-p*2)}));
    if(ds.fill!==false){ctx.beginPath();ctx.moveTo(pts[0].x,H-p);pts.forEach(pt=>ctx.lineTo(pt.x,pt.y));ctx.lineTo(pts[pts.length-1].x,H-p);ctx.closePath();ctx.fillStyle=ds.color+'18';ctx.fill();}
    ctx.beginPath();pts.forEach((pt,i)=>i?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y));
    ctx.strokeStyle=ds.color;ctx.lineWidth=ds.w||2;ctx.setLineDash(ds.dash||[]);ctx.stroke();ctx.setLineDash([]);
  });
}
// ── Shared: renders a year-by-year amortization schedule (principal
// paid, interest paid, ending balance) into a table, given a loan's
// principal, monthly rate, and term in months. Used by Loan/EMI,
// Mortgage, and Auto Loan calculators.
function renderAmortTable(tableId,P,r,n){
  const el=gel(tableId);
  if(!el)return;
  if(P<=0||n<=0){el.innerHTML='';return;}
  const emi=r?P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):P/n;
  let bal=P,yearPrincipal=0,yearInterest=0;
  const rows=[];
  for(let m=1;m<=n;m++){
    const ip=bal*r;
    let pp=emi-ip;
    if(pp>bal)pp=bal;
    bal-=pp;if(bal<0)bal=0;
    yearPrincipal+=pp;yearInterest+=ip;
    if(m%12===0||m===n){
      rows.push({year:Math.ceil(m/12),principal:yearPrincipal,interest:yearInterest,balance:bal});
      yearPrincipal=0;yearInterest=0;
    }
  }
  let html='<thead><tr><th style="text-align:left;padding:6px 8px;font-size:11px;color:var(--m);border-bottom:1px solid var(--bd)">Year</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--a)">Principal Paid</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--r)">Interest Paid</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd)">Ending Balance</th></tr></thead><tbody>';
  rows.forEach(r=>{
    html+=`<tr><td style="text-align:left;font-size:12px;color:var(--m);border-bottom:1px solid var(--bd);padding:7px 8px">Year ${r.year}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;color:var(--a)">${f$(r.principal)}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;color:var(--r)">${f$(r.interest)}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;font-weight:600">${f$(r.balance)}</td></tr>`;
  });
  html+='</tbody>';
  el.innerHTML=html;
}

function drawDonut(id,data,colors){
  const c=gel(id);if(!c)return;
  const ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2,r=Math.min(W,H)/2-5;
  ctx.clearRect(0,0,W,H);
  const tot=data.reduce((a,b)=>a+b,0);
  c._segments=[];c._cx=cx;c._cy=cy;c._r=r;
  if(!tot)return;
  let s=-Math.PI/2;
  data.forEach((v,i)=>{
    if(!v)return;
    const a=2*Math.PI*v/tot;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,s+a);ctx.closePath();
    ctx.fillStyle=colors[i];ctx.fill();
    c._segments.push({start:s,end:s+a,value:v,pct:v/tot*100,index:i});
    s+=a;
  });
  ctx.beginPath();ctx.arc(cx,cy,r*.57,0,2*Math.PI);ctx.fillStyle='#FFFFFF';ctx.fill();
}
function drawBars(id,labels,vals,colors,H_=130){
  const c=gel(id);if(!c)return;
  const ctx=c.getContext('2d'),W=c.width,H=H_,p=28,n=vals.length;
  ctx.clearRect(0,0,W,H);
  const mx=Math.max(...vals)||1,bw=Math.min(65,(W-p*2)/n-6),gap=(W-p*2-bw*n)/((n-1)||1);
  c._bars=[];
  vals.forEach((v,i)=>{
    const x=p+i*(bw+gap),bh=(v/mx)*(H-p*2),y=H-p-bh;
    ctx.beginPath();
    ctx.fillStyle=colors[i%colors.length];
    if(ctx.roundRect)ctx.roundRect(x,y,bw,bh,3);else ctx.rect(x,y,bw,bh);
    ctx.fill();
    ctx.fillStyle='#807965';ctx.font='9px \'IBM Plex Sans\'';ctx.textAlign='center';
    ctx.fillText((labels[i]||'').substring(0,9),x+bw/2,H-6);
    ctx.fillStyle='#171B17';ctx.font='500 9px \'IBM Plex Mono\'';
    ctx.fillText('$'+fk(v),x+bw/2,y-4);
    c._bars.push({x,y,w:bw,h:bh,label:labels[i]||'',value:v});
  });
}
// Zero-anchored bar chart for signed values (e.g. XIRR cash flows): positive
// bars rise above the zero line in green, negative bars drop below it in red.
function drawSignedBars(id,labels,vals,H_=150){
  const c=gel(id);if(!c)return;
  const ctx=c.getContext('2d'),W=c.width,H=H_,p=26,n=vals.length;
  ctx.clearRect(0,0,W,H);
  const mid=(H-p)/2+8;
  const mx=Math.max(...vals.map(v=>Math.abs(v)))||1;
  const bw=Math.min(48,(W-p*2)/n-6),gap=(W-p*2-bw*n)/((n-1)||1);
  ctx.strokeStyle='#DBD5C4';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(p-6,mid);ctx.lineTo(W-p+6,mid);ctx.stroke();
  vals.forEach((v,i)=>{
    const x=p+i*(bw+gap),bh=Math.abs(v)/mx*(mid-14),neg=v<0,y=neg?mid:mid-bh;
    ctx.beginPath();
    ctx.fillStyle=neg?'#8C2E22':'#0F4F35';
    if(ctx.roundRect)ctx.roundRect(x,y,bw,bh,2);else ctx.rect(x,y,bw,bh);
    ctx.fill();
    ctx.fillStyle='#807965';ctx.font='8.5px \'IBM Plex Sans\'';ctx.textAlign='center';
    ctx.fillText((labels[i]||'').substring(0,8),x+bw/2,H-6);
    ctx.fillStyle=neg?'#8C2E22':'#0F4F35';ctx.font='500 8.5px \'IBM Plex Mono\'';
    ctx.fillText((neg?'-$':'$')+fk(Math.abs(v)),x+bw/2,neg?y+bh+11:y-4);
  });
}

// ── Directory ───────────────────────────────────────────────────
const SECTIONS=[
  {title:'💰 Personal Finance',badge:false,items:[
    {id:'loan',icon:'🏦',name:'Loan / EMI',desc:'Find your monthly loan payment and see exactly how much of it goes to interest vs principal',popular:true},
    {id:'loaneligibility',icon:'✅',name:'Loan Eligibility',desc:'Find out how much loan you may qualify for based on your income and existing debts'},
    {id:'dti',icon:'📊',name:'Debt-to-Income Ratio',desc:'Check your DTI against what lenders typically look for'},
    {id:'prepay',icon:'⏩',name:'Loan Prepayment',desc:'See how much time and interest you can save by paying extra toward your loan each month'},
    {id:'refinance',icon:'🔀',name:'Refinance Break-Even',desc:'Find out how many months it takes to recoup closing costs, and whether refinancing is worth it'},
    {id:'loancomp',icon:'📋',name:'Loan Comparison',desc:'Compare up to 3 loan offers side by side to see which one actually costs less overall'},
    {id:'autoloan',icon:'🚗',name:'Auto Loan Calculator',desc:'Calculate your car payment including trade-in, sales tax, and new vs used loan rates',popular:true},
    {id:'tax',icon:'🧾',name:'Tax Estimator',desc:'Estimate your US federal income tax, effective rate, and what you actually take home',popular:true},
    {id:'salary',icon:'💵',name:'Salary Calculator',desc:'Convert your pay between hourly, daily, monthly, and yearly instantly',popular:true},
    {id:'mortgage',icon:'🏠',name:'Mortgage',desc:'Estimate your full monthly home payment including property tax, insurance, and PMI',popular:true},
    {id:'heloc',icon:'🏡',name:'HELOC Calculator',desc:'Find out how much you can borrow against your home equity and what payments look like in the draw vs repayment period'},
    {id:'rentvsbuy',icon:'🏘️',name:'Rent vs Buy Calculator',desc:'Compare your net worth over time if you rent vs buy a home, and find the breakeven year'},
    {id:'mortcomp',icon:'⚖️',name:'Mortgage Comparison',desc:'Compare up to 3 mortgage offers side by side to see which one actually costs less'},
    {id:'savings',icon:'🏛️',name:'Savings Estimator',desc:'See how your savings grow over time with compound interest, and how long it takes to double',popular:true},
    {id:'inflation',icon:'🎈',name:'Inflation Calculator',desc:'See what an amount then is worth now, or will be worth in the future, using your own inflation rate'},
    {id:'provident',icon:'🏦',name:'Provident Fund Calculator',desc:'Project your provident fund (EPF/PF) maturity value from your monthly contributions and interest rate'},
    {id:'retirement',icon:'👴',name:'Retirement Planner',desc:'Find out if you\'re saving enough to retire comfortably, adjusted for inflation',popular:true},
    {id:'socialsecurity',icon:'📜',name:'Social Security Estimator',desc:'See how claiming early or delaying to 70 changes your monthly Social Security benefit'},
    {id:'401k',icon:'🏦',name:'401(k) Calculator',desc:'Project your 401(k) balance at retirement, including employer match',popular:true},
    {id:'millionaire',icon:'💎',name:'Millionaire Calculator',desc:'Find out exactly what age you\'ll hit $1,000,000 based on your savings and investment rate'},
    {id:'fire',icon:'🔥',name:'FIRE Calculator',desc:'Find out how many years until you reach financial independence based on your savings rate'},
    {id:'networth',icon:'💼',name:'Net Worth Calculator',desc:'Total your assets and liabilities to see your net worth, liquidity split, and debt-to-asset ratio'},
    {id:'debtcomp',icon:'❄️',name:'Snowball vs Avalanche',desc:'Compare two popular debt payoff strategies to see which clears your debt faster and cheaper'},
    {id:'debt',icon:'💳',name:'Debt Payoff Planner',desc:'Build a custom plan to pay off your debt and see exactly how much interest you\'ll save',popular:true},
    {id:'ccpayoff',icon:'🎫',name:'Credit Card Payoff',desc:'Compare minimum payments vs a fixed payment to see the real payoff time and interest cost'},
    {id:'rental',icon:'🏘️',name:'Rental Yield',desc:'Check whether a rental property\'s income justifies its price using gross and net yield'},
    {id:'rentalprop',icon:'🏡',name:'Rental Property',desc:'Run the full numbers on a rental property — cash flow, returns, and a 10-year outlook'},
    {id:'savingsgoal',icon:'🎯',name:'Savings Goal Calculator',desc:'Figure out exactly how much to save each month to hit a specific savings target on time'},
    {id:'budget',icon:'🥧',name:'50/30/20 Budget Calculator',desc:'Compare your actual spending against the 50/30/20 rule for needs, wants, and savings',popular:true},
    {id:'emergencyfund',icon:'🛡️',name:'Emergency Fund Calculator',desc:'Find out how big your emergency fund should be and how long it\'ll take to build it'},
    {id:'healthscore',icon:'💯',name:'Financial Health Score',desc:'Get a single score out of 100 that sums up how healthy your overall finances really are'},
    {id:'lifeinsurance',icon:'🛡️',name:'Life Insurance Needs',desc:'Find out how much life insurance coverage your family would actually need'},
    {id:'healthinsurance',icon:'🏥',name:'Health Insurance Cost',desc:'Compare two health plans by their true total annual cost, not just the premium'},
  ]},
  {title:'📈 Investing & Valuation',badge:true,items:[
    {id:'cagr',icon:'📐',name:'CAGR Calculator',desc:'Find the steady annual growth rate that explains how an investment grew over time',popular:true},
    {id:'xirr',icon:'📅',name:'XIRR Calculator',desc:'Calculate your true annualized return when you\'ve invested or withdrawn money at irregular times'},
    {id:'drip',icon:'💧',name:'Dividend Reinvestment',desc:'See how much faster your investment grows when dividends are automatically reinvested'},
    {id:'divgrowth',icon:'📈',name:'Dividend Growth Calculator',desc:'Project how much your dividend income could grow over time, and your yield on cost'},
    {id:'etf',icon:'🗂️',name:'ETF Growth Calculator',desc:'Compare how popular ETFs like SPY, VTI, and QQQ would grow your money side by side'},
    {id:'allocation',icon:'🥧',name:'Asset Allocation Calculator',desc:'Get a recommended stocks/bonds/cash mix based on your age and risk tolerance'},
    {id:'dcf',icon:'🏦',name:'Stock DCF Valuation',desc:'Estimate what a stock is actually worth based on its future cash flows, not just its price'},
    {id:'peg',icon:'📏',name:'PEG Ratio Calculator',desc:'Check whether a stock\'s price is justified by its earnings growth, not just its P/E ratio'},
    {id:'evebitda',icon:'🏢',name:'EV/EBITDA Calculator',desc:'Value a company by its full enterprise value, and see what a peer multiple implies for the share price'},
    {id:'invest',icon:'📈',name:'SIP / Investment',desc:'Project how your monthly investments grow into a future lump sum, with optional yearly step-ups'},
    {id:'dca',icon:'📊',name:'Dollar Cost Averaging',desc:'Calculate shares bought, average cost per share, and compare DCA vs a lump sum investment'},
    {id:'swp',icon:'📉',name:'SWP Calculator',desc:'See how long a lump sum lasts when you withdraw a fixed monthly income from it'},
    {id:'stock',icon:'📉',name:'Stock P&L',desc:'Calculate your real profit or loss on a trade after accounting for brokerage fees'},
    {id:'options',icon:'⚡',name:'Options Profit & Breakeven',desc:'Find the breakeven price, max profit, max loss, and P&L for a call or put position'},
    {id:'split',icon:'🔀',name:'Stock Split Calculator',desc:'See exactly how many new shares you\'ll have and your adjusted cost basis after any forward or reverse split'},
  ]},
  {title:'🚀 Startup & Business',badge:false,items:[
    {id:'burnrate',icon:'🔥',name:'Burn Rate',desc:'Find out how many months of cash your startup has left before it runs out of money'},
    {id:'pricing',icon:'🏷️',name:'Pricing Calculator',desc:'Work out the right price for your product using cost-plus, value-based, or competitor pricing'},
    {id:'equity',icon:'📐',name:'Equity Dilution',desc:'See how much of your company you\'ll still own after future funding rounds and option pools'},
    {id:'dilutionimpact',icon:'📉',name:'Stock Dilution Impact Calculator',desc:'See how a new share offering affects EPS and the value of your existing shares'},
    {id:'revenue',icon:'📊',name:'Revenue Forecast',desc:'Forecast your monthly recurring revenue under best-case, expected, and worst-case scenarios'},
    {id:'cac',icon:'🎯',name:'CAC & LTV:CAC Ratio',desc:'Find your customer acquisition cost and whether your growth engine is actually profitable'},
    {id:'breakeven',icon:'📈',name:'Break-even Analysis',desc:'Find out exactly how many units you need to sell before your business starts turning a profit'},
    {id:'cashflow',icon:'💵',name:'Cash Flow Analyzer',desc:'See whether more money is coming in than going out, and what\'s left over each month'},
  ]},
  {title:'🔬 Tools',badge:false,items:[
    {id:'currency',icon:'💱',name:'Currency Converter',desc:'Quickly convert between 15 major world currencies using live, daily-updated exchange rates',popular:true},
    {id:'billsplit',icon:'🍽️',name:'Itemized Bill Splitter',desc:'Split a restaurant bill fairly by what each person ordered, with tax and tip split proportionally'},
    {id:'remit',icon:'🌍',name:'International Transfer Cost',desc:'See the true cost of sending money abroad, including hidden exchange rate markup'},
    {id:'scientific',icon:'🔬',name:'Scientific Calculator',desc:'A full scientific calculator with trig, logarithms, powers, factorials, and memory functions'},
  ]},
];
function buildDir(){
  const el=gel('dir-home');el.innerHTML='';
  SECTIONS.forEach(sec=>{
    const slug=sec.title.replace(/[^\w\s-]/g,'').trim().toLowerCase().replace(/\s+/g,'-');
    let html=`<div class="dir-sec" id="dir-sec-${slug}"><a class="dir-sec-h" href="/${slug}" style="text-decoration:none;color:inherit" onclick="location.href='/${slug}';return false;">${sec.title}${sec.badge?' <span class="badge-new">New</span>':''}</a><div class="dir-grid">`;
    sec.items.forEach(it=>{html+=`<a class="dir-card" href="/${it.id}" onclick="location.href='/${it.id}';return false;">${it.popular?'<span class="pop-star" title="Popular calculator" aria-label="Popular calculator">⭐</span>':''}<div class="dir-icon">${it.icon}</div><div class="dir-name">${it.name}</div><div class="dir-desc">${it.desc}</div></a>`;});
    html+='</div></div>';el.innerHTML+=html;
  });
}

// ── CAGR ────────────────────────────────────────────────────────
function calcCAGR(){
  const begin=+gel('cg-begin').value||0,end=+gel('cg-end').value||0,yrs=+gel('cg-years').value||1;
  const cagr=yrs>0?(Math.pow(end/Math.max(begin,1),1/yrs)-1)*100:0;
  const totalRet=begin>0?(end-begin)/begin*100:0,gain=end-begin;
  gel('cg-rate').textContent=pct(cagr);gel('cg-total').textContent=pct(totalRet);
  gel('cg-gain').textContent=f$(gain);gel('cg-gain').style.color=gain>=0?'var(--g)':'var(--r)';
  gel('cg-mult').textContent=(end/Math.max(begin,1)).toFixed(2)+'x';
  let proj='';
  [1,3,5,10,15,20].forEach(y=>{const v=begin*Math.pow(1+cagr/100,y);proj+=`<div class="rrow"><span class="rk">Value in ${y} yr${y>1?'s':''}</span><span class="rv" style="color:var(--a)">${f$(v)}</span></div>`;});
  gel('cg-proj').innerHTML=proj;
  const dbl=cagr>0?(72/cagr).toFixed(1):'∞';
  gel('cg-rule').innerHTML=`<strong style="color:var(--a)">Rule of 72:</strong> At ${pct(cagr)} CAGR, money doubles every <strong style="color:var(--t)">${dbl}</strong> years`;
  const pts=Array.from({length:Math.min(yrs,30)+1},(_,i)=>begin*Math.pow(1+cagr/100,i));
  drawLine('cg-chart',[{data:pts,color:'#F0B90B',fill:true}],200);

  const insights=[];
  const SP500=10;
  if(cagr>SP500+1){
    insights.push({type:'good',text:`A <strong>${pct(cagr)}</strong> CAGR beats the S&P 500's long-term average of roughly 10% — this performed well above the broad market.`});
  }else if(cagr<SP500-1 && cagr>0){
    insights.push({type:'bad',text:`A <strong>${pct(cagr)}</strong> CAGR is below the S&P 500's long-term average of roughly 10% — a simple index fund has historically outperformed this.`});
  }else if(cagr<=0){
    insights.push({type:'bad',text:`A <strong>${pct(cagr)}</strong> CAGR means this investment lost value overall, or barely broke even, over the period measured.`});
  }else{
    insights.push({type:'neutral',text:`A <strong>${pct(cagr)}</strong> CAGR is roughly in line with the S&P 500's long-term historical average of about 10%.`});
  }
  if(yrs>=2){
    const v10=begin*Math.pow(1+cagr/100,10);
    insights.push({type:'neutral',text:`If this growth rate held steady, <strong>${f$(begin)}</strong> would grow to roughly <strong>${f$(v10)}</strong> after 10 years.`});
  }
    insights.push({type:'neutral',text:`Want to see this growth with regular monthly contributions added, not just a single lump sum? Try the <a href="/invest" style="color:var(--a);text-decoration:underline">SIP</a> calculator, or check the exact annualized return with <a href="/xirr" style="color:var(--a);text-decoration:underline">XIRR</a> if your cash flows weren't a single lump sum.`});
  renderInsights('cg-insights',insights);
}

// ── XIRR ────────────────────────────────────────────────────────
let xirrFlows=[{date:'2020-01-01',amt:-10000},{date:'2021-06-15',amt:-5000},{date:'2022-03-20',amt:3000},{date:'2024-01-01',amt:20000}];
function renderXIRR(){
  const el=gel('xirr-rows');el.innerHTML='';
  xirrFlows.forEach((fl,i)=>{
    el.innerHTML+=`<div class="row-3" style="margin-bottom:6px;align-items:center">
      <input type="date" value="${fl.date}" onchange="xirrFlows[${i}].date=this.value;calcXIRR()" style="background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-family:var(--mo);font-size:12px;outline:none;width:100%">
      <div class="ip" style="display:block"><span class="pfx">$</span><input type="text" inputmode="decimal" data-allow-negative="1" value="${fl.amt}" onchange="xirrFlows[${i}].amt=+this.value;calcXIRR()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px 8px 8px 20px;color:${fl.amt<0?'var(--r)':'var(--g)'};font-family:var(--mo);font-size:13px;outline:none"></div>
      <button class="btn-del" aria-label="Remove cash flow ${i+1}" onclick="xirrFlows.splice(${i},1);renderXIRR()">✕</button>
    </div>`;
  });
  calcXIRR();
  attachInputGuards();
}
function addXIRR(){xirrFlows.push({date:new Date().toISOString().split('T')[0],amt:-1000});renderXIRR();}
function calcXIRR(){
  const dates=xirrFlows.map(f=>new Date(f.date)),amounts=xirrFlows.map(f=>f.amt);
  const t0=dates[0],days=dates.map(d=>(d-t0)/864e5);
  let rate=0.1;
  for(let k=0;k<200;k++){
    let npv=0,dnpv=0;
    amounts.forEach((a,i)=>{const t=days[i]/365;npv+=a/Math.pow(1+rate,t);dnpv-=t*a/Math.pow(1+rate,t+1);});
    if(Math.abs(npv)<1e-6||Math.abs(dnpv)<1e-10)break;
    rate-=npv/dnpv;
  }
  const r=isFinite(rate)?rate*100:0;
  const inv=amounts.filter(a=>a<0).reduce((s,a)=>s-a,0),rec=amounts.filter(a=>a>0).reduce((s,a)=>s+a,0),net=rec-inv;
  gel('xirr-rate').textContent=pct(r);gel('xirr-rate').style.color=r>=0?'var(--a)':'var(--r)';
  gel('xirr-inv').textContent=f$(inv);gel('xirr-rec').textContent=f$(rec);
  gel('xirr-net').textContent=f$(net);gel('xirr-net').style.color=net>=0?'var(--g)':'var(--r)';
  gel('xirr-mult').textContent=inv>0?(rec/inv).toFixed(2)+'x':'—';
  gel('xirr-vs-sp').textContent=r>=10?'✓ Outperforming':'✗ Underperforming';gel('xirr-vs-sp').style.color=r>=10?'var(--g)':'var(--r)';
  gel('xirr-vs-inf').textContent=r>=3?'✓ Real positive return':'✗ Real negative return';gel('xirr-vs-inf').style.color=r>=3?'var(--g)':'var(--r)';

  const cfLabels=xirrFlows.map(f=>{const d=new Date(f.date);return d.toLocaleDateString('en-US',{month:'short',year:'2-digit'});});
  drawSignedBars('xirr-chart',cfLabels,amounts,150);

  const insights=[];
  const gap=r-10;
  if(gap>=1){
    insights.push({type:'good',text:`Your <strong>${pct(r)}</strong> annualized return beats the S&P 500's long-term average by <strong>${gap.toFixed(1)} points</strong>.`});
  }else if(gap<=-1){
    insights.push({type:'bad',text:`Your <strong>${pct(r)}</strong> annualized return trails the S&P 500's long-term average by <strong>${Math.abs(gap).toFixed(1)} points</strong> — a simple index fund would likely have done better.`});
  }else{
    insights.push({type:'neutral',text:`Your <strong>${pct(r)}</strong> annualized return is roughly in line with the S&P 500's long-term average.`});
  }
  insights.push({type:net>=0?'good':'bad',text:`You've ${net>=0?'gained':'lost'} <strong>${f$(Math.abs(net))}</strong> in absolute terms, turning every dollar invested into <strong>${inv>0?(rec/inv).toFixed(2):'0'}x</strong>.`});
    insights.push({type:'neutral',text:`Want a single smooth growth rate instead of one that accounts for timing? Compare it with <a href="/cagr" style="color:var(--a);text-decoration:underline">CAGR</a>, or see how reinvesting future payouts could compound further with <a href="/drip" style="color:var(--a);text-decoration:underline">DRIP</a>.`});
  renderInsights('xirr-insights',insights);
}

// ── DRIP ────────────────────────────────────────────────────────
function calcDRIP(){
  const shares=+gel('dr-shares').value||0,price=+gel('dr-price').value||0,divYield=(+gel('dr-yield').value||0)/100,divGrow=(+gel('dr-divgrow').value||0)/100,grow=(+gel('dr-grow').value||0)/100,monthly=+gel('dr-monthly').value||0,years=+gel('dr-years').value||1;
  let sh=shares,pr=price,tots=[],divs=[],shArr=[],priceArr=[],totDiv=0;
  for(let y=1;y<=Math.min(years,40);y++){
    pr*=(1+grow);const dy=divYield*Math.pow(1+divGrow,y-1),annDiv=sh*pr*dy;
    totDiv+=annDiv;sh+=pr?(annDiv/pr+(monthly*12)/pr):0;tots.push(sh*pr);divs.push(annDiv);shArr.push(sh);priceArr.push(pr);
  }
  const invested=shares*price+monthly*12*years,finalPortfolio=tots[tots.length-1]||0;
  gel('dr-final').textContent=f$(finalPortfolio);
  gel('dr-anndiv').textContent=f$(sh*(pr*(+gel('dr-yield').value||0)/100));
  gel('dr-shares2').textContent=Math.round(sh).toLocaleString();
  gel('dr-totdiv').textContent=f$(totDiv);
  gel('dr-invested').textContent=f$(invested);
  const gain=finalPortfolio-invested;gel('dr-gain').textContent=f$(gain);gel('dr-gain').style.color=gain>=0?'var(--g)':'var(--r)';
  drawLine('dr-chart',[{data:tots,color:'#F0B90B',fill:true},{data:divs.map(v=>v*10),color:'#0F4F35',fill:false,dash:[4,3]}],190);

  let drRows='<thead><tr><th style="text-align:left;padding:6px 8px;font-size:11px;color:var(--m);border-bottom:1px solid var(--bd)">Year</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--m)">Shares</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--g)">Annual Dividend</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--a)">Portfolio Value</th></tr></thead><tbody>';
  for(let i=0;i<tots.length;i++){
    drRows+=`<tr><td style="text-align:left;font-size:12px;color:var(--m);border-bottom:1px solid var(--bd);padding:7px 8px">Year ${i+1}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px">${Math.round(shArr[i]).toLocaleString()}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;color:var(--g)">${f$(divs[i])}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;color:var(--a);font-weight:600">${f$(tots[i])}</td></tr>`;
  }
  drRows+='</tbody>';
  if(gel('dr-table'))gel('dr-table').innerHTML=drRows;

  // Without reinvestment comparison
  let sh2=shares,pr2=price,cashAccum=0;
  for(let y=1;y<=Math.min(years,40);y++){
    pr2*=(1+grow);const dy=divYield*Math.pow(1+divGrow,y-1),annDiv=sh2*pr2*dy;
    cashAccum+=annDiv;
  }
  const noReinvestFinal=sh2*pr2+cashAccum+monthly*12*years;
  const drIpAdvantage=finalPortfolio-noReinvestFinal;

  const insights=[];
  if(drIpAdvantage>0)insights.push({type:'good',text:`Reinvesting dividends grows your portfolio to <strong>${f$(finalPortfolio)}</strong> — about <strong>${f$(drIpAdvantage)}</strong> more than if you'd taken dividends as cash instead.`});
  insights.push({type:'neutral',text:`Your share count grows from <strong>${shares.toLocaleString()}</strong> to roughly <strong>${Math.round(sh).toLocaleString()}</strong> shares purely through reinvestment, before counting any new money you add.`});
    insights.push({type:'neutral',text:`Curious how a different dividend growth rate would change this outcome? The <a href="/divgrowth" style="color:var(--a);text-decoration:underline">Dividend Growth</a> calculator projects future income under different growth assumptions.`});
  renderInsights('dr-insights',insights);
}

// ── Dividend Growth ──────────────────────────────────────────────
function projectDivIncome(amount,yieldPct,growthPct,years,reinvest,priceGrowthPct){
  let shares=amount,price=1; // track in "dollar shares" so amount works directly without needing a separate price input
  let dps=yieldPct/100; // dividend per "dollar share" per year
  const income=[];
  for(let y=1;y<=years;y++){
    const incomeThisYear=shares*dps;
    income.push(incomeThisYear);
    if(reinvest){
      price*=(1+priceGrowthPct/100);
      shares+=incomeThisYear/price;
    }
    dps*=(1+growthPct/100);
  }
  return income;
}
function cDivGrowth(){
  const reinvest=gel('dg-reinvest').checked,compare=gel('dg-compare').checked;
  gel('dg-priceGrowthField').style.display=reinvest?'':'none';
  gel('dg-compareFields').style.display=compare?'':'none';

  const amount=+gel('dg-amount-a').value||0,yieldA=+gel('dg-yield-a').value||0,growthA=+gel('dg-growth-a').value||0;
  const years=+gel('dg-years').value||1,priceGrowth=+gel('dg-pricegrowth').value||0;

  const incomeA=projectDivIncome(amount,yieldA,growthA,years,reinvest,priceGrowth);
  let incomeB=null;
  if(compare){
    const yieldB=+gel('dg-yield-b').value||0,growthB=+gel('dg-growth-b').value||0;
    incomeB=projectDivIncome(amount,yieldB,growthB,years,reinvest,priceGrowth);
  }

  gel('dg-income1').textContent=f$(incomeA[0]||0);
  gel('dg-incomeN').textContent=f$(incomeA[incomeA.length-1]||0);
  const yoc=amount>0?(incomeA[incomeA.length-1]/amount*100):0;
  gel('dg-yoc').textContent=pct(yoc);
  const dbl=growthA>0?Math.log(2)/Math.log(1+growthA/100):Infinity;
  gel('dg-double').textContent=isFinite(dbl)?dbl.toFixed(1)+' yrs':'∞';

  const datasets=[{data:incomeA,color:'#0F4F35',fill:!compare,w:2.5}];
  if(compare)datasets.push({data:incomeB,color:'#1B3A5C',fill:false,w:2.5});
  drawLine('dg-chart',datasets,170);
  gel('dg-legend').innerHTML=compare?'<span style="color:var(--g)">━ Profile A</span><span style="color:var(--b)">━ Profile B</span>':'<span style="color:var(--g)">━ Profile A</span>';

  let rows='<thead><tr><th style="text-align:left;padding:6px 8px;font-size:11px;color:var(--m);border-bottom:1px solid var(--bd)">Year</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--g)">Profile A Income</th>';
  if(compare)rows+='<th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--b)">Profile B Income</th>';
  rows+='</tr></thead><tbody>';
  const step=years>15?Math.ceil(years/15):1;
  for(let i=0;i<incomeA.length;i++){
    if((i+1)%step!==0 && i!==incomeA.length-1)continue;
    rows+=`<tr><td style="text-align:left;font-size:12px;color:var(--m);border-bottom:1px solid var(--bd);padding:7px 8px">Year ${i+1}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;color:var(--g);font-weight:600">${f$(incomeA[i])}</td>`;
    if(compare)rows+=`<td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;color:var(--b);font-weight:600">${f$(incomeB[i])}</td>`;
    rows+='</tr>';
  }
  rows+='</tbody>';
  gel('dg-table').innerHTML=rows;

  const insights=[];
  const multiple=incomeA[0]>0?incomeA[incomeA.length-1]/incomeA[0]:0;
  insights.push({type:'good',text:`Your annual dividend income grows from <strong>${f$(incomeA[0])}</strong> to <strong>${f$(incomeA[incomeA.length-1])}</strong> over ${years} years — a <strong>${multiple.toFixed(1)}x</strong> increase, purely from dividend growth${reinvest?' and reinvestment':''}.`});
  insights.push({type:'neutral',text:`Your yield on cost reaches <strong>${pct(yoc)}</strong> by year ${years}, even though the stock's current yield to a new buyer today is only <strong>${pct(yieldA)}</strong>.`});
  if(compare){
    let crossoverYear=null;
    for(let i=0;i<incomeA.length;i++){if(incomeB[i]>incomeA[i]){crossoverYear=i+1;break;}}
    if(crossoverYear){
      insights.push({type:'neutral',text:`Profile B starts behind but overtakes Profile A's income around <strong>year ${crossoverYear}</strong> — the faster dividend growth eventually wins out if you hold long enough.`});
    }else{
      const aFinal=incomeA[incomeA.length-1],bFinal=incomeB[incomeB.length-1];
      insights.push({type:'neutral',text:`Within this ${years}-year window, Profile ${aFinal>=bFinal?'A':'B'} stays ahead the whole time — Profile B's growth rate hasn't had enough time yet to overtake Profile A's higher starting yield.`});
    }
  }
  if(!reinvest)insights.push({type:'neutral',text:`This assumes dividends are taken as cash, not reinvested — check the reinvest box to see how much faster income grows when dividends buy more shares.`});
    insights.push({type:'neutral',text:`If this income is meant to eventually cover living expenses, see how it stacks up against a real target with the <a href="/retirement" style="color:var(--a);text-decoration:underline">Retirement</a> or <a href="/fire" style="color:var(--a);text-decoration:underline">FIRE</a> calculator.`});
  renderInsights('dg-insights',insights);
}

// ── ETF ─────────────────────────────────────────────────────────
const ETFS=[{name:'S&P 500 (SPY)',ret:10.5,color:'#F0B90B'},{name:'Total Mkt (VTI)',ret:10.8,color:'#0F4F35'},{name:'NASDAQ (QQQ)',ret:14.2,color:'#1B3A5C'},{name:'Intl Dev (VXUS)',ret:7.2,color:'#8B6B9E'}];
function calcETF(){
  const init=+gel('et-init').value||0,monthly=+gel('et-monthly').value||0,years=+gel('et-years').value||1,exp=+gel('et-exp').value||0;
  const sim=r=>{const net=(r-exp)/100,mr=net/12,n=years*12;return mr?init*Math.pow(1+mr,n)+monthly*(Math.pow(1+mr,n)-1)/mr*(1+mr):init+monthly*n;};
  const invested=init+monthly*12*years;
  gel('et-invested').textContent=f$(invested);
  const baseNoFee=(()=>{const mr=10.5/100/12,n=years*12;return mr?init*Math.pow(1+mr,n)+monthly*(Math.pow(1+mr,n)-1)/mr*(1+mr):init+monthly*n;})();
  gel('et-drag').textContent=f$(Math.abs(sim(10.5)-baseNoFee));
  const maxV=sim(14.2);let html='';
  ETFS.forEach(e=>{
    const v=sim(e.ret),gain=(v-invested)/invested*100;
    html+=`<div style="background:var(--s2);border-radius:8px;padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:12px;font-weight:500;color:${e.color}">${e.name}</span><span style="font-family:var(--mo);font-size:13px">${f$(v)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--m);margin-bottom:4px"><span>Net: ${(e.ret-exp).toFixed(2)}%</span><span style="color:var(--g)">${pct(gain)} gain</span></div>
      <div class="pbar-bg"><div class="pbar-fill" style="width:${Math.min(100,(v-invested)/(maxV-invested)*100)}%;background:${e.color}"></div></div>
    </div>`;
  });
  gel('et-results').innerHTML=html;
  const ptsByETF=ETFS.map(e=>({data:Array.from({length:years+1},(_,i)=>{const net=(e.ret-exp)/100,mr=net/12,n=i*12;return mr?init*Math.pow(1+mr,n)+monthly*(Math.pow(1+mr,n)-1)/mr*(1+mr):init+monthly*n;}),color:e.color,fill:false,w:2.5}));
  drawLine('et-chart',ptsByETF,200);
  gel('et-legend').innerHTML=ETFS.map(e=>`<span style="color:${e.color};font-size:11px">━ ${e.name.split(' ')[0]}</span>`).join('');

  const insights=[];
  const best=ETFS.reduce((a,b)=>sim(b.ret)>sim(a.ret)?b:a),worst=ETFS.reduce((a,b)=>sim(b.ret)<sim(a.ret)?b:a);
  const spread=sim(best.ret)-sim(worst.ret);
  if(spread>1)insights.push({type:'neutral',text:`Over ${years} years, the gap between the best (<strong>${best.name}</strong>) and weakest (<strong>${worst.name}</strong>) option here is roughly <strong>${f$(spread)}</strong>.`});
  const dragAmt=Math.abs(sim(10.5)-baseNoFee);
  if(dragAmt>50)insights.push({type:exp>0.5?'bad':'good',text:`Your <strong>${exp}%</strong> expense ratio costs you about <strong>${f$(dragAmt)}</strong> over this period compared to a 0%-fee fund — ${exp>0.5?'consider a lower-cost index option':'this is a very low, index-fund-typical fee'}.`});
    insights.push({type:'neutral',text:`Not sure how much of your portfolio should even be in ETFs versus other assets? The <a href="/allocation" style="color:var(--a);text-decoration:underline">Asset Allocation</a> calculator finds a mix appropriate for your age and risk tolerance.`});
  renderInsights('et-insights',insights);
}

// ── DCF ─────────────────────────────────────────────────────────
function calcDCF(){
  const ticker=gel('dc-ticker').value,price=+gel('dc-price').value||0,eps=+gel('dc-eps').value||0,shares=+gel('dc-shares').value||0,grow=(+gel('dc-grow').value||0)/100,tgrow=(+gel('dc-tgrow').value||0)/100,disc=(+gel('dc-disc').value||0)/100,yrs=+gel('dc-yrs').value||10;
  const proj=Array.from({length:yrs},(_,i)=>eps*Math.pow(1+grow,i+1));
  const pv=proj.map((e,i)=>e/Math.pow(1+disc,i+1));
  const denom=disc-tgrow;
  const tv=denom!==0?(proj[yrs-1]*(1+tgrow))/denom:0,tvPV=tv/Math.pow(1+disc,yrs);
  const fair=pv.reduce((a,b)=>a+b,0)+tvPV;
  const upside=price?(fair-price)/price*100:0,mos=fair?(fair-price)/fair*100:0;
  gel('dc-ticker-lbl').textContent=ticker;
  gel('dc-fair').textContent='$'+fair.toFixed(2);gel('dc-fair').style.color=fair>price?'var(--g)':'var(--r)';
  gel('dc-cur').textContent='$'+price;
  gel('dc-upside').textContent=(upside>=0?'+':'')+pct(upside);gel('dc-upside').style.color=upside>=0?'var(--g)':'var(--r)';
  gel('dc-mos').textContent=pct(mos);gel('dc-mos').style.color=mos>=20?'var(--g)':mos>=0?'var(--a)':'var(--r)';
  gel('dc-mktcap').textContent='$'+fk(price*shares*1e9);gel('dc-tvpv').textContent='$'+tvPV.toFixed(2);
  gel('dc-bear').textContent='$'+(fair*.7).toFixed(2);gel('dc-bear').style.color=(fair*.7)>price?'var(--g)':'var(--r)';
  gel('dc-base').textContent='$'+fair.toFixed(2);
  gel('dc-bull').textContent='$'+(fair*1.3).toFixed(2);gel('dc-bull').style.color='var(--g)';
  let tbl=`<thead><tr><th style="text-align:left">Year</th><th>Proj EPS</th><th>PV of EPS</th><th>Cumulative PV</th><th>% of Value</th></tr></thead><tbody>`;
  let cum=0;proj.forEach((e,i)=>{cum+=pv[i];if(i===yrs-1)cum+=tvPV;tbl+=`<tr><td>Y${i+1}</td><td style="color:var(--a)">$${e.toFixed(2)}</td><td>$${pv[i].toFixed(2)}</td><td>$${cum.toFixed(2)}</td><td style="color:var(--g)">${pct(fair?pv[i]/fair*100:0)}</td></tr>`;});
  tbl+=`<tr class="hl"><td style="color:var(--p)">Terminal</td><td style="color:var(--p)">$${(proj[yrs-1]*(1+tgrow)).toFixed(2)}</td><td style="color:var(--p)">$${tvPV.toFixed(2)}</td><td style="color:var(--a)">$${fair.toFixed(2)}</td><td style="color:var(--p)">${pct(tvPV/fair*100)}</td></tr></tbody>`;
  gel('dc-table').innerHTML=tbl;
  drawLine('dc-chart',[{data:proj,color:'#F0B90B',fill:true},{data:pv,color:'#0F4F35',fill:false,dash:[4,3]}],130);

  const insights=[];
  if(mos>=20){
    insights.push({type:'good',text:`At a <strong>${pct(mos)}</strong> margin of safety, ${ticker||'this stock'} looks <strong>undervalued</strong> relative to its estimated intrinsic value of $${fair.toFixed(2)}.`});
  }else if(mos>=0){
    insights.push({type:'neutral',text:`At a <strong>${pct(mos)}</strong> margin of safety, ${ticker||'this stock'} is close to fairly valued — there isn't much of a discount built in at the current price.`});
  }else{
    insights.push({type:'bad',text:`At <strong>${pct(mos)}</strong> margin of safety, ${ticker||'this stock'} appears <strong>overvalued</strong> relative to its estimated intrinsic value of $${fair.toFixed(2)} — you'd be paying more than the model justifies.`});
  }
  const tvShare=tvPV/fair*100;
  if(tvShare>60)insights.push({type:'neutral',text:`<strong>${tvShare.toFixed(0)}%</strong> of this valuation comes from the terminal value — meaning most of the estimate depends on assumptions about growth far in the future, not the next ${yrs} years.`});
  if(price<fair*0.7)insights.push({type:'bad',text:`Even in the <strong>bear case</strong> ($${(fair*.7).toFixed(2)}), the estimated value is above the current price of $${price.toFixed(2)} — worth double-checking your growth assumptions aren't too optimistic.`});
    insights.push({type:'neutral',text:`Want a faster gut-check than a full DCF? The <a href="/peg" style="color:var(--a);text-decoration:underline">PEG Ratio</a> calculator compares valuation against growth in seconds.`});
  renderInsights('dc-insights',insights);
}

// ── PEG Ratio ────────────────────────────────────────────────────
function cPEG(){
  const price=+gel('pg-price').value||0,eps=+gel('pg-eps').value||0,growth=+gel('pg-growth').value||0,basis=gel('pg-basis').value;
  const pe=eps!==0?price/eps:0;
  const peg=growth!==0?pe/growth:0;
  gel('pg-pe').textContent=eps>0?pe.toFixed(2):'N/A';
  gel('pg-pe').style.color=eps<=0?'var(--m)':'var(--a)';

  let verdict,vColor,gaugeScore,gaugeHex;
  if(eps<=0||growth<=0){
    verdict='Not meaningful';vColor='var(--m)';gaugeScore=50;gaugeHex='#A39B87';
    gel('pg-peg').textContent='N/A';gel('pg-peg').style.color='var(--m)';
  }else{
    gel('pg-peg').textContent=peg.toFixed(2);
    if(peg<1){verdict='Undervalued';vColor='var(--g)';gaugeHex='#0F4F35';}
    else if(peg<=1.3){verdict='Fairly Valued';vColor='var(--a)';gaugeHex='#F0B90B';}
    else if(peg<=2){verdict='Moderately Priced';vColor='var(--a)';gaugeHex='#F0B90B';}
    else{verdict='Overvalued';vColor='var(--r)';gaugeHex='#8C2E22';}
    gel('pg-peg').style.color=peg<1?'var(--g)':peg<=2?'var(--a)':'var(--r)';
    gaugeScore=Math.max(0,Math.min(100,100-(peg*33.3)));
  }
  gel('pg-verdict').textContent=verdict;gel('pg-verdict').style.color=vColor;

  const fairPE=growth>0?growth:0;
  gel('pg-fairprice').textContent=fairPE>0?fairPE.toFixed(1):'N/A';

  drawGauge('pg-gauge',gaugeScore,gaugeHex);

  let scaleRows='<thead><tr><th style="text-align:left">PEG Range</th><th>Read</th></tr></thead><tbody>';
  const bands=[{lo:0,hi:1,label:'Undervalued'},{lo:1,hi:1.3,label:'Fairly Valued'},{lo:1.3,hi:2,label:'Moderately Priced'},{lo:2,hi:99,label:'Overvalued'}];
  bands.forEach(b=>{
    const active=eps>0&&growth>0&&peg>=b.lo&&peg<b.hi;
    scaleRows+=`<tr style="${active?'background:rgba(240,185,11,.08)':''}"><td style="text-align:left;font-family:var(--mo)">${b.hi===99?b.lo.toFixed(1)+'+':b.lo.toFixed(1)+' – '+b.hi.toFixed(1)}</td><td style="${active?'font-weight:700;color:var(--a)':''}">${b.label}${active?' ←':''}</td></tr>`;
  });
  scaleRows+='</tbody>';
  gel('pg-scale').innerHTML=scaleRows;

  const insights=[];
  if(eps<=0){
    insights.push({type:'bad',text:`This company has zero or negative earnings — PEG ratio isn't meaningful here. Look at revenue growth or other metrics instead.`});
  }else if(growth<=0){
    insights.push({type:'bad',text:`With a growth rate of <strong>${growth}%</strong>, PEG isn't meaningful — a shrinking or flat-earnings company can't be fairly judged on growth-adjusted valuation.`});
  }else{
    if(peg<1){
      insights.push({type:'good',text:`A PEG of <strong>${peg.toFixed(2)}</strong> suggests this stock may be undervalued relative to its <strong>${growth}%</strong> growth rate — the market may not be fully pricing in its growth.`});
    }else if(peg<=1.3){
      insights.push({type:'good',text:`A PEG of <strong>${peg.toFixed(2)}</strong> is close to the classic "fairly valued" benchmark of 1.0, given a <strong>${growth}%</strong> growth rate.`});
    }else if(peg<=2){
      insights.push({type:'neutral',text:`A PEG of <strong>${peg.toFixed(2)}</strong> suggests the stock is trading at a premium to its <strong>${growth}%</strong> growth rate — not alarming, but worth comparing against sector peers.`});
    }else{
      insights.push({type:'bad',text:`A PEG of <strong>${peg.toFixed(2)}</strong> suggests the price has run well ahead of its <strong>${growth}%</strong> growth rate — double-check whether that growth assumption is realistic before paying this multiple.`});
    }
    const peOnly=pe;
    if(peOnly<15 && peg>2){
      insights.push({type:'bad',text:`This is a classic "value trap" pattern — a P/E of <strong>${peOnly.toFixed(1)}</strong> looks cheap on its own, but the low growth rate behind it means the PEG ratio tells a very different story.`});
    }else if(peOnly>40 && peg<1.3){
      insights.push({type:'neutral',text:`Despite a high P/E of <strong>${peOnly.toFixed(1)}</strong>, the strong <strong>${growth}%</strong> growth rate brings the PEG back down to a reasonable level — high P/E alone doesn't necessarily mean overpriced.`});
    }
    insights.push({type:'neutral',text:`At this <strong>${growth}%</strong> growth rate, a "fairly valued" PEG of 1.0 corresponds to a P/E of about <strong>${growth.toFixed(1)}</strong> — this stock is currently trading at a P/E of <strong>${pe.toFixed(1)}</strong>.`});
  }
    insights.push({type:'neutral',text:`PEG doesn't account for debt levels — the <a href="/evebitda" style="color:var(--a);text-decoration:underline">EV/EBITDA</a> calculator gives a capital-structure-neutral comparison if you're comparing companies with different debt loads.`});
  renderInsights('pg-insights',insights);
}

// ── EV/EBITDA ────────────────────────────────────────────────────
function cEVEBITDA(){
  const price=+gel('ev-price').value||0,shares=+gel('ev-shares').value||0,debt=+gel('ev-debt').value||0,cash=+gel('ev-cash').value||0;
  const ni=+gel('ev-ni').value||0,interest=+gel('ev-interest').value||0,taxes=+gel('ev-taxes').value||0,da=+gel('ev-da').value||0;
  const targetMult=+gel('ev-targetmult').value||0;

  const mktCap=price*shares;
  const ev=mktCap+debt-cash;
  const ebitda=ni+interest+taxes+da;
  const multiple=ebitda>0?ev/ebitda:0;

  gel('ev-mktcap').textContent=f$(mktCap);
  gel('ev-ev').textContent=f$(ev);
  gel('ev-ebitda').textContent=(ebitda<0?'-':'')+f$(ebitda);
  gel('ev-ebitda').style.color=ebitda<0?'var(--r)':'var(--g)';
  gel('ev-multiple').textContent=ebitda>0?multiple.toFixed(2)+'x':'N/A';
  gel('ev-multiple').style.color=ebitda<=0?'var(--m)':multiple<10?'var(--g)':multiple<15?'var(--a)':'var(--r)';

  const impliedEV=ebitda>0?targetMult*ebitda:0;
  const impliedMktCap=ebitda>0?impliedEV-debt+cash:0;
  const impliedPrice=(ebitda>0&&shares>0)?impliedMktCap/shares:0;
  const upside=(ebitda>0&&price>0)?((impliedPrice/price)-1)*100:0;

  if(ebitda>0){
    gel('ev-impliedev').textContent=f$(impliedEV);
    gel('ev-impliedmktcap').textContent=f$(impliedMktCap);
    gel('ev-impliedprice').textContent=(impliedPrice<0?'-$':'$')+Math.abs(impliedPrice).toFixed(2);
    gel('ev-upside').textContent=(upside>=0?'+':'')+upside.toFixed(1)+'%';
    gel('ev-upside').style.color=upside>=0?'var(--g)':'var(--r)';
    drawBars('ev-chart',['Current','Implied'],[price,Math.max(0,impliedPrice)],['#F0B90B','#0F4F35'],140);
  }else{
    gel('ev-impliedev').textContent='N/A';
    gel('ev-impliedmktcap').textContent='N/A';
    gel('ev-impliedprice').textContent='N/A';
    gel('ev-upside').textContent='N/A';gel('ev-upside').style.color='var(--m)';
    drawBars('ev-chart',['Current','Implied'],[price,0],['#F0B90B','#A39B87'],140);
  }

  const insights=[];
  if(ebitda<=0){
    insights.push({type:'bad',text:`EBITDA is zero or negative — EV/EBITDA isn't meaningful for this company. Look at revenue multiples or a DCF-based approach instead.`});
  }else{
    insights.push({type:multiple<10?'good':multiple<15?'neutral':'bad',text:`This company trades at <strong>${multiple.toFixed(2)}x</strong> EV/EBITDA — ${multiple<10?'a relatively modest multiple, typical of mature or moderately-valued businesses':multiple<15?'a moderate-to-premium multiple, suggesting the market expects above-average growth or quality':'a rich multiple, often seen in high-growth sectors or potentially signaling overvaluation'}.`});
    const debtToEV=ev>0?(debt/ev*100):0;
    if(debtToEV>25)insights.push({type:'neutral',text:`Debt makes up <strong>${debtToEV.toFixed(0)}%</strong> of this company's enterprise value — a meaningful share of the business is funded by debt holders, not just shareholders.`});
    if(upside>15){
      insights.push({type:'good',text:`At a <strong>${targetMult}x</strong> target multiple, the implied share price of <strong>$${impliedPrice.toFixed(2)}</strong> suggests roughly <strong>${upside.toFixed(0)}% upside</strong> from the current $${price.toFixed(2)} price.`});
    }else if(upside<-15){
      insights.push({type:'bad',text:`At a <strong>${targetMult}x</strong> target multiple, the implied share price of <strong>$${impliedPrice.toFixed(2)}</strong> suggests roughly <strong>${Math.abs(upside).toFixed(0)}% downside</strong> from the current $${price.toFixed(2)} price.`});
    }else{
      insights.push({type:'neutral',text:`At a <strong>${targetMult}x</strong> target multiple, the implied price of <strong>$${impliedPrice.toFixed(2)}</strong> is close to the current $${price.toFixed(2)} price — the stock looks roughly fairly valued against this benchmark.`});
    }
  }
    insights.push({type:'neutral',text:`Want a growth-adjusted view instead? The <a href="/peg" style="color:var(--a);text-decoration:underline">PEG Ratio</a> calculator factors the earnings growth rate in directly.`});
  renderInsights('ev-insights',insights);
}

// ── Debt Comparison ─────────────────────────────────────────────
let dc2Debts=[{name:'Credit Card',bal:8000,rate:22,min:200},{name:'Car Loan',bal:15000,rate:7,min:300},{name:'Student Loan',bal:25000,rate:5.5,min:280},{name:'Medical Bill',bal:3000,rate:0,min:100}];
const DC2_EXAMPLE=[{name:'Credit Card',bal:8000,rate:22,min:200},{name:'Car Loan',bal:15000,rate:7,min:300},{name:'Student Loan',bal:25000,rate:5.5,min:280},{name:'Medical Bill',bal:3000,rate:0,min:100}];
function renderDC2(){
  const el=gel('dc2-rows');el.innerHTML='';
  dc2Debts.forEach((d,i)=>{
    el.innerHTML+=`<div class="row-debt" style="margin-bottom:6px;align-items:center">
      <input type="text" value="${d.name}" oninput="dc2Debts[${i}].name=this.value;calcDC2()" style="background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-size:13px;outline:none;width:100%">
      <div class="ip"><span class="pfx">$</span><input type="text" inputmode="decimal" value="${d.bal}" oninput="dc2Debts[${i}].bal=+this.value;calcDC2()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px 8px 8px 20px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none"></div>
      <input type="text" inputmode="decimal" value="${d.rate}" step="0.1" oninput="dc2Debts[${i}].rate=+this.value;calcDC2()" style="background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none;width:100%">
      <div class="ip"><span class="pfx">$</span><input type="text" inputmode="decimal" value="${d.min}" oninput="dc2Debts[${i}].min=+this.value;calcDC2()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px 8px 8px 20px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none"></div>
      <button class="btn-del" aria-label="Remove debt ${i+1}" onclick="dc2Debts.splice(${i},1);renderDC2()">✕</button>
    </div>`;
  });calcDC2();attachInputGuards();
}
function addDC2(){dc2Debts.push({name:'New Debt',bal:5000,rate:10,min:100});renderDC2();}
function simDebt(strat,extra){
  let ds=dc2Debts.map(d=>({...d,b:d.bal}));let mo=0,totInt=0,order=[],bH=[];
  while(ds.some(d=>d.b>0)&&mo<600){
    mo++;ds.forEach(d=>{if(d.b>0){const mi=d.b*d.rate/100/12;totInt+=mi;d.b+=mi-d.min;if(d.b<0)d.b=0;}});
    let s=[...ds].filter(d=>d.b>0);
    s.sort(strat==='avalanche'?(a,b)=>b.rate-a.rate:(a,b)=>a.b-b.b);
    let left=extra;s.forEach(d=>{if(left<=0||d.b<=0)return;const p=Math.min(left,d.b);d.b-=p;left-=p;});
    ds.forEach((d,i)=>{if(d.b<=0&&!order.find(o=>o.i===i))order.push({i,name:dc2Debts[i]?.name||'',month:mo});});
    if(mo%4===0)bH.push(ds.reduce((a,d)=>a+d.b,0));
  }
  return{months:mo,totInt,order,bH};
}
function calcDC2(){
  const extra=+gel('dc2-extra').value||0;
  const av=simDebt('avalanche',extra),sn=simDebt('snowball',extra);
  const td=dc2Debts.reduce((a,d)=>a+d.bal,0);
  gel('dc2-total').textContent=f$(td);
  gel('av-months').textContent=av.months+' mo';gel('av-int').textContent=f$(av.totInt);
  gel('sn-months').textContent=sn.months+' mo';gel('sn-int').textContent=f$(sn.totInt);
  gel('dc2-saved').textContent=f$(Math.max(0,sn.totInt-av.totInt));
  gel('dc2-faster').textContent=Math.max(0,sn.months-av.months)+' mo';
  const mkOrder=(data,color)=>data.order.map((o,i)=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;background:var(--s2);border-radius:6px;padding:8px 10px"><div style="width:22px;height:22px;border-radius:50%;background:${color};color:#000;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div><div><div style="font-size:12px;font-weight:500">${o.name}</div><div style="font-size:11px;color:var(--m)">Month ${o.month} · ${(o.month/12).toFixed(1)} yrs</div></div></div>`).join('');
  gel('av-order').innerHTML=mkOrder(av,'var(--b)');gel('sn-order').innerHTML=mkOrder(sn,'var(--g)');
  drawLine('dc2-chart',[{data:av.bH,color:'#1B3A5C',fill:true},{data:sn.bH,color:'#0F4F35',fill:false,w:2}],140);

  const insights=[];
  const intDiff=sn.totInt-av.totInt,timeDiff=sn.months-av.months;
  if(intDiff>10)insights.push({type:'good',text:`<strong>Avalanche</strong> saves you <strong>${f$(intDiff)}</strong> in interest and finishes <strong>${timeDiff} months</strong> sooner than Snowball, by always targeting your highest-rate debt first.`});
  else insights.push({type:'neutral',text:`Both methods land very close together here — your debts don't differ enough in rate or balance order for either approach to clearly win.`});
  const firstPayoff=sn.order[0];
  if(firstPayoff)insights.push({type:'neutral',text:`If you value early motivation over pure savings, <strong>Snowball</strong> clears your first debt (<strong>${firstPayoff.name}</strong>) by month <strong>${firstPayoff.month}</strong> — often sooner than Avalanche clears its first target.`});
    insights.push({type:'neutral',text:`Ready to commit to a payoff plan with your real balances? The <a href="/debt" style="color:var(--a);text-decoration:underline">Debt Payoff</a> calculator locks in a month-by-month schedule.`});
  renderInsights('dc2-insights',insights);
}

// ── Rental Property ─────────────────────────────────────────────
function calcRP(){
  const price=+gel('rp-price').value||0,down=(+gel('rp-down').value||0)/100,mr=(+gel('rp-rate').value||0)/12/100,mn=(+gel('rp-tenure').value||30)*12;
  const rent=+gel('rp-rent').value||0,vac=(+gel('rp-vac').value||0)/100,appr=(+gel('rp-appr').value||0)/100;
  const ptax=+gel('rp-ptax').value||0,ins=+gel('rp-ins').value||0,maint=+gel('rp-maint').value||0,mgmt=(+gel('rp-mgmt').value||0)/100,buycost=(+gel('rp-buycost').value||0)/100;
  const loan=price*(1-down),emi=mr?loan*mr*Math.pow(1+mr,mn)/(Math.pow(1+mr,mn)-1):loan/mn;
  const effRent=rent*(1-vac),annRent=effRent*12,annCosts=ptax+ins+maint*12+rent*mgmt*12,noi=annRent-annCosts,cf=noi-emi*12;
  const tinv=price*down+price*buycost,coc=tinv?cf/tinv*100:0,capRate=price?noi/price*100:0,grossY=price?annRent/price*100:0;
  gel('rp-gross').textContent=pct(grossY);gel('rp-cap').textContent=pct(capRate);
  gel('rp-coc').textContent=pct(coc);gel('rp-coc').style.color=coc>=0?'var(--g)':'var(--r)';
  gel('rp-noi').textContent=f$(noi);gel('rp-noi').style.color=noi>=0?'var(--g)':'var(--r)';
  gel('rp-mort').textContent=f$(emi);gel('rp-effrent').textContent=f$(effRent);
  gel('rp-cf').textContent=f$(cf/12);gel('rp-cf').style.color=cf>=0?'var(--g)':'var(--r)';
  gel('rp-totalinv').textContent=f$(tinv);
  const v10=price*Math.pow(1+appr,10),r10=annRent*10,ret10=(v10-price+r10)/tinv*100;
  gel('rp-10v').textContent=f$(v10);gel('rp-10r').textContent=f$(r10);
  gel('rp-10ret').textContent=pct(ret10);gel('rp-10ret').style.color=ret10>=0?'var(--g)':'var(--r)';
  drawLine('rp-chart',[{data:Array.from({length:11},(_,i)=>price*Math.pow(1+appr,i)),color:'#F0B90B',fill:true},{data:Array.from({length:11},(_,i)=>annRent*i),color:'#0F4F35',fill:false}],155);
  const score=capRate>6?3:capRate>4?2:capRate>2?1:0;
  const lbls=['⚠️ Poor Investment','🟡 Below Average','🟢 Decent Return','🚀 Strong Investment'],cols=['var(--r)','var(--a)','var(--b)','var(--g)'];
  gel('rp-verdict').innerHTML=`<div style="background:var(--s2);border-radius:8px;padding:12px;border-left:3px solid ${cols[score]}"><div style="font-size:13px;font-weight:600;color:${cols[score]};margin-bottom:4px">${lbls[score]}</div><div style="font-size:12px;color:var(--m)">Cap rate ${pct(capRate)} · Cash flow ${cf>=0?'positive ✓':'negative ✗'} · Gross yield ${pct(grossY)}</div></div>`;
  drawDonut('rp-donut',[Math.max(0,noi),emi*12,annCosts],['#0F4F35','#8C2E22','#A39B87']);

  const insights=[];
  insights.push({type:coc>=8?'good':coc>=0?'neutral':'bad',text:`Your cash-on-cash return is <strong>${pct(coc)}</strong> — ${coc>=8?'above the 8% benchmark many investors target':coc>=0?'positive, but below the 8% benchmark many investors target':'negative, meaning this property is costing you money every month'}.`});
  insights.push({type:'neutral',text:`Over 10 years, factoring in both appreciation and rental income, this property could return roughly <strong>${pct(ret10)}</strong> on your initial <strong>${f$(tinv)}</strong> investment.`});
    insights.push({type:'neutral',text:`Already own a rental and want ongoing yield tracking instead of a purchase analysis? The <a href="/rental" style="color:var(--a);text-decoration:underline">Rental Yield</a> calculator is built for that.`});
  renderInsights('rp-insights',insights);
}

// ── Burn Rate ───────────────────────────────────────────────────
function cBurn(){
  const cash=+gel('br-cash').value||0,mrr=+gel('br-mrr').value||0,growth=(+gel('br-growth').value||0)/100;
  const gross=(+gel('br-sal').value||0)+(+gel('br-off').value||0)+(+gel('br-mkt').value||0)+(+gel('br-sw').value||0);
  const net=Math.max(0,gross-mrr);
  gel('br-gross').textContent=f$(gross);gel('br-net').textContent=f$(net);
  let bal=cash,mo=0,bH=[cash];
  while(bal>0&&mo<120){bal=bal-gross+mrr*Math.pow(1+growth,mo);mo++;bH.push(Math.max(0,bal));}
  gel('br-runway').textContent=mo+' months';
  const dd=new Date();dd.setMonth(dd.getMonth()+mo);
  gel('br-date').textContent=dd.toLocaleDateString('en-US',{month:'short',year:'numeric'});
  gel('br-berev').textContent=f$(gross);
  if(growth>0&&mrr<gross){let r=mrr,m2=0;while(r<gross&&m2<120){r*=(1+growth);m2++;}gel('br-bemo').textContent=m2+' months';}
  else gel('br-bemo').textContent=mrr>=gross?'Already profitable':'N/A';
  drawLine('br-chart',[{data:bH.slice(0,Math.min(bH.length,30)),color:'#F0B90B',fill:true}],170);

  const insights=[];
  if(mo<=6){
    insights.push({type:'bad',text:`With <strong>${mo} months</strong> of runway left, you're past the point most advisors recommend starting a raise — fundraises commonly take 3-6 months end to end.`});
  }else if(mo<=12){
    insights.push({type:'neutral',text:`At <strong>${mo} months</strong> of runway, now is a reasonable time to start fundraising conversations, since raises commonly take 3-6 months.`});
  }else{
    insights.push({type:'good',text:`With <strong>${mo} months</strong> of runway, you have breathing room before needing to raise.`});
  }
  const burnMultiple=mrr>0?net/(mrr*growth):0;
  if(growth>0 && mrr>0 && isFinite(burnMultiple) && burnMultiple>0){
    insights.push({type:burnMultiple<2?'good':burnMultiple<4?'neutral':'bad',text:`Your burn multiple is roughly <strong>${burnMultiple.toFixed(1)}x</strong> — ${burnMultiple<2?'efficient, spending less than $2 for every $1 of new revenue growth':burnMultiple<4?'a healthy range for most growth-stage startups':'high; investors will likely scrutinize this closely'}.`});
  }
    insights.push({type:'neutral',text:`Want to see when revenue growth alone extends this runway? Model it with <a href="/revenue" style="color:var(--a);text-decoration:underline">Revenue Forecast</a> or find your exact <a href="/breakeven" style="color:var(--a);text-decoration:underline">Break-Even</a> point.`});
  renderInsights('br-insights',insights);
}

// ── Pricing ─────────────────────────────────────────────────────
function cPricing(){
  const cogs=+gel('pr-cogs').value||0,fixed=+gel('pr-fixed').value||0,units=+gel('pr-units').value||1,margin=(+gel('pr-margin').value||0)/100;
  const clow=+gel('pr-clow').value||0,chigh=+gel('pr-chigh').value||0,value=+gel('pr-value').value||5;
  const overhead=fixed/units,uc=cogs+overhead,cp=uc/(1-margin),vp=(clow+chigh)/2*(0.5+value/10),comp=(clow+chigh)/2,rec=cp*.3+vp*.5+comp*.2;
  gel('pr-costplus').textContent=f$(cp);gel('pr-valueprice').textContent=f$(vp);gel('pr-rec').textContent=f$(rec);
  const profit=rec*units-uc*units-fixed;gel('pr-profit').textContent=f$(profit);gel('pr-profit').style.color=profit>=0?'var(--g)':'var(--r)';
  const tiers=[{n:'Basic',m:.7,d:'Entry-level'},{n:'Standard',m:1,d:'Most popular'},{n:'Pro',m:1.5,d:'Full features'},{n:'Enterprise',m:2.2,d:'Custom + support'}];
  gel('pr-tiers').innerHTML=tiers.map(t=>{const p=rec*t.m,gm=(p-uc)/p*100;return`<div style="background:var(--s2);border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;font-weight:500">${t.n}</div><div style="font-size:11px;color:var(--m)">${t.d}</div><div style="font-size:11px;color:var(--g);margin-top:2px">Margin: ${pct(gm)}</div></div><div style="font-size:20px;font-family:var(--mo);font-weight:600;color:var(--a)">${f$(p)}</div></div>`;}).join('');

  const insights=[];
  const margin_=(rec-uc)/rec*100;
  insights.push({type:margin_>=40?'good':margin_>=15?'neutral':'bad',text:`At <strong>${f$(rec)}</strong>, your margin is <strong>${pct(margin_)}</strong> — ${margin_>=40?'a healthy margin for most product businesses':margin_>=15?'workable, but on the thinner side':'thin; consider raising price or cutting costs before scaling'}.`});
  if(comp>0 && Math.abs(rec-comp)/comp>0.15){
    insights.push({type:'neutral',text:`Your recommended price is <strong>${rec>comp?'above':'below'}</strong> the competitor midpoint of <strong>${f$(comp)}</strong> by about <strong>${Math.abs((rec-comp)/comp*100).toFixed(0)}%</strong>.`});
  }
    insights.push({type:'neutral',text:`Once you've settled on a price, see exactly how many units you need to sell to break even with the <a href="/breakeven" style="color:var(--a);text-decoration:underline">Break-Even Point</a> calculator.`});
  renderInsights('pr-insights',insights);
}

// ── Equity ──────────────────────────────────────────────────────
let founders=[{name:'Founder A',pct:45},{name:'Founder B',pct:45}];
let rounds=[{name:'Seed',raise:2e6,pre:1e7},{name:'Series A',raise:1e7,pre:4e7}];
const EQ_EXAMPLE_FOUNDERS=[{name:'Founder A',pct:45},{name:'Founder B',pct:45}];
const EQ_EXAMPLE_ROUNDS=[{name:'Seed',raise:2e6,pre:1e7},{name:'Series A',raise:1e7,pre:4e7}];
const EQC=['#F0B90B','#0F4F35','#1B3A5C','#8B6B9E','#8C2E22','#5C7A5E'];
function renderFounders(){
  const el=gel('eq-founders');el.innerHTML='';
  founders.forEach((f,i)=>{el.innerHTML+=`<div class="row-3" style="margin-bottom:6px;align-items:end"><div class="field" style="margin:0"><input type="text" value="${f.name}" oninput="founders[${i}].name=this.value;calcEquity()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-size:13px;outline:none"></div><div class="field" style="margin:0"><input type="text" inputmode="decimal" value="${f.pct}" step="0.5" oninput="founders[${i}].pct=+this.value;calcEquity()" placeholder="%" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none"></div><button class="btn-del" aria-label="Remove founder ${(f.name||('founder '+(i+1))).replace(/"/g,'&quot;')}" onclick="founders.splice(${i},1);renderFounders()">✕</button></div>`;});
  calcEquity();
  attachInputGuards();
}
function renderRounds(){
  const el=gel('eq-rounds');el.innerHTML='';
  rounds.forEach((r,i)=>{el.innerHTML+=`<div style="border:1px solid var(--bd);border-radius:8px;padding:10px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><input type="text" value="${r.name}" oninput="rounds[${i}].name=this.value;calcEquity()" style="background:none;border:none;color:var(--t);font-weight:500;font-size:13px;outline:none;width:100px"><button class="btn-del" aria-label="Remove funding round ${(r.name||('round '+(i+1))).replace(/"/g,'&quot;')}" onclick="rounds.splice(${i},1);renderRounds()" style="padding:3px 8px">✕</button></div><div class="g2"><div class="field" style="margin-bottom:6px"><label>Raise Amount ($)</label><div class="ip"><span class="pfx">$</span><input type="text" inputmode="decimal" value="${r.raise}" oninput="rounds[${i}].raise=+this.value;calcEquity()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px 8px 8px 20px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none"></div></div><div class="field" style="margin-bottom:6px"><label>Pre-money Val. ($)</label><div class="ip"><span class="pfx">$</span><input type="text" inputmode="decimal" value="${r.pre}" oninput="rounds[${i}].pre=+this.value;calcEquity()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px 8px 8px 20px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none"></div></div></div></div>`;});
  calcEquity();
  attachInputGuards();
}
function addFounder(){founders.push({name:'Co-founder',pct:10});renderFounders();}
function addRound(){rounds.push({name:'New Round',raise:5e6,pre:2e7});renderRounds();}
function calcEquity(){
  const pool=+gel('eq-pool').value||0;
  let dil=1;rounds.forEach(r=>{const p=r.raise/(r.pre+r.raise);dil*=(1-p);});
  const pd=(100-pool)/100;
  const rows=[...founders.map(f=>({name:f.name,init:f.pct,final:parseFloat((f.pct*dil*pd/100*100).toFixed(2))})),{name:'Option Pool',init:pool,final:parseFloat((pool*dil).toFixed(2))}];
  let cdil=1;rounds.forEach((r,i)=>{const p=r.raise/(r.pre+r.raise)*100;rows.push({name:r.name+' Investors',init:0,final:parseFloat((p*cdil).toFixed(2))});cdil*=(1-p/100);});
  const lastVal=rounds.length?rounds[rounds.length-1].pre+rounds[rounds.length-1].raise:10000000;
  const fPct=founders.reduce((a,f)=>a+f.pct*dil*pd/100,0)*100;
  gel('eq-val').textContent=f$(lastVal);gel('eq-dil').textContent=pct(100-fPct);gel('eq-fval').textContent=f$(lastVal*fPct/100);
  gel('eq-table').innerHTML=`<thead><tr><th style="text-align:left">Stakeholder</th><th style="text-align:left">Pre %</th><th style="text-align:left">Post %</th><th style="text-align:left">Value ($)</th></tr></thead><tbody>`+rows.map((r,i)=>`<tr><td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${EQC[i]||'#555'};margin-right:6px"></span>${r.name}</td><td>${r.init.toFixed(1)}%</td><td>${r.final.toFixed(2)}%</td><td style="color:var(--a)">${f$(lastVal*r.final/100)}</td></tr>`).join('')+'</tbody>';
  drawDonut('eq-chart',rows.map(r=>r.final),rows.map((_,i)=>EQC[i]||'#555'));
  gel('eq-legend').innerHTML=rows.map((r,i)=>`<div class="leg-i"><div class="leg-dot" style="background:${EQC[i]||'#555'}"></div>${r.name}: ${r.final.toFixed(1)}%</div>`).join('');

  const insights=[];
  const totalDilution=100-fPct;
  const startPct=founders.reduce((a,f)=>a+f.pct,0);
  insights.push({type:totalDilution>50?'bad':'neutral',text:`Founders started with <strong>${startPct.toFixed(0)}%</strong> combined and now hold <strong>${fPct.toFixed(1)}%</strong> after ${rounds.length} round${rounds.length!==1?'s':''} and the option pool — a total dilution of <strong>${totalDilution.toFixed(0)} points</strong>.`});
  const founderValue=lastVal*fPct/100;
  insights.push({type:'good',text:`Despite the dilution, the founders' stake is now worth roughly <strong>${f$(founderValue)}</strong> on paper, based on the most recent <strong>${f$(lastVal)}</strong> valuation.`});
    insights.push({type:'neutral',text:`Want to see how one specific future event — a secondary sale or option exercise — affects your EPS? Try the <a href="/dilutionimpact" style="color:var(--a);text-decoration:underline">Stock Dilution Impact</a> calculator.`});
  renderInsights('eq-insights',insights);
}

// ── Stock Dilution Impact ────────────────────────────────────────
function cDilutionImpact(){
  const shares0=+gel('di-shares').value||0,price0=+gel('di-price').value||0,netIncome=+gel('di-income').value||0;
  const newShares=+gel('di-newshares').value||0,yourShares=+gel('di-yourshares').value||0;
  const shares1=shares0+newShares;
  const eps0=shares0>0?netIncome/shares0:0,eps1=shares1>0?netIncome/shares1:0;
  const pe0=eps0>0?price0/eps0:0;
  const price1=pe0>0?pe0*eps1:price0;
  const dilPct=eps0>0?(1-eps1/eps0)*100:0;
  const offsetPct=shares0>0?(newShares/shares0*100):0;

  const pctBefore=shares0>0?(yourShares/shares0*100):0,pctAfter=shares1>0?(yourShares/shares1*100):0;
  const valBefore=yourShares*price0,valAfter=yourShares*price1;

  gel('di-eps').textContent=`$${eps0.toFixed(2)} → $${eps1.toFixed(2)}`;
  gel('di-dilpct').textContent=pct(dilPct);
  gel('di-impliedprice').textContent='$'+price1.toFixed(2);
  gel('di-offset').textContent=pct(offsetPct);
  gel('di-pctbefore').textContent=pctBefore.toFixed(5)+'%';
  gel('di-pctafter').textContent=pctAfter.toFixed(5)+'%';
  gel('di-valbefore').textContent=f$(valBefore);
  gel('di-valafter').textContent=f$(valAfter);

  drawBars('di-chart',['Before','After'],[valBefore,valAfter],['#0F4F35','#8C2E22'],150);

  const sourceLabel={secondary:'secondary offering',options:'option/RSU exercise',convert:'convertible note conversion'}[gel('di-source').value]||'share issuance';
  const insights=[];
  insights.push({type:dilPct>15?'bad':dilPct>5?'neutral':'good',text:`This ${sourceLabel} dilutes EPS by <strong>${dilPct.toFixed(1)}%</strong> — from <strong>$${eps0.toFixed(2)}</strong> to <strong>$${eps1.toFixed(2)}</strong> per share, assuming net income stays the same.`});
  const valueLost=valBefore-valAfter;
  if(valueLost>0){
    insights.push({type:'bad',text:`If the market holds the same <strong>${pe0.toFixed(1)}x</strong> P/E multiple, your <strong>${yourShares.toLocaleString()}</strong> shares would be worth about <strong>${f$(valueLost)}</strong> less — from <strong>${f$(valBefore)}</strong> to <strong>${f$(valAfter)}</strong>.`});
  }
  insights.push({type:'neutral',text:`Net income would need to grow by roughly <strong>${pct(offsetPct)}</strong> to fully offset this dilution and bring EPS back to where it started.`});
  if(gel('di-source').value==='secondary')insights.push({type:'neutral',text:`Check the company's stated use of proceeds — capital that grows future earnings by at least <strong>${pct(offsetPct)}</strong> would make this dilution roughly neutral for EPS over time.`});
    insights.push({type:'neutral',text:`Curious how this compares across multiple future funding rounds instead of one event? Model it with the <a href="/equity" style="color:var(--a);text-decoration:underline">Equity Dilution</a> calculator.`});
  renderInsights('di-insights',insights);
}

// ── Revenue Forecast ────────────────────────────────────────────
function calcCAC(){
  const spend=+gel('cac-spend').value||0,newcust=+gel('cac-newcust').value||1;
  const arpu=+gel('cac-arpu').value||0,margin=(+gel('cac-margin').value||0)/100,churn=(+gel('cac-churn').value||0)/100;
  const cac=spend/newcust;
  const gp=arpu*margin;
  const ltv=churn?gp/churn:Infinity;
  const ratio=cac?ltv/cac:0;
  const payback=gp?cac/gp:Infinity;
  const se=(id,v)=>{const e=gel(id);if(e)e.textContent=v;};
  se('cac-cac',f$(cac));
  se('cac-ltv',isFinite(ltv)?f$(ltv):'∞');
  se('cac-ratio',(isFinite(ratio)?ratio.toFixed(1):'∞')+':1');
  se('cac-payback',isFinite(payback)?payback.toFixed(1)+' months':'∞');
  se('cac-gp',f$(gp));
  let verdict='Unsustainable',vcolor='var(--r)';
  if(ratio>=5){verdict='Excellent';vcolor='var(--g)';}
  else if(ratio>=3){verdict='Healthy';vcolor='var(--g)';}
  else if(ratio>=1){verdict='Marginal';vcolor='var(--a)';}
  const vEl=gel('cac-verdict');if(vEl){vEl.textContent=verdict;vEl.style.color=vcolor;}
  drawBars('cac-chart',['CAC','LTV'],[cac,isFinite(ltv)?ltv:cac*10],['#8C2E22','#0F4F35'],150);

  const insights=[];
  if(ratio<1){
    insights.push({type:'bad',text:`Your LTV:CAC ratio is <strong>${ratio.toFixed(1)}:1</strong> — you're losing money on every customer acquired, before even counting fixed operating costs. Either acquisition cost needs to come down or retention/pricing needs to improve.`});
  }else if(ratio<3){
    insights.push({type:'neutral',text:`Your LTV:CAC ratio is <strong>${ratio.toFixed(1)}:1</strong> — technically profitable per customer, but below the commonly cited <strong>3:1</strong> healthy benchmark. Small improvements in churn or CAC would meaningfully change this.`});
  }else{
    insights.push({type:'good',text:`Your LTV:CAC ratio is <strong>${ratio.toFixed(1)}:1</strong>, at or above the commonly cited <strong>3:1</strong> healthy benchmark — your growth engine looks profitable at these assumptions.`});
  }
  if(isFinite(payback)&&payback>18){
    insights.push({type:'neutral',text:`Your CAC payback period is <strong>${payback.toFixed(1)} months</strong> — beyond 18 months, that's a lot of capital tied up per customer before they turn profitable, which can strain cash flow even with a good LTV:CAC ratio.`});
  }
  insights.push({type:'neutral',text:`Want to see how this acquisition spend plays into your overall revenue trajectory? Model it in the <a href="/revenue" style="color:var(--a);text-decoration:underline">Revenue Forecast</a> calculator next.`});
  renderInsights('cac-insights',insights);
}
function calcRevenue(){
  const mrr=+gel('rf-mrr').value||0,months=Math.min(36,+gel('rf-months').value||12),churn=(+gel('rf-churn').value||0)/100;
  const pess=(+gel('rf-pess').value||0)/100,base=(+gel('rf-base').value||0)/100,opt=(+gel('rf-opt').value||0)/100;
  const arpu=+gel('rf-arpu').value||1,onetime=+gel('rf-onetime').value||0;
  const sim=g=>{let r=mrr,cum=0,cust=arpu?mrr/arpu:0,arr=[];for(let m=1;m<=months;m++){r=r*(1+g-churn)+onetime;cust*=(1+g-churn);cum+=r;arr.push({m,r,cum,cust});}return arr;};
  const pD=sim(pess),bD=sim(base),oD=sim(opt);
  const se=(id,v)=>{const e=gel(id);if(e)e.textContent=v;};
  se('rf-p',f$(pD[pD.length-1].r));se('rf-pg',pct((pD[pD.length-1].r/mrr-1)*100)+' total growth');
  se('rf-b',f$(bD[bD.length-1].r));se('rf-bg',pct((bD[bD.length-1].r/mrr-1)*100)+' total growth');
  se('rf-o',f$(oD[oD.length-1].r));se('rf-og',pct((oD[oD.length-1].r/mrr-1)*100)+' total growth');
  se('rf-arr',f$(bD[bD.length-1].r*12));se('rf-cum',f$(bD[bD.length-1].cum));
  se('rf-custs',Math.round(bD[bD.length-1].cust).toLocaleString());
  se('rf-ltv',churn?f$(arpu/churn):'∞');se('rf-range',f$(pD[pD.length-1].r)+' – '+f$(oD[oD.length-1].r));
  drawLine('rf-chart',[{data:pD.map(d=>d.r),color:'#8C2E22',fill:true},{data:bD.map(d=>d.r),color:'#1B3A5C',fill:true,w:2.5},{data:oD.map(d=>d.r),color:'#0F4F35',fill:true}],165);
  gel('rf-table').innerHTML=`<thead><tr><th style="text-align:left">Month</th><th>MRR</th><th>Cumulative</th><th>Customers</th><th>MoM Growth</th></tr></thead><tbody>`+bD.filter((_,i)=>i%Math.max(1,Math.floor(months/10))===0||i===months-1).slice(0,13).map((d,i,a)=>{const prev=i>0?a[i-1].r:mrr,g=prev?(d.r/prev-1)*100:0;return`<tr><td>Mo ${d.m}</td><td style="color:var(--a)">${f$(d.r)}</td><td>${f$(d.cum)}</td><td>${Math.round(d.cust).toLocaleString()}</td><td style="color:${g>=0?'var(--g)':'var(--r)'}">${g>=0?'+':''}${g.toFixed(1)}%</td></tr>`;}).join('')+'</tbody>';

  const insights=[];
  const netGrowth=base-churn;
  if(netGrowth<=0){
    insights.push({type:'bad',text:`Your base-case net growth rate is <strong>${pct(netGrowth*100)}</strong> — churn (<strong>${pct(churn*100)}</strong>) is canceling out or exceeding new growth (<strong>${pct(base*100)}</strong>), meaning revenue will shrink, not grow, at this pace.`});
  }else{
    insights.push({type:'good',text:`Your base-case net growth rate is <strong>${pct(netGrowth*100)}</strong> per month after churn — at this pace, MRR grows roughly <strong>${(bD[bD.length-1].r/mrr).toFixed(1)}x</strong> over ${months} months.`});
  }
  const spreadPct=oD[oD.length-1].r>0?((oD[oD.length-1].r-pD[pD.length-1].r)/oD[oD.length-1].r*100):0;
  if(spreadPct>30)insights.push({type:'neutral',text:`The gap between your pessimistic and optimistic scenarios is wide (<strong>${f$(pD[pD.length-1].r)}</strong> to <strong>${f$(oD[oD.length-1].r)}</strong>) — small changes in growth or churn assumptions swing the outcome significantly here.`});
    insights.push({type:'neutral',text:`Wondering how these growth scenarios affect your cash runway? Plug your numbers into the <a href="/burnrate" style="color:var(--a);text-decoration:underline">Burn Rate</a> calculator next.`});
  renderInsights('rf-insights',insights);
}

// ── Loan ────────────────────────────────────────────────────────
function cLoan(){
  const P=+gel('l-amt').value||0,r=(+gel('l-rate').value||0)/12/100,n=+gel('l-n').value||1,fee=(+gel('l-fee').value||0)/100,type=gel('l-type').value;
  let emi,int;if(type==='flat'){emi=(P+P*r*n)/n;int=P*r*n;}else{emi=r?P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):P/n;int=emi*n-P;}
  const tot=emi*n,pf=P*fee;
  gel('l-emi').textContent=f$(emi);gel('l-int').textContent=f$(int);gel('l-tot').textContent=f$(tot+pf);gel('l-pf').textContent=f$(pf);
  gel('l-pp').textContent=(tot?Math.round(P/tot*100):0)+'%';gel('l-ip').textContent=(tot?Math.round(int/tot*100):0)+'%';gel('l-coc').textContent=pct(int/P*100);
  drawDonut('l-donut',[P,int,pf],['#F0B90B','#8C2E22','#A39B87']);
  if(type!=='flat')renderAmortTable('l-amort-table',P,r,n);
  else gel('l-amort-table').innerHTML='<tbody><tr><td style="padding:10px 8px;font-size:12px;color:var(--m)">Amortization breakdown isn\'t applicable to flat-rate loans, since interest is calculated on the original principal for the full term rather than a declining balance.</td></tr></tbody>';

  const insights=[];
  const cocPct=P>0?int/P*100:0;
  insights.push({type:cocPct>50?'bad':'neutral',text:`You'll pay <strong>${f$(int)}</strong> in total interest — that's <strong>${cocPct.toFixed(0)}%</strong> on top of what you borrowed.`});
  if(type==='flat'){
    const rbEmi=r?P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):P/n;
    const rbInt=rbEmi*n-P;
    const ratio=rbInt>0?int/rbInt:1;
    insights.push({type:'bad',text:`This is a <strong>flat-rate</strong> loan — at the same stated rate, it costs roughly <strong>${ratio.toFixed(1)}x more</strong> in total interest than an equivalent reducing-balance loan would.`});
  }else{
    // what-if: extra payment saving
    const extraTest=Math.max(50,Math.round(emi*0.1/10)*10);
    let bal=P,month=0,newInt=0;const cap=n*2+12;
    while(bal>0.01&&month<cap){month++;const ip=bal*r;let pp=emi-ip+extraTest;if(pp>bal)pp=bal;bal-=pp;newInt+=ip;}
    const intSaved=int-newInt,timeSaved=n-month;
    if(intSaved>0&&timeSaved>0){
      insights.push({type:'neutral',text:`Paying just <strong>${f$(extraTest)}</strong> extra per month would save you <strong>${f$(intSaved)}</strong> in interest and clear the loan <strong>${timeSaved} months</strong> sooner.`});
    }
  }
  if(pf>0)insights.push({type:'neutral',text:`Don't forget the <strong>${f$(pf)}</strong> processing fee — it's a one-time cost on top of your EMI and total interest.`});
    insights.push({type:'neutral',text:`Already have this loan and want to see the exact effect of extra payments? The <a href="/prepay" style="color:var(--a);text-decoration:underline">Loan Prepayment</a> calculator breaks it down year by year.`});
  renderInsights('l-insights',insights);
}

// ── Loan Prepayment ─────────────────────────────────────────────
function rfPmt(principal,r,n){
  return r?principal*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):principal/n;
}
function calcRefinance(){
  const balance=+gel('rf-balance').value||0;
  const currentRate=(+gel('rf-currentrate').value||0)/12/100;
  const currentTermMo=(+gel('rf-currentterm').value||1)*12;
  const newRate=(+gel('rf-newrate').value||0)/12/100;
  const newTermMo=(+gel('rf-newterm').value||1)*12;
  const cashout=+gel('rf-cashout').value||0;
  const closing=+gel('rf-closing').value||0;

  const currentPay=rfPmt(balance,currentRate,currentTermMo);
  const newBalance=balance+cashout;
  const newPay=rfPmt(newBalance,newRate,newTermMo);
  const monthlySavings=currentPay-newPay;

  const currentTotalInterest=currentPay*currentTermMo-balance;
  const newTotalInterest=newPay*newTermMo-newBalance;

  const se=(id,v)=>{const e=gel(id);if(e)e.textContent=v;};
  se('rf-currentpay',f$(currentPay));
  se('rf-newpay',f$(newPay));
  const savingsEl=gel('rf-savings');
  if(savingsEl){savingsEl.textContent=(monthlySavings<0?'-':'')+f$(Math.abs(monthlySavings));savingsEl.style.color=monthlySavings>=0?'var(--g)':'var(--r)';}
  se('rf-currentinterest',f$(currentTotalInterest));
  se('rf-newinterest',f$(newTotalInterest));

  const breakevenEl=gel('rf-breakeven');
  let breakevenMonths=null;
  if(monthlySavings>0){
    breakevenMonths=closing/monthlySavings;
    if(breakevenEl){breakevenEl.textContent=breakevenMonths.toFixed(0)+' months';breakevenEl.style.color='var(--g)';}
  }else if(breakevenEl){
    breakevenEl.textContent='Never';breakevenEl.style.color='var(--r)';
  }

  const months=Math.max(currentTermMo,newTermMo,1);
  const chartLen=Math.min(months,360);
  const step=Math.max(1,Math.floor(chartLen/40));
  const currentSeries=[],newSeries=[];
  for(let m=0;m<=chartLen;m+=step){
    currentSeries.push(Math.min(m,currentTermMo)*currentPay);
    newSeries.push(closing+Math.min(m,newTermMo)*newPay);
  }
  drawLine('rf-chart',[{data:currentSeries,color:'#A39B87',fill:false,w:2},{data:newSeries,color:'#0F4F35',fill:false,w:2.5}],175);

  const insights=[];
  if(monthlySavings<=0){
    insights.push({type:'bad',text:`Your new payment is <strong>${f$(Math.abs(monthlySavings))}</strong> ${monthlySavings<0?'higher':'the same'} than your current payment${cashout>0?' — likely because the cash-out amount increased your loan balance enough to offset the lower rate':''}. This refinance doesn't reduce your monthly payment.`});
  }else if(breakevenMonths!==null){
    const rating=breakevenMonths<=24?'good':breakevenMonths<=60?'neutral':'bad';
    insights.push({type:rating,text:`You'll break even on the <strong>${f$(closing)}</strong> in closing costs after <strong>${breakevenMonths.toFixed(0)} months</strong> (${(breakevenMonths/12).toFixed(1)} years). Refinancing is only worth it if you keep this loan longer than that.`});
  }
  if(newTermMo>currentTermMo&&newTotalInterest>currentTotalInterest){
    insights.push({type:'neutral',text:`The new loan's <strong>${(newTermMo/12).toFixed(0)}-year</strong> term is longer than your <strong>${(currentTermMo/12).toFixed(0)}</strong> remaining years on the current loan — even at a lower rate, total interest paid is <strong>${f$(newTotalInterest-currentTotalInterest)}</strong> higher because you're paying for longer.`});
  }else if(newTotalInterest<currentTotalInterest){
    insights.push({type:'good',text:`Total interest on the new loan is <strong>${f$(currentTotalInterest-newTotalInterest)}</strong> lower than staying on your current loan, even after accounting for the different term length.`});
  }
  renderInsights('rf-insights',insights);
}
function cPrepay(){
  const P=+gel('pp-amt').value||0,r=(+gel('pp-rate').value||0)/12/100,n=+gel('pp-n').value||1;
  const extra=+gel('pp-extra').value||0,lump=+gel('pp-lump').value||0,lumpMo=+gel('pp-lumpmo').value||0;
  const emi=r?P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):P/n;
  const oldInt=emi*n-P;

  // Simulate month-by-month amortization WITH extra payments + lump sum
  let bal=P,month=0,newInt=0;
  const yearlyBal=[bal],yearlyBalOrig=[P];
  let origBal=P;
  const maxMonths=n*2+12; // safety cap
  while(bal>0.01&&month<maxMonths){
    month++;
    const interestPortion=bal*r;
    let principalPortion=emi-interestPortion;
    let pay=principalPortion+extra;
    if(month===lumpMo)pay+=lump;
    if(pay>bal)pay=bal;
    bal-=pay;
    newInt+=interestPortion;
    if(bal<0)bal=0;
    if(month%12===0||bal<=0.01)yearlyBal.push(Math.max(0,bal));
  }
  const newTerm=month;
  // Original (no prepayment) yearly balances for chart comparison, capped at same chart length
  origBal=P;
  for(let m=1;m<=n;m++){
    const ip=origBal*r,pp=emi-ip;
    origBal-=pp;if(origBal<0)origBal=0;
    if(m%12===0||m===n)yearlyBalOrig.push(Math.max(0,origBal));
  }

  const timeSaved=n-newTerm,intSaved=oldInt-newInt,savedPct=oldInt?intSaved/oldInt*100:0;

  gel('pp-newterm').textContent=newTerm+' mo';
  gel('pp-timesaved').textContent=Math.max(0,timeSaved)+' mo';
  gel('pp-intsaved').textContent=f$(Math.max(0,intSaved));
  gel('pp-newint').textContent=f$(newInt);
  gel('pp-emi').textContent=f$(emi);
  gel('pp-oldterm').textContent=n+' mo';
  gel('pp-oldint').textContent=f$(oldInt);
  gel('pp-savedpct').textContent=pct(Math.max(0,savedPct));

  drawLine('pp-chart',[{data:yearlyBalOrig,color:'#8C2E22',fill:false,w:2,dash:[5,4]},{data:yearlyBal,color:'#0F4F35',fill:true,w:2.5}],175);

  // Year-by-year comparison table
  const years=Math.ceil(Math.max(n,newTerm)/12);
  let rows='<thead><tr><th style="text-align:left;padding:6px 8px;font-size:11px;color:var(--m);border-bottom:1px solid var(--bd)">Year</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--r)">Balance (Original)</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--g)">Balance (Prepaying)</th></tr></thead><tbody>';
  for(let y=0;y<=years;y++){
    const ob=y<yearlyBalOrig.length?yearlyBalOrig[y]:0;
    const nb=y<yearlyBal.length?yearlyBal[y]:0;
    rows+=`<tr><td style="text-align:left;font-size:12px;color:var(--m);border-bottom:1px solid var(--bd);padding:7px 8px">Year ${y}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px">${f$(ob)}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;color:var(--g);font-weight:600">${f$(nb)}</td></tr>`;
  }
  rows+='</tbody>';
  gel('pp-table').innerHTML=rows;

  const insights=[];
  if(intSaved>0)insights.push({type:'good',text:`These extra payments save you <strong>${f$(Math.max(0,intSaved))}</strong> in interest and clear the loan <strong>${Math.max(0,timeSaved)} months</strong> sooner.`});
  insights.push({type:'neutral',text:`Comparing a few different loan offers instead of prepaying this one? The <a href="/loancomp" style="color:var(--a);text-decoration:underline">Loan Comparison</a> calculator ranks multiple offers by total cost side by side.`});
  renderInsights('pp-insights',insights);
}

// ── Provident Fund ─────────────────────────────────────────────
function cProvident(){
  const open=+gel('pf-open').value||0,mo=+gel('pf-mo').value||0,rate=(+gel('pf-rate').value||0)/100,y=+gel('pf-years').value||1,su=(+gel('pf-step').value||0)/100;
  const mr=rate/12;
  let bal=open,contrib=open,mc=mo;
  const yearlyBal=[bal],yearlyContrib=[contrib];
  for(let yr=0;yr<y;yr++){
    for(let m=0;m<12;m++){bal+=mc;bal+=bal*mr;contrib+=mc;}
    mc*=(1+su);
    yearlyBal.push(bal);yearlyContrib.push(contrib);
  }
  const interest=bal-contrib,cagr=(Math.pow(bal/Math.max(contrib,1),1/y)-1)*100;
  gel('pf-mat').textContent=f$(bal);gel('pf-int').textContent=f$(interest);gel('pf-contrib').textContent=f$(contrib);
  gel('pf-ratio').textContent=pct(contrib?interest/contrib*100:0);gel('pf-cagr').textContent=pct(cagr);

  drawLine('pf-chart',[{data:yearlyContrib,color:'#0F4F35',fill:true},{data:yearlyBal,color:'#F0B90B',fill:false,w:2.5}],175);

  let rows='<thead><tr><th style="text-align:left;padding:6px 8px;font-size:11px;color:var(--m);border-bottom:1px solid var(--bd)">Year</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--g)">Contributed</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--a)">Balance</th></tr></thead><tbody>';
  for(let i=0;i<yearlyBal.length;i++){
    rows+=`<tr><td style="text-align:left;font-size:12px;color:var(--m);border-bottom:1px solid var(--bd);padding:7px 8px">Year ${i}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px">${f$(yearlyContrib[i])}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;color:var(--a);font-weight:600">${f$(yearlyBal[i])}</td></tr>`;
  }
  rows+='</tbody>';
  gel('pf-table').innerHTML=rows;

  const insights=[];
  const intRatio=contrib>0?interest/contrib*100:0;
  insights.push({type:'good',text:`Of your <strong>${f$(bal)}</strong> maturity value, <strong>${f$(interest)}</strong> (<strong>${intRatio.toFixed(0)}%</strong> of what you put in) is interest, not your own contributions.`});
  if(su===0 && y>=10){
    let bal2=open,mc2=mo;
    for(let yr=0;yr<y;yr++){for(let m=0;m<12;m++){bal2+=mc2;bal2+=bal2*mr;}mc2*=1.05;}
    const stepGain=bal2-bal;
    if(stepGain>0)insights.push({type:'neutral',text:`Stepping up your contribution by just <strong>5% a year</strong> would grow your maturity value to roughly <strong>${f$(bal2)}</strong> — an extra <strong>${f$(stepGain)}</strong>.`});
  }
    insights.push({type:'neutral',text:`Want to see this alongside your other retirement savings? The <a href="/retirement" style="color:var(--a);text-decoration:underline">Retirement</a> calculator combines all your sources into one target.`});
  renderInsights('pf-insights',insights);
}

// ── Asset Allocation ──────────────────────────────────────────
const AA_RETURNS={stocks:10,bonds:4.5,cash:3,gold:7,crypto:25};
const AA_VOL={stocks:18,bonds:6,cash:0.5,gold:15,crypto:65};
function calcBudget(){
  const income=+gel('bg-income').value||0;
  const needsPct=(+gel('bg-needs-pct').value||0)/100,wantsPct=(+gel('bg-wants-pct').value||0)/100,savingsPct=(+gel('bg-savings-pct').value||0)/100;
  const needsActual=+gel('bg-needs-actual').value||0,wantsActual=+gel('bg-wants-actual').value||0,savingsActual=+gel('bg-savings-actual').value||0;

  const needsRec=income*needsPct,wantsRec=income*wantsPct,savingsRec=income*savingsPct;
  const totalSpend=needsActual+wantsActual+savingsActual;
  const leftover=income-totalSpend;

  const setCompare=(id,rec,actual,higherIsBetter)=>{
    const e=gel(id);if(!e)return;
    e.textContent=f$(rec)+' / '+f$(actual);
    const over=actual>rec*1.05,under=actual<rec*0.95;
    let color='var(--t)';
    if(higherIsBetter){ if(over)color='var(--g)'; else if(under)color='var(--r)'; }
    else{ if(over)color='var(--r)'; else if(under)color='var(--g)'; }
    e.style.color=color;
  };
  setCompare('bg-needs-compare',needsRec,needsActual,false);
  setCompare('bg-wants-compare',wantsRec,wantsActual,false);
  setCompare('bg-savings-compare',savingsRec,savingsActual,true);

  const se=(id,v)=>{const e=gel(id);if(e)e.textContent=v;};
  se('bg-totalspend',f$(totalSpend));
  const leftoverEl=gel('bg-leftover');
  if(leftoverEl){leftoverEl.textContent=(leftover<0?'-':'')+f$(Math.abs(leftover));leftoverEl.style.color=leftover>=0?'var(--g)':'var(--r)';}

  const unallocated=Math.max(leftover,0);
  drawDonut('bg-donut',[needsActual,wantsActual,savingsActual,unallocated],['#1B3A5C','#F0B90B','#0F4F35','#A39B87']);

  const insights=[];
  if(leftover<0){
    insights.push({type:'bad',text:`Your spending exceeds your take-home pay by <strong>${f$(Math.abs(leftover))}</strong>/month — this budget isn't currently sustainable without drawing down savings or debt.`});
  }
  if(income>0){
    if(needsActual>needsRec*1.1){
      insights.push({type:'neutral',text:`Needs spending is <strong>${f$(needsActual-needsRec)}</strong> over the ${(needsPct*100).toFixed(0)}% target — if this gap is large and persistent, it's often worth examining the biggest fixed cost first, usually housing.`});
    }
    if(wantsActual>wantsRec*1.1){
      insights.push({type:'neutral',text:`Wants spending is <strong>${f$(wantsActual-wantsRec)}</strong> over the ${(wantsPct*100).toFixed(0)}% target — this is usually the easiest category to adjust short-term.`});
    }
    if(savingsActual<savingsRec*0.9){
      insights.push({type:'bad',text:`Savings &amp; debt payoff is <strong>${f$(savingsRec-savingsActual)}</strong> under the ${(savingsPct*100).toFixed(0)}% target — this is the category with the most long-term impact if it's consistently underfunded.`});
    }else if(savingsActual>=savingsRec){
      insights.push({type:'good',text:`You're meeting or exceeding your <strong>${(savingsPct*100).toFixed(0)}%</strong> savings &amp; debt payoff target — that's the category that compounds the most over time.`});
    }
  }
  renderInsights('bg-insights',insights);
}
function calcNetWorth(){
  const cash=+gel('nw-cash').value||0,invest=+gel('nw-invest').value||0,retire=+gel('nw-retire').value||0;
  const home=+gel('nw-home').value||0,vehicle=+gel('nw-vehicle').value||0,other=+gel('nw-other').value||0;
  const mortgage=+gel('nw-mortgage').value||0,auto=+gel('nw-auto').value||0,student=+gel('nw-student').value||0;
  const cc=+gel('nw-cc').value||0,otherdebt=+gel('nw-otherdebt').value||0;

  const totalAssets=cash+invest+retire+home+vehicle+other;
  const totalLiab=mortgage+auto+student+cc+otherdebt;
  const netWorth=totalAssets-totalLiab;
  const liquidNW=cash+invest-totalLiab;
  const illiquidNW=netWorth-liquidNW;
  const debtRatio=totalAssets?(totalLiab/totalAssets)*100:0;

  const se=(id,v)=>{const e=gel(id);if(e)e.textContent=v;};
  se('nw-totalassets',f$(totalAssets));
  se('nw-totalliab',f$(totalLiab));
  const nwEl=gel('nw-networth');
  if(nwEl){nwEl.textContent=(netWorth<0?'-':'')+f$(Math.abs(netWorth));nwEl.style.color=netWorth>=0?'var(--g)':'var(--r)';}
  se('nw-ratio',pct(debtRatio));
  se('nw-liquid',(liquidNW<0?'-':'')+f$(Math.abs(liquidNW)));
  se('nw-illiquid',(illiquidNW<0?'-':'')+f$(Math.abs(illiquidNW)));

  drawDonut('nw-donut',[cash,invest,retire,home,vehicle,other],['#0F4F35','#1B3A5C','#6B4A7A','#F0B90B','#8C2E22','#A39B87']);

  const insights=[];
  if(netWorth<0){
    insights.push({type:'neutral',text:`Your net worth is currently <strong>negative</strong> — common early on, especially with a mortgage or student loans in the mix. What matters most from here is the trend, not this single snapshot.`});
  }else{
    insights.push({type:'good',text:`Your net worth is <strong>${f$(netWorth)}</strong>. Assets exceed liabilities by that amount.`});
  }
  if(totalAssets>0 && illiquidNW/Math.max(netWorth,1)>0.7 && netWorth>0){
    insights.push({type:'neutral',text:`Most of your net worth is <strong>illiquid</strong> (home equity, retirement, vehicles) — real wealth, but not quickly accessible. Your liquid net worth is ${liquidNW<0?'-':''}${f$(Math.abs(liquidNW))}.`});
  }
  if(debtRatio>50){
    insights.push({type:'neutral',text:`Your debt-to-asset ratio is <strong>${pct(debtRatio)}</strong> — more than half your assets are debt-financed. Common with a mortgage, but worth watching as it should trend down as loans are paid off.`});
  }else if(totalAssets>0){
    insights.push({type:'good',text:`Your debt-to-asset ratio is <strong>${pct(debtRatio)}</strong> — less than half your assets are debt-financed.`});
  }
  renderInsights('nw-insights',insights);
}
function cAllocRecommend(){
  const age=+gel('aa-age').value||30,risk=gel('aa-risk').value;
  let equity=Math.max(10,Math.min(90,110-age));
  const adj={conservative:-15,moderate:0,aggressive:15}[risk]||0;
  equity=Math.max(10,Math.min(90,equity+adj));
  const rest=100-equity;
  gel('aa-stocks').value=equity.toFixed(2).replace(/\.00$/,'');
  gel('aa-bonds').value=(rest*0.6).toFixed(2).replace(/\.00$/,'');
  gel('aa-cash').value=(rest*0.25).toFixed(2).replace(/\.00$/,'');
  gel('aa-gold').value=(rest*0.15).toFixed(2).replace(/\.00$/,'');
  gel('aa-crypto').value=0;
  gel('aa-recpct').textContent=pct(equity);
  cAlloc();
}
function cAlloc(){
  const age=+gel('aa-age').value||30;
  let s=Math.max(0,+gel('aa-stocks').value||0),b=Math.max(0,+gel('aa-bonds').value||0),c=Math.max(0,+gel('aa-cash').value||0),g=Math.max(0,+gel('aa-gold').value||0),cr=Math.max(0,+gel('aa-crypto').value||0);
  const sum=s+b+c+g+cr;
  const norm=sum>0?100/sum:0;
  const alloc={stocks:s*norm,bonds:b*norm,cash:c*norm,gold:g*norm,crypto:cr*norm};
  gel('aa-totalpct').textContent=pct(sum)+(Math.abs(sum-100)>0.5?' ⚠':'');
  gel('aa-totalpct').style.color=Math.abs(sum-100)>0.5?'var(--r)':'var(--t)';

  let blended=0,vol=0;
  for(const k in alloc){blended+=alloc[k]/100*AA_RETURNS[k];vol+=alloc[k]/100*AA_VOL[k];}
  gel('aa-return').textContent=pct(blended);
  gel('aa-vol').textContent=pct(vol);

  const cat=vol<8?'Conservative':vol<14?'Moderate':vol<22?'Growth':'Aggressive';
  gel('aa-cat').textContent=cat;

  const val=+gel('aa-value').value||0,years=+gel('aa-years').value||1;
  const future=val*Math.pow(1+blended/100,years);
  gel('aa-future').textContent=f$(future);

  drawDonut('aa-donut',[alloc.stocks,alloc.bonds,alloc.cash,alloc.gold,alloc.crypto],['#F0B90B','#1B3A5C','#0F4F35','#8B6B9E','#8C2E22']);

  const years_arr=[],vals=[];
  for(let y=0;y<=years;y++){years_arr.push('Y'+y);vals.push(val*Math.pow(1+blended/100,y));}
  drawLine('aa-chart',[{data:vals,color:'#F0B90B',fill:true}],140);

  const recEquity=Math.max(10,Math.min(90,110-age));
  if(!gel('aa-recpct').textContent || gel('aa-recpct').textContent==='0%')gel('aa-recpct').textContent=pct(recEquity);

  const insights=[];
  const equityGap=alloc.stocks-recEquity;
  if(Math.abs(equityGap)>10){
    insights.push({type:Math.abs(equityGap)>25?'bad':'neutral',text:`Your stock allocation (<strong>${alloc.stocks.toFixed(0)}%</strong>) is <strong>${Math.abs(equityGap).toFixed(0)} points ${equityGap>0?'higher':'lower'}</strong> than the age-110 baseline of ${recEquity.toFixed(0)}% — ${equityGap>0?'a more aggressive than typical stance for your age':'a more conservative than typical stance for your age'}.`});
  }else{
    insights.push({type:'good',text:`Your stock allocation (<strong>${alloc.stocks.toFixed(0)}%</strong>) is close to the age-110 baseline for someone your age.`});
  }
  if(alloc.crypto>10)insights.push({type:'bad',text:`A <strong>${alloc.crypto.toFixed(0)}%</strong> crypto allocation is well above the 0-5% "satellite" range most advisors recommend, given its high volatility.`});
  insights.push({type:'neutral',text:`At a <strong>${pct(blended)}</strong> blended return, <strong>${f$(val)}</strong> would grow to roughly <strong>${f$(future)}</strong> after ${years} years.`});
    insights.push({type:'neutral',text:`Want to check if this mix actually gets you to your real retirement number? Run your numbers through the <a href="/retirement" style="color:var(--a);text-decoration:underline">Retirement</a> or <a href="/fire" style="color:var(--a);text-decoration:underline">FIRE</a> calculator next.`});
  renderInsights('aa-insights',insights);
}

// ── SIP ─────────────────────────────────────────────────────────
function cSip(){
  const m=+gel('i-m').value||0,rate=(+gel('i-r').value||0)/100,y=+gel('i-y').value||1,lump=+gel('i-l').value||0,su=(+gel('i-step').value||0)/100;
  let corpus=lump*Math.pow(1+rate,y),inv=lump,mo=m;
  for(let yr=0;yr<y;yr++){const mr=rate/12;corpus+=mr?mo*(Math.pow(1+mr,12)-1)/mr*(1+mr)*Math.pow(1+rate,y-yr-1):mo*12;inv+=mo*12;mo*=(1+su);}
  const gain=corpus-inv,cagr=(Math.pow(corpus/Math.max(inv,1),1/y)-1)*100;
  gel('i-corpus').textContent=f$(corpus);gel('i-gain').textContent=f$(gain);gel('i-inv').textContent=f$(inv);
  gel('i-abs').textContent=pct(gain/inv*100);gel('i-cagr').textContent=pct(cagr);
  const pts=Array.from({length:Math.min(y,30)+1},(_,i)=>{const mr=rate/12,n=i*12;return lump*Math.pow(1+rate,i)+(mr?m*(Math.pow(1+mr,n)-1)/mr*(1+mr):m*n);});
  const invPts=Array.from({length:Math.min(y,30)+1},(_,i)=>lump+m*12*i);
  drawLine('i-chart',[{data:invPts,color:'#0F4F35',fill:true},{data:pts,color:'#F0B90B',fill:false,w:2.5}],175);

  const insights=[];
  const gainRatio=inv>0?gain/inv*100:0;
  insights.push({type:'good',text:`Of your final <strong>${f$(corpus)}</strong>, <strong>${f$(gain)}</strong> (${gainRatio.toFixed(0)}% of what you put in) is pure investment growth, not money you contributed.`});
  if(m>0){
    const extraM=Math.max(50,Math.round(m*0.1/10)*10);
    let corpus2=lump*Math.pow(1+rate,y),mo2=m+extraM;
    for(let yr=0;yr<y;yr++){const mr=rate/12;corpus2+=mr?mo2*(Math.pow(1+mr,12)-1)/mr*(1+mr)*Math.pow(1+rate,y-yr-1):mo2*12;mo2*=(1+su);}
    const extraGain=corpus2-corpus;
    if(extraGain>0)insights.push({type:'neutral',text:`Adding just <strong>${f$(extraM)}/mo</strong> more would grow your final corpus by an extra <strong>${f$(extraGain)}</strong> over ${y} years.`});
  }
  if(su===0 && y>=5){
    let corpus3=lump*Math.pow(1+rate,y),mo3=m;
    for(let yr=0;yr<y;yr++){const mr=rate/12;corpus3+=mr?mo3*(Math.pow(1+mr,12)-1)/mr*(1+mr)*Math.pow(1+rate,y-yr-1):mo3*12;mo3*=1.05;}
    const stepGain=corpus3-corpus;
    if(stepGain>0)insights.push({type:'neutral',text:`Stepping up your contribution by just <strong>5% a year</strong> (tracking typical salary growth) would add roughly <strong>${f$(stepGain)}</strong> to your final corpus.`});
  }
    insights.push({type:'neutral',text:`Is this corpus actually enough for your goals? Check it against a real retirement target with <a href="/retirement" style="color:var(--a);text-decoration:underline">Retirement</a> or <a href="/fire" style="color:var(--a);text-decoration:underline">FIRE</a>.`});
  renderInsights('i-insights',insights);
}

// ── SWP ──────────────────────────────────────────────────────────
function cSWP(){
  const corpus0=+gel('sw-corpus').value||0,mw0=+gel('sw-withdrawal').value||0,ret=(+gel('sw-return').value||0)/100,infl=(+gel('sw-inflation').value||0)/100,maxYears=+gel('sw-years').value||1;
  const mr=ret/12;
  let balance=corpus0,withdrawal=mw0,totalWithdrawn=0,month=0,depleted=false,depletedMonth=null;
  const yearlyBal=[corpus0],yearlyWithdrawn=[];
  for(let y=1;y<=maxYears;y++){
    let yearWithdrawn=0;
    for(let m=0;m<12;m++){
      month++;
      if(balance<=0){if(!depleted){depleted=true;depletedMonth=month;}continue;}
      const actualW=Math.min(withdrawal,balance);
      balance-=actualW;totalWithdrawn+=actualW;yearWithdrawn+=actualW;
      balance*=(1+mr);
    }
    yearlyBal.push(Math.max(0,balance));yearlyWithdrawn.push(yearWithdrawn);
    withdrawal*=(1+infl);
  }

  const iwr=corpus0>0?(mw0*12/corpus0*100):0;
  gel('sw-iwr').textContent=pct(iwr);
  gel('sw-final').textContent=f$(balance);gel('sw-final').style.color=balance>0?'var(--g)':'var(--r)';
  gel('sw-total').textContent=f$(totalWithdrawn);
  if(depleted){
    gel('sw-lasts').textContent=(depletedMonth/12).toFixed(1)+' yrs';gel('sw-lasts').style.color='var(--r)';
    gel('sw-status').innerHTML='✕ Depleted';gel('sw-status').style.color='var(--r)';
  }else{
    gel('sw-lasts').textContent=maxYears+'+ yrs';gel('sw-lasts').style.color='var(--g)';
    gel('sw-status').innerHTML='✓ Sustainable';gel('sw-status').style.color='var(--g)';
  }

  drawLine('sw-chart',[{data:yearlyBal.slice(0,Math.min(yearlyBal.length,40)),color:depleted?'#8C2E22':'#0F4F35',fill:true}],170);

  let rows='<thead><tr><th style="text-align:left;padding:6px 8px;font-size:11px;color:var(--m);border-bottom:1px solid var(--bd)">Year</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--r)">Withdrawn</th><th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:var(--g)">Balance</th></tr></thead><tbody>';
  const rowsToShow=depleted?Math.ceil(depletedMonth/12):yearlyWithdrawn.length;
  for(let i=0;i<rowsToShow;i++){
    rows+=`<tr><td style="text-align:left;font-size:12px;color:var(--m);border-bottom:1px solid var(--bd);padding:7px 8px">Year ${i+1}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px">${f$(yearlyWithdrawn[i])}</td><td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;color:var(--g);font-weight:600">${f$(yearlyBal[i+1])}</td></tr>`;
  }
  if(depleted)rows+=`<tr><td colspan="3" style="text-align:center;font-size:11px;color:var(--r);padding:8px;font-style:italic">Corpus depleted during year ${rowsToShow} — no balance remains for the rest of the ${maxYears}-year horizon</td></tr>`;
  rows+='</tbody>';
  gel('sw-table').innerHTML=rows;

  const insights=[];
  if(iwr<=4){
    insights.push({type:'good',text:`Your initial withdrawal rate of <strong>${pct(iwr)}</strong> is in the historically sustainable 3-4% range for long horizons.`});
  }else if(iwr<=6){
    insights.push({type:'neutral',text:`Your initial withdrawal rate of <strong>${pct(iwr)}</strong> is moderate — sustainability becomes more sensitive to the actual sequence of market returns at this level.`});
  }else{
    insights.push({type:'bad',text:`Your initial withdrawal rate of <strong>${pct(iwr)}</strong> is aggressive — there's meaningful risk of depleting the corpus well before a multi-decade horizon ends.`});
  }
  if(depleted){
    insights.push({type:'bad',text:`At this withdrawal rate, the corpus runs out around <strong>year ${(depletedMonth/12).toFixed(1)}</strong> — reducing the monthly withdrawal or the annual increase would extend how long it lasts.`});
  }else{
    const growthVsStart=balance-corpus0;
    if(growthVsStart>0){
      insights.push({type:'good',text:`The corpus actually grows over ${maxYears} years, ending <strong>${f$(growthVsStart)}</strong> higher than where it started, even after withdrawing <strong>${f$(totalWithdrawn)}</strong> in total.`});
    }else{
      insights.push({type:'neutral',text:`The corpus shrinks but survives the full ${maxYears} years, ending at <strong>${f$(balance)}</strong> after withdrawing <strong>${f$(totalWithdrawn)}</strong> in total.`});
    }
  }
  if(infl===0)insights.push({type:'neutral',text:`Your withdrawal amount never increases — its real purchasing power will fall over time as prices rise. Consider setting an annual increase matching your expected inflation rate.`});
    insights.push({type:'neutral',text:`Still building toward this corpus rather than withdrawing from it? The <a href="/invest" style="color:var(--a);text-decoration:underline">SIP</a> or <a href="/retirement" style="color:var(--a);text-decoration:underline">Retirement</a> calculator projects the accumulation phase.`});
  renderInsights('sw-insights',insights);
}

// ── Tax ─────────────────────────────────────────────────────────
function cTax(){
  const gross=+gel('t-inc').value||0,oth=+gel('t-oth').value||0,pre=+gel('t-pre').value||0,status=gel('t-status').value;
  const taxable=Math.max(0,gross+oth-pre);
  const std={single:16100,married:32200,hoh:24150}[status]||16100;
  const ti=Math.max(0,taxable-std);
  const bks={single:[[0,12400,10],[12400,50400,12],[50400,105700,22],[105700,201775,24],[201775,256225,32],[256225,640600,35],[640600,Infinity,37]],married:[[0,24800,10],[24800,100800,12],[100800,211400,22],[211400,403550,24],[403550,512450,32],[512450,768700,35],[768700,Infinity,37]],hoh:[[0,17700,10],[17700,67450,12],[67450,105700,22],[105700,201775,24],[201775,256200,32],[256200,640600,35],[640600,Infinity,37]]};
  const slabs=bks[status]||bks.single;let tax=0,rows=[];
  slabs.forEach(s=>{if(ti<=s[0]){rows.push({f:s[0],t:s[1],r:s[2],tx:0,act:false});return;}const sl=Math.min(ti,s[1]===Infinity?ti:s[1])-s[0],tx=sl*s[2]/100;tax+=tx;rows.push({f:s[0],t:s[1],r:s[2],tx,act:true});});
  gel('t-tax').textContent=f$(tax);gel('t-eff').textContent=ti?pct(tax/ti*100):'0%';gel('t-home').textContent=f$((gross-tax)/12);gel('t-taxinc').textContent=f$(ti);
  gel('t-slabs').innerHTML=`<thead><tr><th>Bracket</th><th>Rate</th><th>Tax Owed</th></tr></thead><tbody>`+rows.map(r=>`<tr class="${r.act?'slab-on':''}"><td>${r.f===0?'Up to $'+Math.round(r.t).toLocaleString():r.t===Infinity?'Over $'+Math.round(r.f).toLocaleString():'$'+Math.round(r.f).toLocaleString()+' – $'+Math.round(r.t).toLocaleString()}</td><td>${r.r}%</td><td>${r.tx?'$'+Math.round(r.tx).toLocaleString():'-'}</td></tr>`).join('')+'</tbody>';

  const insights=[];
  const marginalBracket=rows.filter(r=>r.act).pop();
  const marginalRate=marginalBracket?marginalBracket.r:0;
  const effRate=ti?tax/ti*100:0;
  if(marginalRate>effRate+3){
    insights.push({type:'good',text:`Your <strong>marginal rate</strong> (the rate on your last dollar) is <strong>${marginalRate}%</strong>, but your <strong>effective rate</strong> (your real average tax burden) is only <strong>${effRate.toFixed(1)}%</strong> — only the income inside each bracket is taxed at that bracket's rate.`});
  }
  if(marginalBracket && marginalBracket.t!==Infinity){
    const roomLeft=marginalBracket.t-ti;
    if(roomLeft>0)insights.push({type:'neutral',text:`You have about <strong>${f$(roomLeft)}</strong> of room left in your current <strong>${marginalRate}%</strong> bracket before crossing into the next one.`});
  }
  insights.push({type:'neutral',text:`This estimates <strong>federal tax only</strong> — state income tax (0% to 13%+ depending on where you live) is calculated separately and isn't included here.`});
    insights.push({type:'neutral',text:`Want to see how this tax bill fits into your overall monthly budget? Check your full picture with the <a href="/cashflow" style="color:var(--a);text-decoration:underline">Cash Flow</a> calculator.`});
  renderInsights('t-insights',insights);
}

// ── Mortgage ────────────────────────────────────────────────────
function cMortgage(){
  const price=+gel('m-price').value||0,dp=(+gel('m-down').value||0)/100,r=(+gel('m-rate').value||0)/12/100,n=(+gel('m-years').value||1)*12,ptax=+gel('m-tax').value||0,ins=+gel('m-ins').value||0;
  const loan=price*(1-dp),emi=r?loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):loan/n,interest=emi*n-loan,ti=(ptax+ins)/12;
  gel('m-pay').textContent=f$(emi+ti);gel('m-loan').textContent=f$(loan);gel('m-int').textContent=f$(interest);
  gel('m-total').textContent=f$(emi*n+ptax*(n/12)+ins*(n/12));gel('m-dp').textContent=f$(price*dp);
  gel('m-ti').textContent=f$(ti);gel('m-aff').textContent=pct(((emi+ti)*12)/price*100);
  drawDonut('m-donut',[loan,interest,(ptax+ins)*(n/12)/12*n],['#F0B90B','#8C2E22','#1B3A5C']);
  renderAmortTable('m-amort-table',loan,r,n);

  const insights=[];
  const dpPct=dp*100;
  if(dpPct<20){
    const neededDp=price*0.20,shortBy=neededDp-price*dp;
    insights.push({type:'bad',text:`Your <strong>${dpPct.toFixed(0)}%</strong> down payment is below 20%, so you'll likely pay <strong>PMI</strong>. Putting down <strong>${f$(shortBy)}</strong> more would reach 20% and remove it.`});
  }else{
    insights.push({type:'good',text:`Your <strong>${dpPct.toFixed(0)}%</strong> down payment clears the 20% threshold — no PMI required.`});
  }
  const intRatio=loan>0?interest/loan*100:0;
  insights.push({type:intRatio>80?'bad':'neutral',text:`Over the life of this loan you'll pay <strong>${f$(interest)}</strong> in interest — that's <strong>${intRatio.toFixed(0)}%</strong> of the amount you're borrowing.`});
  const extraTest=Math.round(emi*0.1/10)*10||50;
  let bal=loan,month=0,newInt=0;const cap=n*2+12;
  while(bal>0.01&&month<cap){month++;const ip=bal*r;let pp=emi-ip+extraTest;if(pp>bal)pp=bal;bal-=pp;newInt+=ip;}
  const intSaved=interest-newInt,timeSaved=n-month;
  if(intSaved>1000&&timeSaved>0){
    insights.push({type:'neutral',text:`Paying an extra <strong>${f$(extraTest)}/mo</strong> would save roughly <strong>${f$(intSaved)}</strong> in interest and pay off the mortgage <strong>${(timeSaved/12).toFixed(1)} years</strong> sooner.`});
  }
    insights.push({type:'neutral',text:`Not sure if buying is even the better move for you right now? The <a href="/rentvsbuy" style="color:var(--a);text-decoration:underline">Rent vs Buy</a> calculator compares your net worth under both scenarios.`});
  renderInsights('m-insights',insights);
}

// ── HELOC ────────────────────────────────────────────────────────
function cHeloc(){
  const value=+gel('hl-value').value||0;
  const bal=+gel('hl-bal').value||0;
  const cltv=(+gel('hl-cltv').value||0)/100;
  const rate=(+gel('hl-rate').value||0)/100;
  const r=rate/12;
  const drawYears=+gel('hl-draw').value||1;
  const repayYears=+gel('hl-repay').value||1;
  const drawMonths=drawYears*12,repayMonths=repayYears*12;
  let drawAmt=+gel('hl-draw-amt').value||0;

  const limit=Math.max(0,value*cltv-bal);
  const clamped=drawAmt>limit;
  if(clamped)drawAmt=limit;

  const ioPayment=drawAmt*r;
  const piPayment=r?drawAmt*r*Math.pow(1+r,repayMonths)/(Math.pow(1+r,repayMonths)-1):drawAmt/repayMonths;
  const drawInterestTotal=ioPayment*drawMonths;
  const repayTotalPaid=piPayment*repayMonths;
  const repayInterestTotal=Math.max(0,repayTotalPaid-drawAmt);
  const totalInterest=drawInterestTotal+repayInterestTotal;
  const totalCost=drawAmt+totalInterest;
  const equityAfter=value-bal-drawAmt;
  const cltvAfter=value?((bal+drawAmt)/value*100):0;

  gel('hl-limit').textContent=f$(limit);
  gel('hl-io').textContent=f$(ioPayment);
  gel('hl-pi').textContent=f$(piPayment);
  gel('hl-total-int').textContent=f$(totalInterest);
  gel('hl-equity').textContent=f$(equityAfter);
  gel('hl-cltv-out').textContent=pct(cltvAfter);
  gel('hl-total-cost').textContent=f$(totalCost);

  drawDonut('hl-donut',[drawAmt,drawInterestTotal,repayInterestTotal],['#F0B90B','#8C2E22','#1B3A5C']);
  renderAmortTable('hl-amort-table',drawAmt,r,repayMonths);

  const insights=[];
  if(clamped){
    insights.push({type:'bad',text:`Your requested draw exceeds your available credit limit of <strong>${f$(limit)}</strong> — the numbers above use the maximum available amount instead.`});
  }
  if(limit<=0){
    insights.push({type:'bad',text:`Based on your current mortgage balance and max CLTV, you don't have equity available to draw against yet.`});
  }else{
    const paymentJump=piPayment-ioPayment;
    if(paymentJump>0&&ioPayment>0){
      const jumpPct=paymentJump/ioPayment*100;
      insights.push({type:jumpPct>100?'bad':'neutral',text:`Your payment jumps from <strong>${f$(ioPayment)}/mo</strong> during the draw period to <strong>${f$(piPayment)}/mo</strong> once repayment begins — a <strong>${jumpPct.toFixed(0)}%</strong> increase. Make sure your budget can absorb this once the draw period ends.`});
    }
    const intRatio=drawAmt>0?(totalInterest/drawAmt*100):0;
    insights.push({type:intRatio>50?'bad':'neutral',text:`Across the full draw-plus-repayment timeline, you'll pay <strong>${f$(totalInterest)}</strong> in interest on a <strong>${f$(drawAmt)}</strong> draw — that's <strong>${intRatio.toFixed(0)}%</strong> of what you borrowed.`});
  }
  insights.push({type:'neutral',text:`Considering a fixed-rate alternative instead? The <a href="/mortgage" style="color:var(--a);text-decoration:underline">Mortgage</a> and <a href="/prepay" style="color:var(--a);text-decoration:underline">Loan Prepayment</a> calculators can help you compare.`});
  renderInsights('hl-insights',insights);
}

// ── Rent vs Buy ──────────────────────────────────────────────────
function cRentVsBuy(){
  const price=+gel('rb-price').value||0,downPct=(+gel('rb-down').value||0)/100,rate=(+gel('rb-rate').value||0)/12/100,term=(+gel('rb-term').value||30)*12;
  const rent0=+gel('rb-rent').value||0,years=+gel('rb-years').value||1;
  const apprec=(+gel('rb-apprec').value||0)/100,rentGrow=(+gel('rb-rentgrowth').value||0)/100,investRet=(+gel('rb-invest').value||0)/100;
  const taxPct=(+gel('rb-tax').value||0)/100,maintPct=(+gel('rb-maint').value||0)/100,insAnn=+gel('rb-ins').value||0;
  const closingPct=(+gel('rb-closing').value||0)/100,sellingPct=(+gel('rb-selling').value||0)/100;

  const down=price*downPct,loan=price-down,emi=rate?loan*rate*Math.pow(1+rate,term)/(Math.pow(1+rate,term)-1):loan/term,closing=price*closingPct;
  let balance=loan,homeValue=price,portfolio=down+closing,monthlyRent=rent0;
  const buyNW=[],rentNW=[];
  let breakevenYear=null;

  for(let y=1;y<=years;y++){
    let yearlyMortgage=0;
    for(let m=0;m<12;m++){
      if(balance<=0)continue;
      const interest=balance*rate,principal=Math.min(emi-interest,balance);
      balance-=principal;yearlyMortgage+=emi;
    }
    const propTax=homeValue*taxPct,maint=homeValue*maintPct;
    const buyAnnualCost=yearlyMortgage+propTax+maint+insAnn;
    homeValue*=(1+apprec);
    const rentAnnual=monthlyRent*12;monthlyRent*=(1+rentGrow);
    const gap=buyAnnualCost-rentAnnual;
    portfolio=portfolio*(1+investRet)+gap;
    const sellingCost=homeValue*sellingPct;
    const bNW=homeValue-balance-sellingCost,rNW=portfolio;
    buyNW.push(bNW);rentNW.push(rNW);
    if(breakevenYear===null && bNW>=rNW)breakevenYear=y;
  }

  const monthlyBuyCost=emi+(price*taxPct+price*maintPct+insAnn)/12;
  gel('rb-emi').textContent=f$(emi);gel('rb-buycost').textContent=f$(monthlyBuyCost);
  gel('rb-buynw').textContent=f$(buyNW[buyNW.length-1]||0);gel('rb-rentnw').textContent=f$(rentNW[rentNW.length-1]||0);
  gel('rb-breakeven').textContent=breakevenYear?('Year '+breakevenYear):'Beyond '+years+' yrs';
  gel('rb-vyear').textContent=years;
  const finalBuy=buyNW[buyNW.length-1]||0,finalRent=rentNW[rentNW.length-1]||0;
  const vEl=gel('rb-verdict');
  if(finalBuy>finalRent){vEl.textContent='Buy wins by '+f$(finalBuy-finalRent);vEl.style.color='var(--g)';}
  else{vEl.textContent='Rent wins by '+f$(finalRent-finalBuy);vEl.style.color='var(--b)';}

  drawLine('rb-chart',[{data:[down+closing,...buyNW],color:'#0F4F35',fill:false,w:2.5},{data:[down+closing,...rentNW],color:'#1B3A5C',fill:false,w:2.5}],170);

  const insights=[];
  if(breakevenYear){
    insights.push({type:'neutral',text:`Buying overtakes renting financially around <strong>year ${breakevenYear}</strong> — if you expect to stay at least that long, buying likely makes more sense; if you might move sooner, renting keeps you ahead.`});
  }else{
    insights.push({type:'bad',text:`Within this ${years}-year window, renting stays ahead the whole time at these assumptions — buying would need a longer time horizon or different assumptions (higher appreciation, lower rate) to catch up.`});
  }
  const gapAtEnd=Math.abs(finalBuy-finalRent);
  insights.push({type:finalBuy>finalRent?'good':'neutral',text:`At year ${years}, ${finalBuy>finalRent?'buying':'renting'} leaves you with about <strong>${f$(gapAtEnd)}</strong> more net worth than the alternative.`});
  const breakevenRent=price*0.05/12;
  if(rent0<breakevenRent*0.85){
    insights.push({type:'neutral',text:`Your rent of <strong>${f$(rent0)}/mo</strong> is well below the rough "5% rule" breakeven of <strong>${f$(breakevenRent)}/mo</strong> for this home price — a quick signal that renting may be the better deal here.`});
  }else if(rent0>breakevenRent*1.15){
    insights.push({type:'neutral',text:`Your rent of <strong>${f$(rent0)}/mo</strong> is well above the rough "5% rule" breakeven of <strong>${f$(breakevenRent)}/mo</strong> for this home price — a quick signal that buying may be the better deal here.`});
  }
    insights.push({type:'neutral',text:`Already leaning toward buying? Compare specific mortgage offers side by side with the <a href="/mortcomp" style="color:var(--a);text-decoration:underline">Mortgage Comparison</a> calculator.`});
  renderInsights('rb-insights',insights);
}

// ── Mortgage Compare ────────────────────────────────────────────
const MCC=['#F0B90B','#0F4F35','#1B3A5C'];
const mcd=[{down:20,rate:7,years:30},{down:10,rate:6.5,years:25},{down:30,rate:7.5,years:15}];
function buildMortComp(){
  const cols=gel('mc-cols');cols.innerHTML='';
  mcd.forEach((d,i)=>{cols.innerHTML+=`<div class="cmp-col" id="mc-col-${i}"><div style="font-size:13px;font-weight:600;color:${MCC[i]};margin-bottom:1rem">Option ${i+1}</div><div class="field"><label>Down Payment %</label><input type="text" inputmode="decimal" id="mc-down-${i}" placeholder="e.g. ${d.down}" oninput="cMortComp()"></div><div class="field"><label>Interest Rate %</label><input type="text" inputmode="decimal" id="mc-rate-${i}" placeholder="e.g. ${d.rate}" step="0.1" oninput="cMortComp()"></div><div class="field"><label>Tenure (years)</label><input type="text" inputmode="decimal" id="mc-years-${i}" placeholder="e.g. ${d.years}" oninput="cMortComp()"></div></div>`;});
  cMortComp();
}
function cMortComp(){
  const price=+gel('mc-price').value||0,ptax=+gel('mc-tax').value||0,ins=+gel('mc-ins').value||0;
  const res=mcd.map((_,i)=>{const dp=(+gel(`mc-down-${i}`).value||0)/100,rate=(+gel(`mc-rate-${i}`).value||0),r=rate/12/100,n=(+gel(`mc-years-${i}`).value||1)*12;const loan=price*(1-dp),emi=r?loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):loan/n,interest=emi*n-loan,ti=(ptax+ins)/12;return{loan,emi,interest,ti,monthly:emi+ti,total:emi*n+ptax*(n/12)+ins*(n/12),dp:price*dp};});
  const minM=Math.min(...res.map(r=>r.monthly));
  res.forEach((_,i)=>{const c=gel(`mc-col-${i}`);if(c)c.className='cmp-col'+(res[i].monthly===minM?' winner':'');});
  const rows=[['Down Payment',...res.map(r=>f$(r.dp))],['Loan Amount',...res.map(r=>f$(r.loan))],['Monthly EMI',...res.map(r=>f$(r.emi))],['Tax + Insurance',...res.map(r=>f$(r.ti))],['Total Monthly',...res.map(r=>f$(r.monthly))],['Total Interest',...res.map(r=>f$(r.interest))],['Total Cost',...res.map(r=>f$(r.total))]];
  const tbl=gel('mc-table');
  tbl.innerHTML=`<thead><tr><th style="text-align:left;padding:6px 8px;font-size:11px;color:var(--m);border-bottom:1px solid var(--bd)">Metric</th>${res.map((_,i)=>`<th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:${MCC[i]}">Option ${i+1}</th>`).join('')}</tr></thead><tbody>`;
  rows.forEach(row=>{const nums=row.slice(1).map(v=>parseFloat(v.replace(/[$,]/g,'')));const mn=Math.min(...nums);tbl.innerHTML+=`<tr>${row.map((v,j)=>{if(j===0)return`<td style="text-align:left;font-size:12px;color:var(--m);border-bottom:1px solid var(--bd);padding:7px 8px">${v}</td>`;const ism=parseFloat(v.replace(/[$,]/g,''))===mn;return`<td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;${ism?'color:var(--g);font-weight:600':''}">${v}${ism?' ✓':''}</td>`;}).join('')}</tr>`;});
  tbl.innerHTML+='</tbody>';
  drawBars('mc-chart',['Opt 1 Monthly','Opt 2 Monthly','Opt 3 Monthly'],res.map(r=>r.monthly),MCC,140);

  const insights=[];
  const bestMonthly=res.reduce((a,b,i)=>b.monthly<a.monthly?{...b,idx:i}:a,{...res[0],idx:0});
  const bestTotal=res.reduce((a,b,i)=>b.total<a.total?{...b,idx:i}:a,{...res[0],idx:0});
  const worstTotal=res.reduce((a,b,i)=>b.total>a.total?{...b,idx:i}:a,{...res[0],idx:0});
  insights.push({type:'good',text:`<strong>Option ${bestMonthly.idx+1}</strong> has the lowest monthly payment at <strong>${f$(bestMonthly.monthly)}/mo</strong>.`});
  if(bestTotal.idx!==bestMonthly.idx){
    insights.push({type:'neutral',text:`But <strong>Option ${bestTotal.idx+1}</strong> costs the least overall (<strong>${f$(bestTotal.total)}</strong> total) — the lowest monthly payment isn't always the cheapest option long-term.`});
  }
  const spread=worstTotal.total-bestTotal.total;
  if(spread>1000)insights.push({type:'neutral',text:`The gap between the cheapest and most expensive option here is <strong>${f$(spread)}</strong> over the full loan term.`});
    insights.push({type:'neutral',text:`Picked a favorite? See its full monthly payment breakdown including taxes, insurance, and PMI with the <a href="/mortgage" style="color:var(--a);text-decoration:underline">Mortgage</a> calculator.`});
  renderInsights('mc-insights',insights);
}

// ── Loan Comparison ─────────────────────────────────────────────
const LCC=['#F0B90B','#0F4F35','#1B3A5C'];
const lcd=[{amt:25000,rate:6.5,years:5,fee:1},{amt:25000,rate:7.2,years:4,fee:0},{amt:24000,rate:5.9,years:6,fee:2}];
function buildLoanComp(){
  const cols=gel('lc-cols');cols.innerHTML='';
  lcd.forEach((d,i)=>{cols.innerHTML+=`<div class="cmp-col" id="lc-col-${i}"><div style="font-size:13px;font-weight:600;color:${LCC[i]};margin-bottom:1rem">Offer ${i+1}</div><div class="field"><label>Loan Amount ($)</label><div class="ip"><span class="pfx">$</span><input type="text" inputmode="decimal" id="lc-amt-${i}" placeholder="e.g. ${d.amt}" oninput="cLoanComp()"></div></div><div class="field"><label>Interest Rate (%)</label><input type="text" inputmode="decimal" id="lc-rate-${i}" placeholder="e.g. ${d.rate}" step="0.1" oninput="cLoanComp()"></div><div class="field"><label>Tenure (years)</label><input type="text" inputmode="decimal" id="lc-years-${i}" placeholder="e.g. ${d.years}" step="0.5" oninput="cLoanComp()"></div><div class="field"><label>Processing Fee (%)</label><input type="text" inputmode="decimal" id="lc-fee-${i}" placeholder="e.g. ${d.fee}" step="0.25" oninput="cLoanComp()"></div></div>`;});
  cLoanComp();
}
function cLoanComp(){
  const res=lcd.map((_,i)=>{
    const amt=+gel(`lc-amt-${i}`).value||0,rate=+gel(`lc-rate-${i}`).value||0,years=+gel(`lc-years-${i}`).value||1,fee=(+gel(`lc-fee-${i}`).value||0)/100;
    const r=rate/12/100,n=years*12,emi=r?amt*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):amt/n,interest=emi*n-amt,feeAmt=amt*fee,total=emi*n+feeAmt;
    return{amt,rate,years,emi,interest,feeAmt,total};
  });
  const minM=Math.min(...res.map(r=>r.emi)),minT=Math.min(...res.map(r=>r.total));
  res.forEach((_,i)=>{const c=gel(`lc-col-${i}`);if(c)c.className='cmp-col'+(res[i].total===minT?' winner':'');});
  const rows=[['Loan Amount',...res.map(r=>f$(r.amt))],['Monthly EMI',...res.map(r=>f$(r.emi))],['Total Interest',...res.map(r=>f$(r.interest))],['Processing Fee',...res.map(r=>f$(r.feeAmt))],['Total Cost',...res.map(r=>f$(r.total))]];
  const tbl=gel('lc-table');
  tbl.innerHTML=`<thead><tr><th style="text-align:left;padding:6px 8px;font-size:11px;color:var(--m);border-bottom:1px solid var(--bd)">Metric</th>${res.map((_,i)=>`<th style="padding:6px 8px;font-size:11px;border-bottom:1px solid var(--bd);color:${LCC[i]}">Offer ${i+1}</th>`).join('')}</tr></thead><tbody>`;
  rows.forEach(row=>{const nums=row.slice(1).map(v=>parseFloat(v.replace(/[$,]/g,'')));const mn=Math.min(...nums);tbl.innerHTML+=`<tr>${row.map((v,j)=>{if(j===0)return`<td style="text-align:left;font-size:12px;color:var(--m);border-bottom:1px solid var(--bd);padding:7px 8px">${v}</td>`;const ism=parseFloat(v.replace(/[$,]/g,''))===mn;return`<td style="font-size:12px;font-family:var(--mo);border-bottom:1px solid var(--bd);padding:7px 8px;${ism?'color:var(--g);font-weight:600':''}">${v}${ism?' ✓':''}</td>`;}).join('')}</tr>`;});
  tbl.innerHTML+='</tbody>';
  drawBars('lc-chart',['Offer 1','Offer 2','Offer 3'],res.map(r=>r.emi),LCC,140);

  const insights=[];
  const bestEmi=res.reduce((a,b,i)=>b.emi<a.emi?{...b,idx:i}:a,{...res[0],idx:0});
  const bestTotal=res.reduce((a,b,i)=>b.total<a.total?{...b,idx:i}:a,{...res[0],idx:0});
  const worstTotal=res.reduce((a,b,i)=>b.total>a.total?{...b,idx:i}:a,{...res[0],idx:0});
  insights.push({type:'good',text:`<strong>Offer ${bestEmi.idx+1}</strong> has the lowest monthly EMI at <strong>${f$(bestEmi.emi)}/mo</strong>.`});
  if(bestTotal.idx!==bestEmi.idx){
    insights.push({type:'neutral',text:`But <strong>Offer ${bestTotal.idx+1}</strong> costs the least overall (<strong>${f$(bestTotal.total)}</strong> total) — a higher EMI with a shorter term, or a lower rate, can beat the lowest-payment option once you add up the full cost.`});
  }else{
    insights.push({type:'good',text:`<strong>Offer ${bestTotal.idx+1}</strong> is also the cheapest overall at <strong>${f$(bestTotal.total)}</strong> total — both the easiest on your monthly budget and the best deal.`});
  }
  const spread=worstTotal.total-bestTotal.total;
  if(spread>200)insights.push({type:'neutral',text:`The gap between the cheapest and most expensive offer here is <strong>${f$(spread)}</strong> over the full loan term.`});
  const feeOnly=res.filter(r=>r.feeAmt>0);
  if(feeOnly.length>0 && feeOnly.length<res.length)insights.push({type:'neutral',text:`Some offers charge a processing fee and others don't — that's already factored into the total cost above, not just the EMI.`});
    insights.push({type:'neutral',text:`Already picked an offer? See exactly how much extra payments would save on it with the <a href="/prepay" style="color:var(--a);text-decoration:underline">Loan Prepayment</a> calculator.`});
  renderInsights('lc-insights',insights);
}

// ── Auto Loan ────────────────────────────────────────────────────
function cAutoLoan(){
  const price=+gel('al-price').value||0,down=+gel('al-down').value||0,tradeIn=+gel('al-tradein').value||0;
  const taxRate=(+gel('al-tax').value||0)/100,term=+gel('al-term').value||1,condition=gel('al-condition').value;
  const rateNew=+gel('al-rate-new').value||0,rateUsed=+gel('al-rate-used').value||0;
  const rate=condition==='new'?rateNew:rateUsed;

  const taxableAmount=Math.max(0,price-tradeIn);
  const salesTax=taxableAmount*taxRate;
  const financed=Math.max(0,price-down-tradeIn+salesTax);
  const r=rate/12/100,n=term;
  const emi=r?financed*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):financed/n;
  const totalPaid=emi*n,totalInterest=totalPaid-financed;
  const totalCost=totalPaid+down+tradeIn; // total out-of-pocket including what wasn't financed

  gel('al-financed').textContent=f$(financed);
  gel('al-payment').textContent=f$(emi);
  gel('al-interest').textContent=f$(totalInterest);
  gel('al-total').textContent=f$(totalCost);
  gel('al-salestax').textContent=f$(salesTax);

  drawDonut('al-donut',[financed-salesTax,totalInterest,salesTax],['#F0B90B','#8C2E22','#1B3A5C']);
  renderAmortTable('al-amort-table',financed,r,n);

  // Comparison: same financed amount at both rates, for direct rate comparison regardless of selected condition
  const rNew=rateNew/12/100,rUsed=rateUsed/12/100;
  const emiNew=rNew?financed*rNew*Math.pow(1+rNew,n)/(Math.pow(1+rNew,n)-1):financed/n;
  const emiUsed=rUsed?financed*rUsed*Math.pow(1+rUsed,n)/(Math.pow(1+rUsed,n)-1):financed/n;
  gel('al-paymentnew').textContent=f$(emiNew);
  gel('al-paymentused').textContent=f$(emiUsed);

  const insights=[];
  insights.push({type:'neutral',text:`Financing this purchase as a <strong>${condition}</strong> vehicle at <strong>${rate}%</strong>, your monthly payment is <strong>${f$(emi)}</strong>, with <strong>${f$(totalInterest)}</strong> in total interest over ${term} months.`});
  const rateDiffCost=Math.abs((emiUsed-emiNew)*n);
  if(rateDiffCost>100){
    insights.push({type:condition==='new'?'good':'bad',text:`On this exact amount financed, a used-car rate of <strong>${rateUsed}%</strong> would cost about <strong>${f$(rateDiffCost)}</strong> more in total payments than a new-car rate of <strong>${rateNew}%</strong> — the rate gap alone is a real cost, independent of the vehicle itself.`});
  }
  if(salesTax>500){
    insights.push({type:'neutral',text:`You're financing <strong>${f$(salesTax)}</strong> in sales tax along with the vehicle — that amount also accrues interest for the full loan term, adding a bit more to your total cost than if you paid the tax upfront.`});
  }
  if(term>60){
    insights.push({type:'bad',text:`A <strong>${term}-month</strong> term is longer than the common 60-month sweet spot — it lowers your payment but increases total interest and extends the window where you could owe more than the car is worth.`});
  }
    insights.push({type:'neutral',text:`Weighing this against a personal or other loan type? The <a href="/loancomp" style="color:var(--a);text-decoration:underline">Loan Comparison</a> calculator ranks multiple offers by total cost side by side.`});
  renderInsights('al-insights',insights);
}

// ── Savings ─────────────────────────────────────────────────────
function calcInflation(){
  const amount=+gel('if-amount').value||0,rate=(+gel('if-rate').value||0)/100;
  const startYear=+gel('if-startyear').value||0,endYear=+gel('if-endyear').value||0;
  const years=endYear-startYear;
  const adjusted=amount*Math.pow(1+rate,years);
  const cumulative=amount?((adjusted/amount)-1)*100:0;
  const buypower=Math.pow(1+rate,years)?1/Math.pow(1+rate,years):0;

  const se=(id,v)=>{const e=gel(id);if(e)e.textContent=v;};
  se('if-adjusted',f$(adjusted));
  se('if-cumulative',(cumulative<0?'':'')+pct(cumulative));
  se('if-years',years);
  se('if-buypower','$'+buypower.toFixed(2));
  se('if-rateused',pct(rate*100));

  const steps=10,labels=[],vals=[];
  for(let i=0;i<=steps;i++){
    const y=startYear+(years*i/steps);
    vals.push(amount*Math.pow(1+rate,years*i/steps));
  }
  drawLine('if-chart',[{data:vals,color:'#F0B90B',fill:true}],175);

  const insights=[];
  if(years===0){
    insights.push({type:'neutral',text:'Set different start and end years to see how purchasing power changes over that period.'});
  }else if(years>0){
    insights.push({type:'neutral',text:`At an assumed <strong>${pct(rate*100)}</strong> annual inflation rate, <strong>${f$(amount)}</strong> in ${startYear} has the same purchasing power as <strong>${f$(adjusted)}</strong> in ${endYear} — a cumulative increase of <strong>${cumulative.toFixed(1)}%</strong> over ${years} years.`});
    insights.push({type:'neutral',text:`Put another way, every $1 from ${startYear} has the buying power of roughly <strong>$${buypower.toFixed(2)}</strong> in ${endYear} dollars under this assumption.`});
  }else{
    insights.push({type:'neutral',text:`Going backward ${Math.abs(years)} years, <strong>${f$(amount)}</strong> in ${startYear} would have the equivalent purchasing power of <strong>${f$(adjusted)}</strong> in ${endYear}.`});
  }
  insights.push({type:'neutral',text:`This uses a constant assumed rate, not official year-by-year CPI data — adjust the rate above to match a different assumption or period.`});
  renderInsights('if-insights',insights);
}
function ccSimulate(balance0,monthlyRate,paymentFn){
  let balance=balance0,months=0,totalInterest=0;
  const trail=[balance0];
  const CAP=600; // 50 years
  while(balance>0.005 && months<CAP){
    const interest=balance*monthlyRate;
    let payment=paymentFn(balance,interest);
    if(payment<=interest+1e-9){months=Infinity;break;} // never covers interest -> balance never shrinks
    if(payment>balance+interest)payment=balance+interest;
    balance=balance+interest-payment;
    totalInterest+=interest;
    months++;
    trail.push(Math.max(balance,0));
  }
  return {months,totalInterest,trail,neverPaysOff:!isFinite(months)};
}
function calcCCPayoff(){
  const balance0=+gel('cc-balance').value||0,apr=(+gel('cc-apr').value||0)/100;
  const minPct=(+gel('cc-minpct').value||0)/100,minFloor=+gel('cc-minfloor').value||0;
  const fixedPayment=+gel('cc-fixed').value||0;
  const monthlyRate=Math.pow(1+apr/365,30)-1;

  const minResult=ccSimulate(balance0,monthlyRate,(bal,interest)=>Math.max(minFloor,bal*minPct+interest));
  const fixedResult=ccSimulate(balance0,monthlyRate,()=>fixedPayment);

  const se=(id,v)=>{const e=gel(id);if(e)e.textContent=v;};
  se('cc-minmonths',minResult.neverPaysOff?'Never':minResult.months+' mo');
  se('cc-minint',minResult.neverPaysOff?'∞':f$(minResult.totalInterest));
  se('cc-fixedmonths',fixedResult.neverPaysOff?'Never':fixedResult.months+' mo');
  se('cc-fixedint',fixedResult.neverPaysOff?'∞':f$(fixedResult.totalInterest));
  const saved=(!minResult.neverPaysOff && !fixedResult.neverPaysOff)?minResult.totalInterest-fixedResult.totalInterest:0;
  const timeSaved=(!minResult.neverPaysOff && !fixedResult.neverPaysOff)?minResult.months-fixedResult.months:0;
  se('cc-saved',(!minResult.neverPaysOff && !fixedResult.neverPaysOff)?f$(saved):'—');
  se('cc-timesaved',(!minResult.neverPaysOff && !fixedResult.neverPaysOff)?timeSaved+' months':'—');

  const chartLen=Math.min(Math.max(minResult.neverPaysOff?0:minResult.trail.length,fixedResult.neverPaysOff?0:fixedResult.trail.length,fixedResult.neverPaysOff?0:fixedResult.trail.length)||fixedResult.trail.length,240);
  const minTrail=minResult.trail.slice(0,chartLen);
  const fixedTrail=fixedResult.trail.slice(0,chartLen);
  while(minTrail.length<chartLen)minTrail.push(0);
  while(fixedTrail.length<chartLen)fixedTrail.push(0);
  drawLine('cc-chart',[{data:minTrail,color:'#8C2E22',fill:false,w:2},{data:fixedTrail,color:'#0F4F35',fill:false,w:2.5}],175);

  const insights=[];
  if(minResult.neverPaysOff){
    insights.push({type:'bad',text:`At this minimum payment structure, the balance <strong>never actually shrinks</strong> — the minimum payment doesn't cover the interest accruing each month. A fixed payment of at least <strong>${f$(balance0*monthlyRate+1)}</strong>/month is needed just to stop the balance from growing.`});
  }else{
    insights.push({type:'bad',text:`Paying only the minimum, this balance takes <strong>${minResult.months} months</strong> (${(minResult.months/12).toFixed(1)} years) to pay off, costing <strong>${f$(minResult.totalInterest)}</strong> in interest — ${minResult.totalInterest>balance0?'more than the original balance itself':`${(minResult.totalInterest/balance0*100).toFixed(0)}% of the original balance`}.`});
  }
  if(!fixedResult.neverPaysOff && !minResult.neverPaysOff){
    insights.push({type:'good',text:`At a fixed <strong>${f$(fixedPayment)}</strong>/month, the same balance is paid off in <strong>${fixedResult.months} months</strong>, saving <strong>${f$(saved)}</strong> in interest and <strong>${timeSaved} months</strong> compared to minimum-only payments.`});
  }else if(!fixedResult.neverPaysOff){
    insights.push({type:'good',text:`At a fixed <strong>${f$(fixedPayment)}</strong>/month, this balance is paid off in <strong>${fixedResult.months} months</strong>, costing <strong>${f$(fixedResult.totalInterest)}</strong> in interest.`});
  }else{
    const neededPayment=balance0*monthlyRate;
    insights.push({type:'bad',text:`Your fixed payment of <strong>${f$(fixedPayment)}</strong>/month doesn't even cover the interest accruing each month — the balance will grow, not shrink. You'd need at least <strong>${f$(neededPayment+1)}</strong>/month just to stop it from growing, and more than that to actually pay it down.`});
  }
  renderInsights('cc-insights',insights);
}
function cSavings(){
  const init=+gel('sv-init').value||0,mo=+gel('sv-monthly').value||0,r=(+gel('sv-rate').value||0)/100,y=+gel('sv-years').value||1,k=+gel('sv-comp').value;
  const rk=r/k,n=k*y,fb=init*Math.pow(1+rk,n)+mo*(Math.pow(1+rk,n)-1)/(rk||1)*(1+rk)*(12/k);
  const contrib=init+mo*12*y,int=fb-contrib,dbl=r>0?Math.log(2)/Math.log(1+r):Infinity;
  gel('sv-final').textContent=f$(fb);gel('sv-int').textContent=f$(int);gel('sv-contrib').textContent=f$(contrib);
  gel('sv-dbl').textContent=isFinite(dbl)?dbl.toFixed(1)+' yrs':'∞';gel('sv-ratio').textContent=pct(int/contrib*100);
  const steps=10,ip=[],fp=[];
  for(let i=1;i<=steps;i++){const yr=y*i/steps,ni=k*yr,b=init*Math.pow(1+rk,ni)+mo*(Math.pow(1+rk,ni)-1)/(rk||1)*(1+rk)*(12/k);ip.push(init+mo*12*yr);fp.push(b);}
  drawLine('sv-chart',[{data:ip,color:'#0F4F35',fill:true},{data:fp,color:'#F0B90B',fill:false,w:2.5}],175);

  const insights=[];
  const intRatio=contrib>0?int/contrib*100:0;
  insights.push({type:'good',text:`Of your final <strong>${f$(fb)}</strong>, <strong>${f$(int)}</strong> (<strong>${intRatio.toFixed(0)}%</strong> of what you contributed) is interest your money earned on its own.`});
  if(isFinite(dbl))insights.push({type:'neutral',text:`At <strong>${pct(r*100)}</strong>, your money roughly doubles every <strong>${dbl.toFixed(1)} years</strong> — even without adding another dollar.`});
  if(mo===0 && init>0)insights.push({type:'neutral',text:`You're not adding any monthly contributions — even a small recurring deposit would meaningfully grow your final balance.`});
  if(fb>0){
    insights.push({type:'neutral',text:`Is <strong>${f$(fb)}</strong> actually enough? That depends entirely on what it's for. Retirement guidance commonly targets <strong>25x</strong> your real annual expenses (the 4% rule) — plug your own expenses into the <a href="/retirement" style="color:var(--a);text-decoration:underline">Retirement</a> or <a href="/fire" style="color:var(--a);text-decoration:underline">FIRE</a> calculator to see your specific target, or the <a href="/savingsgoal" style="color:var(--a);text-decoration:underline">Savings Goal</a> calculator if you're saving toward a specific number like a house down payment.`});
  }
  renderInsights('sv-insights',insights);
}

// ── Salary ──────────────────────────────────────────────────────
function cSalary(){
  const amt=+gel('sl-amount').value||0;
  const period=gel('sl-period').value;
  const hrsDay=+gel('sl-hours').value||8;
  const daysWeek=+gel('sl-days').value||5;
  const weeksYear=+gel('sl-weeks').value||52;

  const workDays=daysWeek*weeksYear;
  const workHours=hrsDay*workDays;

  let annual=0;
  if(period==='hourly')annual=amt*workHours;
  else if(period==='daily')annual=amt*workDays;
  else if(period==='monthly')annual=amt*12;
  else annual=amt;

  const hourly=workHours>0?annual/workHours:0;
  const daily=workDays>0?annual/workDays:0;
  const monthly=annual/12;
  const weekly=weeksYear>0?annual/weeksYear:0;
  const biweekly=weekly*2;
  const semiMonthly=annual/24;

  gel('sl-hourly').textContent='$'+hourly.toFixed(2);
  gel('sl-daily').textContent='$'+daily.toFixed(2);
  gel('sl-monthly').textContent=f$(monthly);
  gel('sl-yearly').textContent=f$(annual);
  gel('sl-weekly').textContent='$'+weekly.toFixed(2);
  gel('sl-biweekly').textContent='$'+biweekly.toFixed(2);
  gel('sl-semimonthly').textContent='$'+semiMonthly.toFixed(2);
  gel('sl-workdays').textContent=workDays.toLocaleString('en-US');
  gel('sl-workhours').textContent=workHours.toLocaleString('en-US');

  const insights=[];
  const FED_MIN=7.25;
  if(hourly>0 && hourly<FED_MIN){
    insights.push({type:'bad',text:`This works out to <strong>$${hourly.toFixed(2)}/hr</strong>, which is below the US federal minimum wage of <strong>$${FED_MIN.toFixed(2)}/hr</strong> (state minimums may be higher).`});
  }else if(hourly>=25){
    insights.push({type:'good',text:`At <strong>$${hourly.toFixed(2)}/hr</strong>, this is well above the US federal minimum wage of $${FED_MIN.toFixed(2)}/hr.`});
  }
  const MEDIAN_US=59000;
  if(annual>0){
    if(annual>=MEDIAN_US*1.05){
      insights.push({type:'good',text:`<strong>${f$(annual)}/year</strong> is above the roughly $${(MEDIAN_US/1000).toFixed(0)}k median individual income in the US.`});
    }else if(annual<=MEDIAN_US*0.95){
      insights.push({type:'neutral',text:`<strong>${f$(annual)}/year</strong> is below the roughly $${(MEDIAN_US/1000).toFixed(0)}k median individual income in the US.`});
    }else{
      insights.push({type:'neutral',text:`<strong>${f$(annual)}/year</strong> is roughly in line with the median individual income in the US.`});
    }
  }
  insights.push({type:'neutral',text:`All figures above are <strong>gross pay</strong> before taxes and deductions. Use the <a href="/tax" style="color:var(--a);text-decoration:underline">Tax Estimator</a> to see roughly what you'd actually take home.`});
  renderInsights('sl-insights',insights);
}

// ── Millionaire Timeline ────────────────────────────────────────
function _miMonthsToTarget(current,monthly,target,mr){
  if(current>=target)return 0;
  if(mr<=0){
    if(monthly<=0)return Infinity;
    return (target-current)/monthly;
  }
  const denom=current*mr+monthly;
  if(denom<=0)return Infinity;
  const x=(target*mr+monthly)/denom;
  if(x<=0)return Infinity;
  return Math.log(x)/Math.log(1+mr);
}
function cMillionaire(){
  const age=+gel('mi-age').value||0;
  const target=+gel('mi-target').value||1000000;
  const current=+gel('mi-current').value||0;
  const monthly=+gel('mi-monthly').value||0;
  const annRate=(+gel('mi-rate').value||0)/100;
  const mr=Math.pow(1+annRate,1/12)-1;

  const months=_miMonthsToTarget(current,monthly,target,mr);
  const achievable=isFinite(months);
  const years=achievable?months/12:Infinity;
  const hitAge=achievable?age+years:Infinity;

  let totalContrib=0,totalGrowth=0,finalBal=current;
  if(achievable){
    totalContrib=monthly*months;
    finalBal=target;
    totalGrowth=Math.max(finalBal-current-totalContrib,0);
  }

  gel('mi-age-result').textContent=achievable?hitAge.toFixed(1):'—';
  gel('mi-years').textContent=achievable?years.toFixed(1)+' yrs':'—';
  gel('mi-contrib').textContent=achievable?f$(totalContrib):'—';
  gel('mi-growth').textContent=achievable?f$(totalGrowth):'—';

  if(achievable){
    const d=new Date();d.setMonth(d.getMonth()+Math.round(months));
    gel('mi-date').textContent=d.toLocaleDateString('en-US',{month:'short',year:'numeric'});
  }else{
    gel('mi-date').textContent='Not reachable';
  }
  gel('mi-pct').textContent=target>0?pct(Math.min(current/target*100,100)):'0%';

  const fasterMonths=_miMonthsToTarget(current,monthly+200,target,mr);
  if(achievable && isFinite(fasterMonths) && fasterMonths<months){
    const diffYears=(months-fasterMonths)/12;
    gel('mi-faster').textContent=diffYears>=1?diffYears.toFixed(1)+' yrs sooner':Math.round(diffYears*12)+' mo sooner';
  }else{
    gel('mi-faster').textContent='—';
  }

  // Chart: balance path vs flat target line, capped at reach point (or 40yr max)
  const chartMonths=achievable?Math.ceil(months):480;
  const steps=12,balPts=[],targetPts=[];
  for(let i=0;i<=steps;i++){
    const m=chartMonths*i/steps;
    const bal=mr>0?current*Math.pow(1+mr,m)+monthly*((Math.pow(1+mr,m)-1)/mr):current+monthly*m;
    balPts.push(Math.min(bal,target*1.05));
    targetPts.push(target);
  }
  drawLine('mi-chart',[{data:balPts,color:'#0F4F35',fill:true},{data:targetPts,color:'#F0B90B',fill:false,dash:[6,4],w:1.5}],175);

  const insights=[];
  if(!achievable){
    insights.push({type:'bad',text:`At your current contribution and return rate, you won't reach <strong>${f$(target)}</strong> — try increasing your monthly savings or expected return.`});
  }else if(hitAge<=45){
    insights.push({type:'good',text:`You're on track to hit <strong>${f$(target)}</strong> by age <strong>${hitAge.toFixed(0)}</strong> — that's <strong>${years.toFixed(1)} years</strong> from now.`});
  }else{
    insights.push({type:'neutral',text:`At this pace, you'll reach <strong>${f$(target)}</strong> by age <strong>${hitAge.toFixed(0)}</strong>, in about <strong>${years.toFixed(1)} years</strong>.`});
  }
  if(achievable && totalGrowth>0){
    const growthShare=totalGrowth/target*100;
    insights.push({type:'neutral',text:`Of your final <strong>${f$(target)}</strong>, roughly <strong>${growthShare.toFixed(0)}%</strong> comes from investment growth rather than money you personally contributed — compounding is doing most of the work.`});
  }
  if(achievable && isFinite(fasterMonths) && fasterMonths<months){
    const diffYears=(months-fasterMonths)/12;
    insights.push({type:'good',text:`Adding just <strong>$200/month</strong> more would get you there roughly <strong>${diffYears.toFixed(1)} years sooner</strong>.`});
  }
  insights.push({type:'neutral',text:`This is your <strong>nominal</strong> (non-inflation-adjusted) net worth. Due to inflation, this amount will buy less in the future than it would today — see the guide below for details.`});
  renderInsights('mi-insights',insights);
}

// ── Dollar Cost Averaging ───────────────────────────────────────
function cDCA(){
  const amt=+gel('dc-amt').value||0;
  const periodsPerYear=+gel('dc-freq').value||12;
  const years=+gel('dc-years').value||0;
  const startPrice=+gel('dc-price').value||0;
  const annGrowth=(+gel('dc-growth').value||0)/100;

  const N=Math.max(Math.round(periodsPerYear*years),0);
  const periodRate=Math.pow(1+annGrowth,1/periodsPerYear)-1;

  let totalShares=0,totalInvested=0;
  const pricePath=[startPrice],valuePath=[0],lumpPath=[amt*N>0?amt*N/Math.max(startPrice,0.0001)*startPrice:0];
  for(let i=1;i<=N;i++){
    const price=startPrice*Math.pow(1+periodRate,i);
    if(price>0){totalShares+=amt/price;}
    totalInvested+=amt;
    pricePath.push(price);
  }
  const finalPrice=startPrice*Math.pow(1+periodRate,N);
  const endingValue=totalShares*finalPrice;
  const avgCost=totalShares>0?totalInvested/totalShares:0;
  const gain=endingValue-totalInvested;
  const returnPct=totalInvested>0?gain/totalInvested*100:0;

  const lumpShares=startPrice>0?totalInvested/startPrice:0;
  const lumpValue=lumpShares*finalPrice;

  gel('dc-shares').textContent=totalShares.toLocaleString('en-US',{maximumFractionDigits:2});
  gel('dc-avgcost').textContent='$'+avgCost.toFixed(2);
  gel('dc-invested').textContent=f$(totalInvested);
  gel('dc-value').textContent=f$(endingValue);
  gel('dc-finalprice').textContent='$'+finalPrice.toFixed(2);
  gel('dc-gain').textContent=(gain>=0?'+':'')+f$(gain);
  gel('dc-return').textContent=(returnPct>=0?'+':'')+returnPct.toFixed(1)+'%';
  gel('dc-lumpvalue').textContent=f$(lumpValue);
  const gainEl=gel('dc-gain'),retEl=gel('dc-return');
  gainEl.style.color=gain>=0?'var(--g)':'var(--r)';
  retEl.style.color=gain>=0?'var(--g)':'var(--r)';

  // chart: DCA value path vs Lump Sum value path over periods
  const steps=Math.min(N,24)||1;
  const dcaPts=[0],lumpPts=[0];
  let runningShares=0,runningInvested=0;
  for(let s=1;s<=steps;s++){
    const i=Math.round(N*s/steps);
    let shares=0,inv=0;
    for(let k=1;k<=i;k++){const price=startPrice*Math.pow(1+periodRate,k);if(price>0)shares+=amt/price;inv+=amt;}
    const price_i=startPrice*Math.pow(1+periodRate,i);
    dcaPts.push(shares*price_i);
    const lShares=startPrice>0?inv/startPrice:0;
    lumpPts.push(lShares*price_i);
  }
  drawLine('dc-chart',[{data:lumpPts,color:'#F0B90B',fill:false,w:2},{data:dcaPts,color:'#0F4F35',fill:true}],175);

  const insights=[];
  if(totalShares>0){
    const savedPct=startPrice>0?(1-avgCost/startPrice)*100:0;
    if(savedPct>0.5){
      insights.push({type:'good',text:`Your average cost of <strong>$${avgCost.toFixed(2)}/share</strong> is about <strong>${savedPct.toFixed(1)}% below</strong> the starting price — dollar cost averaging worked in your favor here because prices were rising, so early purchases came in cheaper.`});
    }else{
      insights.push({type:'neutral',text:`Your average cost per share came out to <strong>$${avgCost.toFixed(2)}</strong>, close to the starting price of $${startPrice.toFixed(2)}.`});
    }
  }
  if(lumpValue>endingValue){
    const diff=lumpValue-endingValue;
    insights.push({type:'neutral',text:`In this steadily-rising price scenario, investing the same <strong>${f$(totalInvested)}</strong> as a lump sum on day one would have ended with <strong>${f$(diff)} more</strong> — this is expected in a smoothly rising market, since more money is invested for longer. Real markets are volatile, not smooth, which is where DCA's risk-reduction benefit comes in.`});
  }else if(endingValue>lumpValue){
    const diff=endingValue-lumpValue;
    insights.push({type:'good',text:`In this scenario, dollar cost averaging actually ended <strong>${f$(diff)} ahead</strong> of a lump sum invested at the (higher) starting price.`});
  }
  insights.push({type:'neutral',text:`This projection assumes a smooth, steady price growth rate for simplicity — real markets move up and down, which is exactly the volatility that makes DCA's share-averaging effect meaningful in practice.`});
  renderInsights('dc-insights',insights);
}

// ── Life Insurance Needs ────────────────────────────────────────
function cLifeIns(){
  const income=+gel('li-income').value||0;
  const years=+gel('li-years').value||0;
  const mortgage=+gel('li-mortgage').value||0;
  const debt=+gel('li-debt').value||0;
  const education=+gel('li-education').value||0;
  const final_=+gel('li-final').value||0;
  const existingCov=+gel('li-existing-cov').value||0;
  const savings=+gel('li-savings').value||0;

  const incomeNeed=income*years;
  const obligations=mortgage+debt+education+final_;
  const grossNeed=incomeNeed+obligations;
  const offset=existingCov+savings;
  const netNeed=Math.max(grossNeed-offset,0);

  gel('li-need').textContent=f$(netNeed);
  gel('li-income-need').textContent=f$(incomeNeed);
  gel('li-obligations').textContent=f$(obligations);
  gel('li-offset').textContent='−'+f$(offset);

  gel('li-r-income').textContent=f$(incomeNeed);
  gel('li-r-mortgage').textContent=f$(mortgage);
  gel('li-r-debt').textContent=f$(debt);
  gel('li-r-education').textContent=f$(education);
  gel('li-r-final').textContent=f$(final_);
  gel('li-r-existing').textContent='−'+f$(existingCov);
  gel('li-r-savings').textContent='−'+f$(savings);
  gel('li-r-total').textContent=f$(netNeed);

  const insights=[];
  const ruleOfThumb=income*10;
  if(netNeed>0){
    const diff=netNeed-ruleOfThumb;
    if(Math.abs(diff)>ruleOfThumb*0.15){
      insights.push({type:'neutral',text:`Your needs-based estimate of <strong>${f$(netNeed)}</strong> differs from the common "10× income" rule of thumb (${f$(ruleOfThumb)}) by <strong>${f$(Math.abs(diff))}</strong> — the needs-based number accounts for your actual mortgage, debts, and savings, so it's usually the more accurate one to use.`});
    }else{
      insights.push({type:'neutral',text:`Your needs-based estimate of <strong>${f$(netNeed)}</strong> is fairly close to the common "10× income" rule of thumb (${f$(ruleOfThumb)}).`});
    }
    insights.push({type:'good',text:`Consider a <strong>term life policy</strong> around <strong>${f$(netNeed)}</strong> — term coverage is typically far cheaper than permanent life insurance for this kind of temporary, needs-based gap.`});
  }else{
    insights.push({type:'good',text:`Based on your existing coverage and savings, you may already have your income-replacement and obligation needs covered. Revisit this after any major life change.`});
  }
  if(offset>0){
    insights.push({type:'neutral',text:`Your existing coverage and savings of <strong>${f$(offset)}</strong> are already reducing how much additional insurance you'd need.`});
  }
  insights.push({type:'neutral',text:`This is an estimate for general planning purposes, not personalized financial or insurance advice — a licensed insurance professional can help account for your full situation.`});
  renderInsights('li-insights',insights);
}

// ── Health Insurance ─────────────────────────────────────────────
function _hiOOP(expenses,deductible,coinsPct,oopMax){
  let oop;
  if(expenses<=deductible)oop=expenses;
  else oop=deductible+(expenses-deductible)*coinsPct;
  oop=Math.min(oop,oopMax,expenses);
  return Math.max(oop,0);
}
function _hiTotalCost(expenses,premiumMonthly,deductible,coinsPct,oopMax){
  return premiumMonthly*12+_hiOOP(expenses,deductible,coinsPct,oopMax);
}
function cHealthIns(){
  const expenses=+gel('hi-expenses').value||0;
  const aPremium=+gel('hi-a-premium').value||0;
  const aDeductible=+gel('hi-a-deductible').value||0;
  const aCoins=(+gel('hi-a-coins').value||0)/100;
  const aOopMax=+gel('hi-a-oopmax').value||0;
  const bPremium=+gel('hi-b-premium').value||0;
  const bDeductible=+gel('hi-b-deductible').value||0;
  const bCoins=(+gel('hi-b-coins').value||0)/100;
  const bOopMax=+gel('hi-b-oopmax').value||0;

  const aOop=_hiOOP(expenses,aDeductible,aCoins,aOopMax);
  const bOop=_hiOOP(expenses,bDeductible,bCoins,bOopMax);
  const aTotal=aPremium*12+aOop;
  const bTotal=bPremium*12+bOop;

  gel('hi-a-total').textContent=f$(aTotal);
  gel('hi-b-total').textContent=f$(bTotal);
  gel('hi-a-r-premium').textContent=f$(aPremium*12);
  gel('hi-a-r-oop').textContent=f$(aOop);
  gel('hi-b-r-premium').textContent=f$(bPremium*12);
  gel('hi-b-r-oop').textContent=f$(bOop);

  const diff=Math.abs(aTotal-bTotal);
  if(aTotal<bTotal){gel('hi-cheaper').textContent='Plan A';}
  else if(bTotal<aTotal){gel('hi-cheaper').textContent='Plan B';}
  else{gel('hi-cheaper').textContent='Tied';}
  gel('hi-savings').textContent=f$(diff);

  // find break-even usage level via sampling
  const maxE=Math.max(aOopMax,bOopMax)*2+10000;
  const steps=4000;
  let breakEven=null;
  let prevDiff=_hiTotalCost(0,aPremium,aDeductible,aCoins,aOopMax)-_hiTotalCost(0,bPremium,bDeductible,bCoins,bOopMax);
  for(let i=1;i<=steps;i++){
    const e=maxE*i/steps;
    const d=_hiTotalCost(e,aPremium,aDeductible,aCoins,aOopMax)-_hiTotalCost(e,bPremium,bDeductible,bCoins,bOopMax);
    if((prevDiff<0&&d>=0)||(prevDiff>0&&d<=0)){
      const ePrev=maxE*(i-1)/steps;
      breakEven=ePrev+(e-ePrev)*Math.abs(prevDiff)/(Math.abs(prevDiff)+Math.abs(d)||1);
      break;
    }
    prevDiff=d;
  }
  gel('hi-breakeven').textContent=breakEven!==null?f$(breakEven)+'/yr':'No crossover';

  const insights=[];
  if(diff>0){
    const cheaper=aTotal<bTotal?'Plan A':'Plan B';
    insights.push({type:'good',text:`At <strong>${f$(expenses)}</strong> in expected annual expenses, <strong>${cheaper}</strong> costs <strong>${f$(diff)} less</strong> in total for the year.`});
  }else{
    insights.push({type:'neutral',text:`At this usage level, both plans cost about the same in total.`});
  }
  if(breakEven!==null){
    insights.push({type:'neutral',text:`These two plans cost the same at roughly <strong>${f$(breakEven)}</strong> in annual medical spending. Below that, the lower-premium plan tends to win; above it, the lower-deductible plan tends to win.`});
  }
  const lowerPremiumIsA=aPremium<bPremium;
  const lowerPremiumCheaper=(lowerPremiumIsA&&aTotal<bTotal)||(!lowerPremiumIsA&&bTotal<aTotal);
  if(expenses>Math.min(aDeductible,bDeductible)&&!lowerPremiumCheaper){
    insights.push({type:'bad',text:`The lower-premium plan is not actually cheaper at your expected usage level — its higher deductible and coinsurance outweigh the premium savings once you factor in real healthcare use.`});
  }
  insights.push({type:'neutral',text:`This estimate doesn't include copays for specific services, prescription drug tiers, or network differences — review the plan documents for the full picture before deciding.`});
  renderInsights('hi-insights',insights);
}

// ── Loan Eligibility ────────────────────────────────────────────
function cLoanElig(){
  const income=+gel('le-income').value||0;
  const existing=+gel('le-existing').value||0;
  const dtiPct=(+gel('le-dti').value||0)/100;
  const annRate=(+gel('le-rate').value||0)/100;
  const years=+gel('le-years').value||0;

  const maxEMI=income*dtiPct;
  const capacity=Math.max(maxEMI-existing,0);
  const r=annRate/12, n=years*12;
  let loan=0;
  if(capacity>0&&n>0){
    loan = r>0 ? capacity*((Math.pow(1+r,n)-1)/(r*Math.pow(1+r,n))) : capacity*n;
  }
  const dtiUsed=income>0?(existing/income*100):0;

  gel('le-loan').textContent=f$(loan);
  gel('le-capacity').textContent=f$(capacity);
  gel('le-maxemi').textContent=f$(maxEMI);
  gel('le-used').textContent=pct(dtiUsed);

  gel('le-r-income').textContent=f$(income);
  gel('le-r-dti').textContent=(dtiPct*100).toFixed(0)+'%';
  gel('le-r-maxemi').textContent=f$(maxEMI);
  gel('le-r-existing').textContent='−'+f$(existing);
  gel('le-r-capacity').textContent=f$(capacity);
  gel('le-r-loan').textContent=f$(loan);

  const insights=[];
  if(capacity<=0){
    insights.push({type:'bad',text:`Your existing debt payments already use up your entire allowed DTI budget, leaving no room for a new loan at a ${(dtiPct*100).toFixed(0)}% DTI cap. Paying down existing debt would be the most direct way to open up eligibility.`});
  }else{
    insights.push({type:'good',text:`Based on your income and existing debt, you may be eligible for a loan of roughly <strong>${f$(loan)}</strong> at these terms.`});
    if(dtiUsed>0){
      insights.push({type:'neutral',text:`Your existing debt already uses <strong>${pct(dtiUsed)}</strong> of your income, leaving <strong>${f$(capacity)}/month</strong> in EMI capacity for this new loan.`});
    }
  }
  if(dtiPct*100>45){
    insights.push({type:'neutral',text:`A ${(dtiPct*100).toFixed(0)}% max DTI is on the higher end — many lenders cap total DTI closer to 36-43%. Actual offers may be more conservative than this estimate.`});
  }
  insights.push({type:'neutral',text:`This is an estimate based on income and debt alone — actual approval also depends on credit score, employment history, and lender-specific policies.`});
  renderInsights('le-insights',insights);
}

// ── Debt-to-Income Ratio ────────────────────────────────────────
function cDTI(){
  const income=+gel('dti-income').value||0;
  const housing=+gel('dti-housing').value||0;
  const other=+gel('dti-other').value||0;

  const totalDebt=housing+other;
  const backEnd=income>0?(totalDebt/income*100):0;
  const frontEnd=income>0?(housing/income*100):0;
  const remaining=income-totalDebt;

  let rating,ratingColor,ratingType;
  if(backEnd<=36){rating='Excellent';ratingColor='var(--g)';ratingType='good';}
  else if(backEnd<=43){rating='Acceptable';ratingColor='var(--a)';ratingType='neutral';}
  else if(backEnd<=50){rating='High';ratingColor='var(--r)';ratingType='bad';}
  else{rating='Risky';ratingColor='var(--r)';ratingType='bad';}

  gel('dti-back').textContent=pct(backEnd);
  gel('dti-front').textContent=pct(frontEnd);
  gel('dti-totaldebt').textContent=f$(totalDebt);
  gel('dti-rating').textContent=rating;
  gel('dti-rating').style.color=ratingColor;

  gel('dti-r-income').textContent=f$(income);
  gel('dti-r-housing').textContent=f$(housing);
  gel('dti-r-other').textContent=f$(other);
  gel('dti-r-total').textContent=f$(totalDebt);
  gel('dti-r-remaining').textContent=f$(remaining);

  const insights=[];
  if(backEnd<=36){
    insights.push({type:'good',text:`At <strong>${pct(backEnd)}</strong>, your back-end DTI is in the excellent range — this generally qualifies for the widest range of loan products and the best available rates.`});
  }else if(backEnd<=43){
    insights.push({type:'neutral',text:`At <strong>${pct(backEnd)}</strong>, your back-end DTI is acceptable to most lenders, though some become more selective in this range.`});
  }else if(backEnd<=50){
    insights.push({type:'bad',text:`At <strong>${pct(backEnd)}</strong>, your back-end DTI is on the high side — many conventional lenders may hesitate or require stronger credit and savings to offset it.`});
  }else{
    insights.push({type:'bad',text:`At <strong>${pct(backEnd)}</strong>, your back-end DTI is above what most lenders consider serviceable. Reducing debt payments before applying for new credit would likely improve your options significantly.`});
  }
  if(frontEnd>28){
    insights.push({type:'neutral',text:`Your housing payment alone takes up <strong>${pct(frontEnd)}</strong> of your income — above the commonly cited 28% front-end guideline, even before other debts are counted.`});
  }
  insights.push({type:'neutral',text:`Paying off even one smaller debt in full often improves DTI faster than partial payments spread across several, since it removes a whole monthly obligation from the calculation.`});
  renderInsights('dti-insights',insights);
}

// ── 401(k) ──────────────────────────────────────────────────────
function c401k(){
  const age=+gel('k4-age').value||0;
  const retAge=+gel('k4-retage').value||age;
  let balance=+gel('k4-bal').value||0;
  let salary=+gel('k4-salary').value||0;
  const contribPct=(+gel('k4-contrib').value||0)/100;
  const salaryGrowth=(+gel('k4-growth').value||0)/100;
  const matchRate=(+gel('k4-matchrate').value||0)/100;
  const matchLimitPct=(+gel('k4-matchlimit').value||0)/100;
  const annReturn=(+gel('k4-return').value||0)/100;

  const years=Math.max(retAge-age,0);
  const monthlyReturn=Math.pow(1+annReturn,1/12)-1;
  const IRS_LIMIT=23500;

  let totalContrib=0,totalMatch=0;
  let firstYearContrib=0,firstYearMatch=0;
  const yearlyBalances=[balance],yearlyContribBasis=[balance];
  let contribBasis=balance;

  for(let y=0;y<years;y++){
    let yearContrib=0,yearMatch=0;
    const effMatchPct=Math.min(contribPct,matchLimitPct)*matchRate;
    let annualEmployeeAmt=salary*contribPct;
    if(annualEmployeeAmt>IRS_LIMIT)annualEmployeeAmt=IRS_LIMIT;
    const monthlyEmployee=annualEmployeeAmt/12;
    const monthlyMatch=salary*effMatchPct/12;
    for(let m=0;m<12;m++){
      balance=balance*(1+monthlyReturn)+monthlyEmployee+monthlyMatch;
      contribBasis+=monthlyEmployee+monthlyMatch;
      yearContrib+=monthlyEmployee;
      yearMatch+=monthlyMatch;
    }
    totalContrib+=yearContrib;
    totalMatch+=yearMatch;
    if(y===0){firstYearContrib=yearContrib;firstYearMatch=yearMatch;}
    salary*=(1+salaryGrowth);
    yearlyBalances.push(balance);
    yearlyContribBasis.push(contribBasis);
  }

  const startBal=+gel('k4-bal').value||0;
  const totalGrowth=balance-startBal-totalContrib-totalMatch;

  gel('k4-final').textContent=f$(balance);
  gel('k4-growth-total').textContent=f$(Math.max(totalGrowth,0));
  gel('k4-contrib-total').textContent=f$(totalContrib);
  gel('k4-match-total').textContent=f$(totalMatch);
  gel('k4-years').textContent=years+' yrs';
  gel('k4-annual-contrib').textContent=f$(firstYearContrib);
  gel('k4-annual-match').textContent=f$(firstYearMatch);

  drawLine('k4-chart',[
    {data:yearlyContribBasis,color:'#0F4F35',fill:true},
    {data:yearlyBalances,color:'#F0B90B',fill:false,w:2.5}
  ],175);

  const insights=[];
  const initialSalary=+gel('k4-salary').value||0;
  const annualEmployeeAmt0=Math.min(initialSalary*contribPct,IRS_LIMIT);
  if(contribPct*100<matchLimitPct*100){
    const missedMatch=(matchLimitPct-contribPct)*matchRate*initialSalary;
    insights.push({type:'bad',text:`You're contributing below the <strong>${(matchLimitPct*100).toFixed(1)}%</strong> match threshold — increasing your contribution to at least that level would capture roughly <strong>${f$(missedMatch)}/year</strong> more in free employer match.`});
  }else{
    insights.push({type:'good',text:`You're contributing enough to capture your <strong>full employer match</strong> — that's free money on top of your own savings.`});
  }
  if(annualEmployeeAmt0>=IRS_LIMIT*0.95){
    insights.push({type:'neutral',text:`Your contribution is near or at the 2025 IRS employee deferral limit of <strong>${f$(IRS_LIMIT)}</strong>. Contributions are capped at this limit regardless of your elected percentage.`});
  }
  if(years>0){
    const growthShare=balance>0?(Math.max(totalGrowth,0)/balance*100):0;
    insights.push({type:'neutral',text:`Of your projected <strong>${f$(balance)}</strong> balance, roughly <strong>${growthShare.toFixed(0)}%</strong> comes from investment growth rather than contributions — the longer your money stays invested, the larger this share becomes.`});
  }
  insights.push({type:'neutral',text:`This projection assumes steady returns and doesn't account for market volatility, fees, or contribution limit changes over time. Try the <a href="/retirement" style="color:var(--a);text-decoration:underline">Retirement</a> calculator to see how this fits your overall retirement income picture.`});
  renderInsights('k4-insights',insights);
}

// ── Stock ────────────────────────────────────────────────────────
function calcOptions(){
  const type=gel('op-type').value,position=gel('op-position').value;
  const strike=+gel('op-strike').value||0,premium=+gel('op-premium').value||0;
  const contracts=+gel('op-contracts').value||1,target=+gel('op-target').value||0;
  const mult=100*contracts;

  const breakeven=type==='call'?strike+premium:strike-premium;
  const intrinsicAt=(price)=>type==='call'?Math.max(price-strike,0):Math.max(strike-price,0);
  const totalPremium=premium*mult;

  let maxProfit,maxLoss;
  if(position==='long'){
    maxLoss=totalPremium;
    maxProfit=(type==='call')?Infinity:Math.max(strike-premium,0)*mult;
  }else{
    maxProfit=totalPremium;
    maxLoss=(type==='call')?Infinity:Math.max(strike-premium,0)*mult;
  }

  const intrinsicTarget=intrinsicAt(target);
  const targetPL=position==='long'?(intrinsicTarget-premium)*mult:(premium-intrinsicTarget)*mult;

  const se=(id,v)=>{const e=gel(id);if(e)e.textContent=v;};
  se('op-breakeven',f$(breakeven));
  se('op-maxprofit',isFinite(maxProfit)?f$(maxProfit):'Unlimited');
  se('op-maxloss',isFinite(maxLoss)?f$(maxLoss):'Unlimited');
  const targetEl=gel('op-targetpl');
  if(targetEl){targetEl.textContent=(targetPL<0?'-':'')+f$(Math.abs(targetPL));targetEl.style.color=targetPL>=0?'var(--g)':'var(--r)';}
  se('op-totalpremium',f$(totalPremium));

  const rangeLow=strike*0.6,rangeHigh=strike*1.4,steps=40,vals=[];
  for(let i=0;i<=steps;i++){
    const price=rangeLow+(rangeHigh-rangeLow)*i/steps;
    const intr=intrinsicAt(price);
    const pl=position==='long'?(intr-premium)*mult:(premium-intr)*mult;
    vals.push(pl);
  }
  drawLine('op-chart',[{data:vals,color:position==='long'?'#0F4F35':'#8C2E22',fill:true}],175);

  const insights=[];
  const posLabel=position==='long'?'Long':'Short',typeLabel=type==='call'?'Call':'Put';
  insights.push({type:'neutral',text:`This ${posLabel} ${typeLabel} breaks even at a stock price of <strong>${f$(breakeven)}</strong>.`});
  if(!isFinite(maxLoss)){
    insights.push({type:'bad',text:`This position has <strong>unlimited</strong> theoretical loss potential — risk grows without a cap as the stock price moves against the position.`});
  }
  if(!isFinite(maxProfit)){
    insights.push({type:'good',text:`This position has <strong>unlimited</strong> theoretical profit potential above the breakeven price.`});
  }
  insights.push({type:targetPL>=0?'good':'bad',text:`At your target price of <strong>${f$(target)}</strong>, this position would show a <strong>${targetPL>=0?'profit':'loss'}</strong> of <strong>${f$(Math.abs(targetPL))}</strong>.`});
  renderInsights('op-insights',insights);
}
function cStock(){
  const sh=+gel('sk-sh').value||0,buy=+gel('sk-buy').value||0,sell=+gel('sk-sell').value||0,bc=(+gel('sk-bc').value||0)/100,sc=(+gel('sk-sc').value||0)/100,days=+gel('sk-days').value||1;
  const bt=sh*buy,st=sh*sell,bc_=bt*bc,sc_=st*sc,pnl=st-bt-bc_-sc_,ret=bt?pnl/bt*100:0,ann=(Math.pow(1+ret/100,365/days)-1)*100,bep=buy*(1+bc)/(1-sc);
  const pE=gel('sk-pnl');pE.textContent=f$(pnl);pE.style.color=pnl>=0?'var(--g)':'var(--r)';
  gel('sk-ret').textContent=pct(ret);gel('sk-ret').style.color=ret>=0?'var(--g)':'var(--r)';
  gel('sk-ann').textContent=pct(ann);gel('sk-ann').style.color=ann>=0?'var(--g)':'var(--r)';
  gel('sk-comm').textContent=f$(bc_+sc_);gel('sk-bt').textContent=f$(bt);gel('sk-st').textContent=f$(st);
  gel('sk-bep').textContent='$'+bep.toFixed(2);

  const insights=[];
  const feeDragPct=bt?((bc_+sc_)/bt*100):0;
  if(pnl>=0){
    insights.push({type:'good',text:`This trade made <strong>${f$(pnl)}</strong> (<strong>${pct(ret)}</strong>) over <strong>${days} days</strong> — annualized, that's roughly <strong>${pct(ann)}</strong>.`});
  }else{
    const lossPct=Math.abs(ret)/100,recoveryNeeded=lossPct<1?lossPct/(1-lossPct)*100:Infinity;
    insights.push({type:'bad',text:`This trade lost <strong>${f$(Math.abs(pnl))}</strong> (<strong>${pct(ret)}</strong>) — a position down this much needs a <strong>${isFinite(recoveryNeeded)?recoveryNeeded.toFixed(1)+'%':'very large'}</strong> gain just to get back to even, since losses and gains aren't symmetric.`});
  }
  if(feeDragPct>1)insights.push({type:'neutral',text:`Brokerage fees ate <strong>${f$(bc_+sc_)}</strong> of this trade — about <strong>${feeDragPct.toFixed(1)}%</strong> of your buy cost.`});
  if(days<365)insights.push({type:'neutral',text:`Held for <strong>${days} days</strong> — under a year, so this gain would typically be taxed as a <strong>short-term</strong> capital gain at your ordinary income rate, not the lower long-term rate.`});
    insights.push({type:'neutral',text:`Want a longer-term view instead of a single trade? The <a href="/cagr" style="color:var(--a);text-decoration:underline">CAGR</a> calculator shows your annualized growth rate over multiple years.`});
  renderInsights('sk-insights',insights);
}

// ── Stock Split ──────────────────────────────────────────────────
function cSplit(){
  const sh=+gel('sp-sh').value||0,price=+gel('sp-price').value||0;
  const newR=+gel('sp-new').value||1,oldR=+gel('sp-old').value||1;
  const basis=+gel('sp-basis').value||0;
  const ratio=newR/oldR;
  const newSh=sh*ratio;
  const newPrice=ratio?price/ratio:price;
  const valueBefore=sh*price,valueAfter=newSh*newPrice;
  const newBasis=ratio?basis/ratio:basis;

  gel('sp-newsh').textContent=(Number.isInteger(newSh)?newSh:newSh.toFixed(2)).toString();
  gel('sp-newprice').textContent='$'+newPrice.toFixed(2);
  gel('sp-value').textContent=f$(valueAfter);
  gel('sp-newbasis').textContent='$'+newBasis.toFixed(2);
  gel('sp-vbefore').textContent=f$(valueBefore);
  gel('sp-vafter').textContent=f$(valueAfter);
  gel('sp-ratio').textContent=(newR>=oldR?`${newR}-for-${oldR}`:`${newR}-for-${oldR} (reverse)`);

  const insights=[];
  const isReverse=newR<oldR;
  insights.push({type:'neutral',text:isReverse
    ? `This is a <strong>reverse split</strong> — every <strong>${oldR}</strong> old shares become <strong>${newR}</strong> new share${newR===1?'':'s'}. Your <strong>${sh}</strong> shares become <strong>${newSh.toFixed(newSh%1?2:0)}</strong> shares at roughly <strong>$${newPrice.toFixed(2)}</strong> each.`
    : `Every <strong>${oldR}</strong> old share${oldR===1?'':'s'} becomes <strong>${newR}</strong> new shares. Your <strong>${sh}</strong> shares become <strong>${newSh.toFixed(newSh%1?2:0)}</strong> shares at roughly <strong>$${newPrice.toFixed(2)}</strong> each.`});
  insights.push({type:'good',text:`Total value is unchanged: <strong>${f$(valueBefore)}</strong> before and after — a split doesn't create or destroy any value, it only changes how many pieces it's divided into.`});
  if(newSh%1!==0){
    insights.push({type:'bad',text:`Your new share count isn't a whole number — brokers typically pay <strong>cash-in-lieu</strong> for the fractional remainder rather than issuing a partial share, and that cash payout is generally a taxable event.`});
  }
  if(basis>0){
    insights.push({type:'neutral',text:`Your cost basis <strong>per share</strong> adjusts from <strong>$${basis.toFixed(2)}</strong> to <strong>$${newBasis.toFixed(2)}</strong> — but your <em>total</em> cost basis of <strong>${f$(sh*basis)}</strong> stays the same, just spread across the new share count.`});
  }
  renderInsights('sp-insights',insights);
}

// ── Retirement ───────────────────────────────────────────────────
function ssFRAMonths(by){
  if(by<=1937)return 65*12;
  if(by===1938)return 65*12+2;
  if(by===1939)return 65*12+4;
  if(by===1940)return 65*12+6;
  if(by===1941)return 65*12+8;
  if(by===1942)return 65*12+10;
  if(by>=1943&&by<=1954)return 66*12;
  if(by===1955)return 66*12+2;
  if(by===1956)return 66*12+4;
  if(by===1957)return 66*12+6;
  if(by===1958)return 66*12+8;
  if(by===1959)return 66*12+10;
  return 67*12;
}
function ssBenefitAtAge(claimAgeYears,fraMo,pia){
  const claimMo=claimAgeYears*12;
  const diff=claimMo-fraMo;
  if(diff<0){
    const earlyMonths=-diff;
    const first36=Math.min(earlyMonths,36),extra=Math.max(earlyMonths-36,0);
    const reduction=first36*(5/9)/100+extra*(5/12)/100;
    return pia*(1-Math.min(reduction,1));
  }else if(diff>0){
    const maxDelayMo=70*12-fraMo;
    const delayMonths=Math.min(diff,maxDelayMo);
    const increase=delayMonths*(2/3)/100;
    return pia*(1+increase);
  }
  return pia;
}
function calcSocialSecurity(){
  const pia=+gel('ss-pia').value||0;
  const birthYear=+gel('ss-birthyear').value||1990;
  const claimAgeRaw=+gel('ss-claimage').value||67;
  const claimClamped=Math.max(62,Math.min(70,claimAgeRaw));

  const fraMo=ssFRAMonths(birthYear);
  const fraYears=Math.floor(fraMo/12),fraRemMonths=fraMo%12;
  const benefit=ssBenefitAtAge(claimClamped,fraMo,pia);
  const benefit62=ssBenefitAtAge(62,fraMo,pia);
  const benefit70=ssBenefitAtAge(70,fraMo,pia);

  const se=(id,v)=>{const e=gel(id);if(e)e.textContent=v;};
  se('ss-fra',fraYears+(fraRemMonths?(' yr '+fraRemMonths+'mo'):' yr'));
  se('ss-benefit',f$(benefit)+'/mo');
  const vsFraPct=pia?((benefit/pia-1)*100):0;
  se('ss-vsfra',(vsFraPct>=0?'+':'')+vsFraPct.toFixed(1)+'%');
  se('ss-annual',f$(benefit*12));
  se('ss-age62',f$(benefit62)+'/mo');
  se('ss-agefra',f$(pia)+'/mo');
  se('ss-age70',f$(benefit70)+'/mo');

  let breakevenAge=null;
  if(benefit70>benefit62){
    breakevenAge=(70*benefit70-62*benefit62)/(benefit70-benefit62);
  }
  se('ss-breakeven',(breakevenAge&&isFinite(breakevenAge))?('~age '+breakevenAge.toFixed(0)):'—');

  const ages=[],vals=[];
  for(let a=62;a<=70;a++){ages.push(String(a));vals.push(ssBenefitAtAge(a,fraMo,pia));}
  drawBars('ss-chart',ages,vals,['#1B3A5C'],150);

  const insights=[];
  if(claimAgeRaw<62||claimAgeRaw>70){
    insights.push({type:'neutral',text:'Social Security can only be claimed between ages 62 and 70 — using the closest valid age for this calculation.'});
  }
  if(claimClamped*12<fraMo){
    insights.push({type:'neutral',text:`Claiming at ${claimClamped} is <strong>${Math.abs(vsFraPct).toFixed(1)}% lower</strong> than waiting until your Full Retirement Age of ${fraYears}${fraRemMonths?(' and '+fraRemMonths+' months'):''}, and that reduction is permanent for the life of the benefit.`});
  }else if(claimClamped*12>fraMo){
    insights.push({type:'good',text:`Claiming at ${claimClamped} is <strong>${vsFraPct.toFixed(1)}% higher</strong> than your Full Retirement Age benefit, thanks to delayed retirement credits.`});
  }
  if(breakevenAge){
    insights.push({type:'neutral',text:`Delaying from 62 to 70 breaks even in cumulative total (before investment growth or inflation) around age <strong>${breakevenAge.toFixed(0)}</strong> — collecting past that age means delaying paid off in total dollars received.`});
  }
  renderInsights('ss-insights',insights);
}
function cRetire(){
  const age=+gel('rt-age').value||30,ret=+gel('rt-ret').value||65,save=+gel('rt-save').value||0,contrib=+gel('rt-contrib').value||0;
  const rate=(+gel('rt-rate').value||0)/100,inf=(+gel('rt-inf').value||0)/100,exp=+gel('rt-exp').value||0,life=+gel('rt-life').value||85;
  const yrs=ret-age,rYrs=life-ret,mr=rate/12,n=yrs*12;
  const corpus=save*Math.pow(1+rate,yrs)+(mr?contrib*(Math.pow(1+mr,n)-1)/mr*(1+mr):contrib*n);
  const futExp=exp*Math.pow(1+inf,yrs),real=((1+rate)/(1+inf)-1)*100;
  const pvW=real/100>0?futExp*12*(1-Math.pow(1+real/100,-rYrs))/(real/100):futExp*12*rYrs;
  const surplus=corpus-pvW;
  gel('rt-corpus').textContent=f$(corpus);gel('rt-need').textContent=f$(futExp);gel('rt-yrs').textContent=yrs+' yrs';
  const sE=gel('rt-surplus');sE.textContent=f$(Math.abs(surplus));sE.style.color=surplus>=0?'var(--g)':'var(--r)';
  gel('rt-real').textContent=pct(real);
  const steps=10,d1=[],d2=[];
  for(let i=1;i<=steps;i++){const y2=yrs*i/steps,ni=y2*12,c=save*Math.pow(1+rate,y2)+(mr?contrib*(Math.pow(1+mr,ni)-1)/mr*(1+mr):contrib*ni);d1.push(save+contrib*12*y2);d2.push(c);}
  drawLine('rt-chart',[{data:d1,color:'#0F4F35',fill:true},{data:d2,color:'#F0B90B',fill:false,w:2.5}],140);

  const insights=[];
  const pctOver=pvW>0?(corpus/pvW-1)*100:0;
  const saveFV=save*Math.pow(1+rate,yrs);
  const contribK=mr?(Math.pow(1+mr,n)-1)/mr*(1+mr):n;
  if(surplus>=0){
    insights.push({type:'good',text:`You're on track — your projected corpus covers your retirement needs${pctOver>=1?` with <strong>${pctOver.toFixed(0)}%</strong> to spare`:''}.`});
    if(pctOver>=3 && contrib>0){
      const neededContrib=Math.max(0,(pvW-saveFV)/Math.max(contribK,1));
      const cutPct=Math.min(95,Math.max(0,(1-neededContrib/contrib)*100));
      if(cutPct>=3)insights.push({type:'neutral',text:`At this pace, you could reduce your monthly contribution to roughly <strong>${f$(neededContrib)}</strong> (about <strong>${cutPct.toFixed(0)}% less</strong>) and still reach your target.`});
    }
  }else{
    const shortfallPct=pvW>0?(-surplus/pvW*100):0;
    insights.push({type:'bad',text:`You're projected to fall short by <strong>${f$(Math.abs(surplus))}</strong> (about <strong>${shortfallPct.toFixed(0)}%</strong> of what you'll need).`});
    const neededContribFV=pvW-saveFV;
    if(contribK>0 && neededContribFV>0 && contrib>0){
      const neededContrib=neededContribFV/contribK;
      const increasePct=((neededContrib/contrib)-1)*100;
      if(isFinite(increasePct)&&increasePct>0)insights.push({type:'neutral',text:`Increasing your monthly contribution to roughly <strong>${f$(neededContrib)}</strong> (about <strong>+${increasePct.toFixed(0)}%</strong>) would close this gap.`});
    }
    insights.push({type:'neutral',text:`Retiring a few years later or trimming retirement expenses can also significantly reduce this shortfall.`});
  }
  if(real<2)insights.push({type:'bad',text:`Your real (inflation-adjusted) return is only <strong>${pct(real)}</strong> — inflation is eating most of your gains.`});
    insights.push({type:'neutral',text:`Considering retiring earlier than the traditional timeline? The <a href="/fire" style="color:var(--a);text-decoration:underline">FIRE</a> calculator uses a more conservative withdrawal rate suited to longer retirements.`});
  renderInsights('rt-insights',insights);
}

// ── FIRE Calculator ────────────────────────────────────────────
function cFire(){
  const income=+gel('fi-income').value||0,expenses=+gel('fi-expenses').value||0,nw=+gel('fi-networth').value||0;
  const ret=(+gel('fi-return').value||0)/100,inf=(+gel('fi-inflation').value||0)/100,swr=(+gel('fi-swr').value||4)/100;
  const real=(1+ret)/(1+inf)-1;
  const savings=Math.max(0,income-expenses),savingsRate=income>0?savings/income*100:0;
  const fiNumber=swr>0?expenses/swr:Infinity;

  let bal=nw,years=0;const hist=[nw];
  while(bal<fiNumber && years<75){bal=bal*(1+real)+savings;years++;hist.push(bal);}
  const reached=bal>=fiNumber;

  gel('fi-rate').textContent=pct(savingsRate);
  gel('fi-number').textContent=f$(fiNumber);
  gel('fi-years').textContent=reached?years+(years===1?' yr':' yrs'):'75+ yrs';
  const today=new Date();const fiDate=new Date(today.getFullYear()+years,today.getMonth());
  gel('fi-date').textContent=reached?fiDate.toLocaleDateString('en-US',{month:'short',year:'numeric'}):'Beyond 75 yrs';
  const progressPct=fiNumber>0?Math.min(100,nw/fiNumber*100):0;
  gel('fi-pct').textContent=pct(progressPct);gel('fi-pbar').style.width=progressPct+'%';

  drawLine('fi-chart',[{data:hist.slice(0,Math.min(hist.length,60)),color:'#0F4F35',fill:true},{data:hist.slice(0,Math.min(hist.length,60)).map(()=>fiNumber),color:'#F0B90B',fill:false,dash:[5,4]}],160);

  // FIRE variants
  const baristaIncome=expenses*0.33; // assume part-time covers ~1/3 of expenses by default
  const variants=[
    {name:'Lean FIRE',exp:expenses*0.67},
    {name:'Regular FIRE',exp:expenses},
    {name:'Fat FIRE',exp:expenses*2},
    {name:'Barista FIRE',exp:Math.max(0,expenses-baristaIncome)},
  ];
  let vRows='<thead><tr><th style="text-align:left">Variant</th><th>FI Number</th><th>Years</th></tr></thead><tbody>';
  variants.forEach(v=>{
    const vTarget=swr>0?v.exp/swr:Infinity;
    let vBal=nw,vYears=0;
    while(vBal<vTarget && vYears<75){vBal=vBal*(1+real)+savings;vYears++;}
    vRows+=`<tr><td style="text-align:left;font-weight:500">${v.name}</td><td style="font-family:var(--mo);color:var(--a)">${f$(vTarget)}</td><td style="font-family:var(--mo)">${vYears<75?vYears+'y':'75+'}</td></tr>`;
  });
  // Coast FIRE row
  const coastYears=20;
  const coastNumber=fiNumber/Math.pow(1+real,coastYears);
  vRows+=`<tr><td style="text-align:left;font-weight:500">Coast FIRE*</td><td style="font-family:var(--mo);color:var(--a)">${f$(coastNumber)}</td><td style="font-family:var(--mo)">${coastYears}y</td></tr>`;
  vRows+='</tbody>';
  gel('fi-variants').innerHTML=vRows;
  const noteEl=gel('fi-variants-note');
  if(noteEl)noteEl.textContent=noteEl.dataset.tpl.replace('$BARISTA',f$(baristaIncome).replace('$',''));

  const insights=[];
  if(savingsRate<15){
    insights.push({type:'bad',text:`Your savings rate is <strong>${pct(savingsRate)}</strong> — at this rate, reaching FI will take a very long time. Even a modest increase compounds into a much shorter timeline.`});
  }else if(savingsRate>=50){
    insights.push({type:'good',text:`A <strong>${pct(savingsRate)}</strong> savings rate is excellent — you're on one of the fastest realistic paths to financial independence.`});
  }else{
    insights.push({type:'neutral',text:`Your savings rate of <strong>${pct(savingsRate)}</strong> puts you on a <strong>${reached?years+'-year':'multi-decade'}</strong> path to FI at a ${pct(real*100)} real return.`});
  }
  if(reached && years>0){
    let bal10=nw,y10=Math.max(0,years-5),savingsUp=savings*1.1;
    let balUp=nw,yUp=0;
    while(balUp<fiNumber && yUp<75){balUp=balUp*(1+real)+savingsUp;yUp++;}
    const yearsSaved=years-yUp;
    if(yearsSaved>=1)insights.push({type:'neutral',text:`Increasing your savings by just <strong>10%</strong> (roughly <strong>${f$(savings*0.1)}/yr</strong> more) would reach FI about <strong>${yearsSaved} year${yearsSaved!==1?'s':''} sooner</strong>.`});
  }
  if(progressPct>=100){
    insights.push({type:'good',text:`Your current net worth already covers your FI number — you may have already reached financial independence.`});
  }else if(progressPct>=10){
    insights.push({type:'neutral',text:`You're <strong>${pct(progressPct)}</strong> of the way to your FI number based on current net worth alone, before counting future growth.`});
  }
    insights.push({type:'neutral',text:`Want the more traditional 25x/4%-rule version of this calculation instead? The <a href="/retirement" style="color:var(--a);text-decoration:underline">Retirement</a> calculator uses that standard baseline.`});
  renderInsights('fi-insights',insights);
}

// ── Debt Payoff ──────────────────────────────────────────────────
let bsPeople=[{name:'Person 1'},{name:'Person 2'}];
let bsItems=[];
const BS_EXAMPLE_PEOPLE=[{name:'Alex'},{name:'Sam'},{name:'Jordan'}];
const BS_EXAMPLE_ITEMS=[{desc:'Ribeye Steak',price:32,person:0},{desc:'Caesar Salad',price:12,person:1},{desc:'Fries (shared)',price:8,person:-1}];
function renderBSPeople(){
  const el=gel('bs-people-rows');if(!el)return;el.innerHTML='';
  bsPeople.forEach((p,i)=>{
    el.innerHTML+=`<div style="display:grid;grid-template-columns:1fr 36px;gap:8px;margin-bottom:6px;align-items:center">
      <input type="text" value="${p.name}" oninput="bsPeople[${i}].name=this.value;calcBillSplit()" style="background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-size:13px;outline:none;width:100%">
      <button class="btn-del" aria-label="Remove person ${(p.name||('person '+(i+1))).replace(/"/g,'&quot;')}" onclick="removeBSPerson(${i})">✕</button>
    </div>`;
  });
  renderBSItems();
}
function addBSPerson(){bsPeople.push({name:'Person '+(bsPeople.length+1)});renderBSPeople();}
function removeBSPerson(i){
  bsPeople.splice(i,1);
  bsItems.forEach(it=>{
    if(it.person===i)it.person=-1;
    else if(it.person>i)it.person--;
  });
  renderBSPeople();
}
function renderBSItems(){
  const el=gel('bs-items-rows');if(!el)return;el.innerHTML='';
  bsItems.forEach((it,i)=>{
    const options=bsPeople.map((p,pi)=>`<option value="${pi}" ${it.person===pi?'selected':''}>${p.name}</option>`).join('')+`<option value="-1" ${it.person===-1?'selected':''}>Split Evenly</option>`;
    el.innerHTML+=`<div class="row-bs" style="margin-bottom:6px;align-items:center">
      <input type="text" value="${it.desc}" oninput="bsItems[${i}].desc=this.value;calcBillSplit()" style="background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-size:13px;outline:none;width:100%">
      <div class="ip"><span class="pfx">$</span><input type="text" inputmode="decimal" value="${it.price}" oninput="bsItems[${i}].price=+this.value;calcBillSplit()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px 8px 8px 20px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none"></div>
      <select onchange="bsItems[${i}].person=+this.value;calcBillSplit()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-family:var(--fn);font-size:13px;outline:none">${options}</select>
      <button class="btn-del" aria-label="Remove item ${(it.desc||('item '+(i+1))).replace(/"/g,'&quot;')}" onclick="bsItems.splice(${i},1);renderBSItems();">✕</button>
    </div>`;
  });
  calcBillSplit();
  attachInputGuards();
}
function addBSItem(){bsItems.push({desc:'New Item',price:10,person:bsPeople.length?0:-1});renderBSItems();}
function calcBillSplit(){
  const taxEl=gel('bs-tax'),tipEl=gel('bs-tip'),basisEl=gel('bs-tipbasis');
  if(!taxEl||!tipEl||!basisEl)return;
  const tax=+taxEl.value||0,tipPct=(+tipEl.value||0)/100,tipBasis=basisEl.value;
  const subtotal=bsItems.reduce((a,it)=>a+(it.price||0),0);
  const tipBase=tipBasis==='total'?subtotal+tax:subtotal;
  const tip=tipBase*tipPct;
  const grand=subtotal+tax+tip;

  const se=(id,v)=>{const e=gel(id);if(e)e.textContent=v;};
  se('bs-subtotal',f$(subtotal));
  se('bs-taxout',f$(tax));
  se('bs-tipout',f$(tip));
  se('bs-grandtotal',f$(grand));

  const n=bsPeople.length;
  const personItemTotal=bsPeople.map(()=>0);
  bsItems.forEach(it=>{
    const price=it.price||0;
    if(it.person===-1){
      if(n>0)personItemTotal.forEach((_,i)=>personItemTotal[i]+=price/n);
    }else if(it.person>=0&&it.person<n){
      personItemTotal[it.person]+=price;
    }
  });

  const breakdownEl=gel('bs-breakdown');
  if(breakdownEl){
    if(n===0){
      breakdownEl.innerHTML='<div style="color:var(--m);font-size:13px;padding:8px 0">Add at least one person to see the breakdown.</div>';
    }else{
      breakdownEl.innerHTML=bsPeople.map((p,i)=>{
        const share=subtotal>0?personItemTotal[i]/subtotal:1/n;
        const personTax=tax*share,personTip=tip*share,personTotal=personItemTotal[i]+personTax+personTip;
        return `<div class="rrow"><span class="rk">${p.name||('Person '+(i+1))}</span><span class="rv">${f$(personTotal)}</span></div>`;
      }).join('');
    }
  }

  const insights=[];
  if(n===0){
    insights.push({type:'neutral',text:'Add people above, then assign items to see a fair per-person breakdown.'});
  }else if(subtotal===0){
    insights.push({type:'neutral',text:'Add item prices above to calculate the split.'});
  }else{
    const sorted=personItemTotal.map((t,i)=>({name:bsPeople[i].name||('Person '+(i+1)),t})).sort((a,b)=>b.t-a.t);
    if(sorted.length>1&&sorted[0].t>0){
      insights.push({type:'neutral',text:`${sorted[0].name} ordered the most (<strong>${f$(sorted[0].t)}</strong> of items) and will pay a proportionally larger share of tax and tip too — an even split would have charged everyone the same regardless of what they ordered.`});
    }
    insights.push({type:'good',text:`Tip is calculated on the ${tipBasis==='total'?'subtotal + tax':'pre-tax subtotal'} (<strong>${f$(tipBase)}</strong>) at <strong>${(tipPct*100).toFixed(0)}%</strong>, for a total tip of <strong>${f$(tip)}</strong>.`});
  }
  renderInsights('bs-insights',insights);
}
let debts=[{name:'Credit Card',bal:8000,rate:22,min:200},{name:'Car Loan',bal:15000,rate:7,min:300},{name:'Student Loan',bal:25000,rate:5.5,min:280}];
const DEBT_EXAMPLE=[{name:'Credit Card',bal:8000,rate:22,min:200},{name:'Car Loan',bal:15000,rate:7,min:300},{name:'Student Loan',bal:25000,rate:5.5,min:280}];
function renderDebtRows(){
  const el=gel('debt-rows');el.innerHTML='';
  debts.forEach((d,i)=>{el.innerHTML+=`<div class="row-debt" style="margin-bottom:6px;align-items:center">
    <input type="text" value="${d.name}" oninput="debts[${i}].name=this.value;cDebt()" style="background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-size:13px;outline:none;width:100%">
    <div class="ip"><span class="pfx">$</span><input type="text" inputmode="decimal" value="${d.bal}" oninput="debts[${i}].bal=+this.value;cDebt()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px 8px 8px 20px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none"></div>
    <input type="text" inputmode="decimal" value="${d.rate}" step="0.1" oninput="debts[${i}].rate=+this.value;cDebt()" style="background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none;width:100%">
    <div class="ip"><span class="pfx">$</span><input type="text" inputmode="decimal" value="${d.min}" oninput="debts[${i}].min=+this.value;cDebt()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px 8px 8px 20px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none"></div>
    <button class="btn-del" aria-label="Remove debt ${(d.name||('debt '+(i+1))).replace(/"/g,'&quot;')}" onclick="debts.splice(${i},1);renderDebtRows()">✕</button>
  </div>`;});cDebt();attachInputGuards();
}
function addDebt(){debts.push({name:'New Debt',bal:5000,rate:10,min:100});renderDebtRows();}
function cDebt(){
  const extra=+gel('dp-extra').value||0,strat=gel('dp-strat').value;
  const td=debts.reduce((a,d)=>a+d.bal,0);gel('dp-total').textContent=f$(td);
  let ds=debts.map(d=>({...d,b:d.bal}));let mo=0,totInt=0,pm=debts.map(()=>null),bH=[];
  while(ds.some(d=>d.b>0)&&mo<600){
    mo++;ds.forEach(d=>{if(d.b>0){const mi=d.b*d.rate/100/12;totInt+=mi;d.b+=mi-d.min;if(d.b<0)d.b=0;}});
    let s=[...ds].filter(d=>d.b>0);s.sort(strat==='avalanche'?(a,b)=>b.rate-a.rate:(a,b)=>a.b-b.b);
    let left=extra;s.forEach(d=>{if(left<=0||d.b<=0)return;const p=Math.min(left,d.b);d.b-=p;left-=p;});
    ds.forEach((d,i)=>{if(d.b<=0&&pm[i]===null)pm[i]=mo;});
    if(mo%3===0)bH.push(ds.reduce((a,d)=>a+d.b,0));
  }
  let ds2=debts.map(d=>({...d,b:d.bal}));let m2=0,ti2=0;
  while(ds2.some(d=>d.b>0)&&m2<600){m2++;ds2.forEach(d=>{if(d.b>0){const mi=d.b*d.rate/100/12;ti2+=mi;d.b+=mi-d.min;if(d.b<0)d.b=0;}});}
  gel('dp-months').textContent=mo+' mo ('+(mo/12).toFixed(1)+' yrs)';
  gel('dp-int').textContent=f$(totInt);gel('dp-saved').textContent=f$(Math.max(0,ti2-totInt));
  const tl=gel('dp-timeline');tl.innerHTML='';
  debts.forEach((d,i)=>{tl.innerHTML+=`<div class="tl-i"><div class="tl-lbl">${d.name}</div><div style="font-family:var(--mo);font-weight:500">Paid off month ${pm[i]||mo}</div></div>`;});
  tl.innerHTML+=`<div class="tl-i" style="--dot:var(--g)"><div class="tl-lbl" style="color:var(--g)">🎉 Debt Free!</div><div style="font-family:var(--mo);font-weight:500;color:var(--g)">Month ${mo}</div></div>`;
  drawLine('dp-chart',[{data:bH.slice(0,20),color:'#F0B90B',fill:true}],140);

  const insights=[];
  const saved=Math.max(0,ti2-totInt);
  if(extra>0){
    insights.push({type:'good',text:`Paying an extra <strong>${f$(extra)}/mo</strong> beyond minimums saves you <strong>${f$(saved)}</strong> in interest and gets you debt-free in <strong>${(mo/12).toFixed(1)} years</strong> instead of <strong>${(m2/12).toFixed(1)} years</strong>.`});
  }else{
    insights.push({type:'bad',text:`Paying only minimums means you'll be in debt for <strong>${(mo/12).toFixed(1)} years</strong> and pay <strong>${f$(totInt)}</strong> in interest. Even a small extra payment each month would help significantly.`});
  }
  if(debts.length>1){
    const highest=[...debts].sort((a,b)=>b.rate-a.rate)[0];
    const otherStrat=strat==='avalanche'?'snowball':'avalanche';
    insights.push({type:'neutral',text:`Your highest-rate debt is <strong>${highest.name}</strong> at <strong>${highest.rate}%</strong> — the ${strat} method prioritizes ${strat==='avalanche'?'this one first':'your smallest balance first, which may not be this one'}.`});
  }
    insights.push({type:'neutral',text:`Want to compare snowball vs avalanche side by side before committing to one? The <a href="/debtcomp" style="color:var(--a);text-decoration:underline">Snowball vs Avalanche</a> calculator shows both at once.`});
  renderInsights('dp-insights',insights);
}

// ── Rental Yield ─────────────────────────────────────────────────
function cRental(){
  const price=+gel('ry-price').value||0,down=(+gel('ry-down').value||0)/100,rent=+gel('ry-rent').value||0,mr=(+gel('ry-mrate').value||0)/12/100,mn=(+gel('ry-myrs').value||30)*12,vac=(+gel('ry-vac').value||0)/100,costs=+gel('ry-costs').value||0;
  const loan=price*(1-down),emi=mr?loan*mr*Math.pow(1+mr,mn)/(Math.pow(1+mr,mn)-1):loan/mn;
  const effRent=rent*(1-vac),annRent=effRent*12,noi=annRent-costs,cf=noi-emi*12;
  const tinv=price*down,grossY=price?annRent/price*100:0,netY=price?noi/price*100:0,coc=tinv?cf/tinv*100:0,cap=price?noi/price*100:0;
  gel('ry-gross').textContent=pct(grossY);gel('ry-net').textContent=pct(netY);
  gel('ry-coc').textContent=pct(coc);gel('ry-coc').style.color=coc>=0?'var(--g)':'var(--r)';
  gel('ry-cf').textContent=f$(cf/12);gel('ry-cf').style.color=cf>=0?'var(--g)':'var(--r)';
  gel('ry-cap').textContent=pct(cap);gel('ry-mort').textContent=f$(emi);gel('ry-inv').textContent=f$(tinv);
  drawLine('ry-chart',[{data:Array.from({length:11},(_,i)=>price*Math.pow(1.04,i)),color:'#F0B90B',fill:true},{data:Array.from({length:11},(_,i)=>annRent*i),color:'#0F4F35',fill:false}],155);

  const insights=[];
  const yieldGap=grossY-netY;
  if(yieldGap>1)insights.push({type:'neutral',text:`Operating costs and vacancy eat <strong>${yieldGap.toFixed(1)} points</strong> off your yield — gross looks like <strong>${pct(grossY)}</strong>, but net is really <strong>${pct(netY)}</strong>.`});
  if(cf>=0){
    insights.push({type:'good',text:`This property is <strong>cash flow positive</strong> by about <strong>${f$(cf/12)}/mo</strong> after the mortgage payment.`});
  }else{
    insights.push({type:'bad',text:`This property is <strong>cash flow negative</strong> by about <strong>${f$(Math.abs(cf/12))}/mo</strong> — you'd be paying out of pocket every month despite collecting rent.`});
  }
  if(cap<5)insights.push({type:'neutral',text:`A <strong>${pct(cap)}</strong> cap rate is below the commonly cited <strong>5%</strong> benchmark many investors look for.`});
  else insights.push({type:'good',text:`A <strong>${pct(cap)}</strong> cap rate clears the commonly cited <strong>5%</strong> benchmark many investors look for.`});
    insights.push({type:'neutral',text:`Evaluating whether to buy this property in the first place? The <a href="/rentalprop" style="color:var(--a);text-decoration:underline">Rental Property</a> calculator analyzes cap rate and cash-on-cash return for a purchase decision.`});
  renderInsights('ry-insights',insights);
}

// ── Cash Flow ────────────────────────────────────────────────────
let cfIncome=[{name:'Salary',amt:8000,freq:'monthly'},{name:'Freelance',amt:2000,freq:'monthly'}];
let cfExpense=[{name:'Rent/Mortgage',amt:2000,freq:'monthly'},{name:'Food & Groceries',amt:800,freq:'monthly'},{name:'Transportation',amt:400,freq:'monthly'},{name:'Utilities',amt:200,freq:'monthly'},{name:'Entertainment',amt:300,freq:'monthly'}];
const CF_EXAMPLE_INCOME=[{name:'Salary',amt:8000,freq:'monthly'},{name:'Freelance',amt:2000,freq:'monthly'}];
const CF_EXAMPLE_EXPENSE=[{name:'Rent/Mortgage',amt:2000,freq:'monthly'},{name:'Food & Groceries',amt:800,freq:'monthly'},{name:'Transportation',amt:400,freq:'monthly'},{name:'Utilities',amt:200,freq:'monthly'},{name:'Entertainment',amt:300,freq:'monthly'}];
const FM={monthly:1,weekly:4.33,biweekly:2.17,annually:1/12};
function renderCFRows(){
  gel('cf-i-rows').innerHTML='';cfIncome.forEach((r,i)=>{gel('cf-i-rows').innerHTML+=cfRowHtml('i',i,r);});
  gel('cf-e-rows').innerHTML='';cfExpense.forEach((r,i)=>{gel('cf-e-rows').innerHTML+=cfRowHtml('e',i,r);});
  cCF();
  attachInputGuards();
}
function cfRowHtml(type,i,r){
  const arr=type==='i'?'cfIncome':'cfExpense';
  return`<div class="row-cf" style="margin-bottom:6px;align-items:center">
    <input type="text" value="${r.name}" oninput="${arr}[${i}].name=this.value;cCF()" style="background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-size:13px;outline:none;width:100%">
    <div class="ip"><span class="pfx">$</span><input type="text" inputmode="decimal" value="${r.amt}" oninput="${arr}[${i}].amt=+this.value;cCF()" style="width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px 8px 8px 20px;color:var(--t);font-family:var(--mo);font-size:13px;outline:none"></div>
    <select onchange="${arr}[${i}].freq=this.value;cCF()" style="background:var(--bg);border:1px solid var(--bd);border-radius:6px;padding:8px;color:var(--t);font-size:12px;outline:none;width:100%">
      <option value="monthly" ${r.freq==='monthly'?'selected':''}>Monthly</option>
      <option value="weekly" ${r.freq==='weekly'?'selected':''}>Weekly</option>
      <option value="biweekly" ${r.freq==='biweekly'?'selected':''}>Bi-weekly</option>
      <option value="annually" ${r.freq==='annually'?'selected':''}>Annual</option>
    </select>
    <button class="btn-del" aria-label="Remove ${(r.name||('entry '+(i+1))).replace(/"/g,'&quot;')}" onclick="${arr}.splice(${i},1);renderCFRows()">✕</button>
  </div>`;
}
function addCF(type){if(type==='i')cfIncome.push({name:'New Income',amt:1000,freq:'monthly'});else cfExpense.push({name:'New Expense',amt:200,freq:'monthly'});renderCFRows();}
function cCF(){
  const ti=cfIncome.reduce((a,r)=>a+r.amt*(FM[r.freq]||1),0);
  const te=cfExpense.reduce((a,r)=>a+r.amt*(FM[r.freq]||1),0);
  const net=ti-te,sr=ti>0?net/ti*100:0;
  gel('cf-inc').textContent=f$(ti);gel('cf-exp').textContent=f$(te);
  const nE=gel('cf-net');nE.textContent=f$(net);nE.style.color=net>=0?'var(--g)':'var(--r)';
  gel('cf-sr').textContent=pct(sr);gel('cf-sr').style.color=sr>=20?'var(--g)':sr>=10?'var(--a)':'var(--r)';
  drawBars('cf-chart',['Income','Expenses','Net'],[ti,te,Math.max(0,net)],['#0F4F35','#8C2E22','#F0B90B'],135);
  const bars=gel('cf-bars');bars.innerHTML='';
  cfExpense.forEach(r=>{const mo=r.amt*(FM[r.freq]||1),p_=te>0?mo/te*100:0;bars.innerHTML+=`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span>${r.name}</span><span style="font-family:var(--mo);color:var(--m)">${f$(mo)} (${p_.toFixed(0)}%)</span></div><div class="pbar-bg"><div class="pbar-fill" style="width:${p_.toFixed(1)}%;background:${p_>40?'var(--r)':p_>20?'var(--a)':'var(--b)'}"></div></div></div>`;});

  const insights=[];
  if(net<0){
    insights.push({type:'bad',text:`You're spending <strong>${f$(Math.abs(net))}</strong> more than you earn each month — this isn't sustainable without dipping into savings or debt.`});
  }else{
    insights.push({type:sr>=20?'good':sr>=10?'neutral':'bad',text:`You're saving <strong>${pct(sr)}</strong> of your income (<strong>${f$(net)}/mo</strong>) — ${sr>=20?'above the commonly recommended 20% target':sr>=10?'below the commonly recommended 20% target, but still positive':'well below the commonly recommended 20% target'}.`});
  }
  const biggest=[...cfExpense].sort((a,b)=>(b.amt*(FM[b.freq]||1))-(a.amt*(FM[a.freq]||1)))[0];
  if(biggest){
    const biggestPct=te>0?(biggest.amt*(FM[biggest.freq]||1))/te*100:0;
    if(biggestPct>35)insights.push({type:'neutral',text:`<strong>${biggest.name}</strong> is your largest expense at <strong>${biggestPct.toFixed(0)}%</strong> of total spending — worth a closer look if you need to free up cash flow.`});
  }
    insights.push({type:'neutral',text:`Want a single score summarizing your overall financial position, not just this month's flow? Try the <a href="/healthscore" style="color:var(--a);text-decoration:underline">Financial Health Score</a>.`});
  renderInsights('cf-insights',insights);
}

// ── Break-even ───────────────────────────────────────────────────
function cBE(){
  const fc=+gel('be-fc').value||0,sp=+gel('be-sp').value||1,vc=+gel('be-vc').value||0,eu=+gel('be-eu').value||0;
  const cm=sp-vc,beu=cm>0?Math.ceil(fc/cm):Infinity,profit=cm*eu-fc,mos=eu>0&&isFinite(beu)?Math.max(0,(eu-beu)/eu*100):0;
  gel('be-beu').textContent=isFinite(beu)?Math.round(beu)+' units':'∞';gel('be-ber').textContent=isFinite(beu)?f$(beu*sp):'∞';
  gel('be-prof').textContent=f$(profit);gel('be-prof').style.color=profit>=0?'var(--g)':'var(--r)';
  gel('be-mos').textContent=pct(mos);gel('be-cm').textContent=f$(cm)+'/unit';gel('be-gm').textContent=pct(sp>0?cm/sp*100:0);
  gel('be-ol').textContent=(profit>0?(cm*eu)/profit:0).toFixed(1)+'x';
  const s=8,p1=[],p2=[];for(let i=1;i<=s;i++){const u=eu*2*i/s;p1.push(fc);p2.push(sp*u);}
  drawLine('be-chart',[{data:p1,color:'#8C2E22',fill:false},{data:p2,color:'#0F4F35',fill:false,w:2.5}],175);

  const insights=[];
  if(isFinite(beu)){
    if(eu>=beu){
      insights.push({type:'good',text:`Selling <strong>${eu.toLocaleString()} units</strong> puts you <strong>${Math.round(eu-beu).toLocaleString()} units</strong> past break-even (<strong>${Math.round(beu).toLocaleString()}</strong> needed) — a <strong>${pct(mos)}</strong> margin of safety.`});
    }else{
      insights.push({type:'bad',text:`At <strong>${eu.toLocaleString()} units</strong>, you're <strong>${Math.round(beu-eu).toLocaleString()} units short</strong> of the <strong>${Math.round(beu).toLocaleString()}</strong> needed to break even.`});
    }
  }else{
    insights.push({type:'bad',text:`Your contribution margin is zero or negative — no volume of sales will reach break-even until your price exceeds your variable cost per unit.`});
  }
  if(cm>0){
    const priceUp5=sp*1.05,cmUp5=priceUp5-vc,beuUp5=Math.ceil(fc/cmUp5);
    const beuDrop=beu-beuUp5;
    if(beuDrop>0)insights.push({type:'neutral',text:`A <strong>5% price increase</strong> would lower your break-even point to roughly <strong>${beuUp5.toLocaleString()} units</strong> — ${beuDrop.toLocaleString()} fewer units needed.`});
  }
    insights.push({type:'neutral',text:`Want to check your runway alongside this break-even point? The <a href="/burnrate" style="color:var(--a);text-decoration:underline">Burn Rate</a> calculator shows how many months you have to reach it.`});
  renderInsights('be-insights',insights);
}

// ── Currency ─────────────────────────────────────────────────────
const EXR_API_KEY='5908540a603b886de099390d';
const RATES_FALLBACK={USD:1,EUR:0.92,GBP:0.79,JPY:149.5,CNY:7.24,CAD:1.36,AUD:1.53,CHF:0.88,INR:83.2,SGD:1.34,AED:3.67,SAR:3.75,MYR:4.68,THB:35.8,KWD:0.307};
let RATES={...RATES_FALLBACK};
let ratesLive=false,ratesUpdated=null;
const CU_CACHE_KEY='fincalc_fx_rates_v1',CU_CACHE_MS=24*60*60*1000;

function renderCurrencyStatus(){
  const el=gel('cu-status');if(!el)return;
  if(ratesLive&&ratesUpdated){
    el.innerHTML=`<span style="color:var(--g)">●</span> Live rates as of ${ratesUpdated.toLocaleString()}`;
  }else{
    el.innerHTML=`<span style="color:var(--m)">●</span> Live rates unavailable right now — showing approximate reference rates`;
  }
}
function buildCurrencyGrid(){
  const grid=gel('cu-grid');if(!grid)return;
  grid.innerHTML='';
  ['EUR','GBP','JPY','CAD','AUD','INR','SGD','AED'].forEach(c=>{grid.innerHTML+=`<div class="sbox"><div class="lbl">USD → ${c}</div><div class="val" style="font-size:13px">${(RATES[c]||0).toFixed(4)}</div></div>`;});
}
async function loadLiveRates(){
  try{
    const cached=JSON.parse(localStorage.getItem(CU_CACHE_KEY)||'null');
    if(cached&&Date.now()-cached.ts<CU_CACHE_MS){
      RATES=cached.rates;ratesLive=true;ratesUpdated=new Date(cached.ts);
      renderCurrencyStatus();cCurrency();buildCurrencyGrid();
      return;
    }
  }catch(e){}
  try{
    const res=await fetch(`https://v6.exchangerate-api.com/v6/${EXR_API_KEY}/latest/USD`);
    const data=await res.json();
    if(data.result!=='success')throw new Error('API returned an error');
    const live={USD:1};
    Object.keys(RATES_FALLBACK).forEach(k=>{if(typeof data.conversion_rates[k]==='number')live[k]=data.conversion_rates[k];});
    RATES=live;ratesLive=true;ratesUpdated=new Date();
    try{localStorage.setItem(CU_CACHE_KEY,JSON.stringify({rates:RATES,ts:Date.now()}));}catch(e){}
  }catch(e){
    RATES={...RATES_FALLBACK};ratesLive=false;ratesUpdated=null;
  }
  renderCurrencyStatus();cCurrency();buildCurrencyGrid();
}
function buildCurrency(){
  const from=gel('cu-from'),to=gel('cu-to');
  Object.keys(RATES_FALLBACK).forEach(k=>{from.innerHTML+=`<option value="${k}">${k}</option>`;to.innerHTML+=`<option value="${k}">${k}</option>`;});
  to.value='EUR';
  buildCurrencyGrid();cCurrency();renderCurrencyStatus();
  loadLiveRates();
}
function cCurrency(){
  const amt=+gel('cu-amt').value||0,f=gel('cu-from').value,t=gel('cu-to').value;
  const res=amt*(RATES[t]/RATES[f]);
  gel('cu-res').textContent=res.toFixed(4)+' '+t;
  gel('cu-lbl').textContent=`1 ${f} = ${(RATES[t]/RATES[f]).toFixed(4)} ${t}`;
}

// ── International Transfer Cost ────────────────────────────────
function renderRemitStatus(){
  const el=gel('rm-status');if(!el)return;
  if(ratesLive&&ratesUpdated){
    el.innerHTML=`<span style="color:var(--g)">●</span> Mid-market rate live as of ${ratesUpdated.toLocaleString()}`;
  }else{
    el.innerHTML=`<span style="color:var(--m)">●</span> Live rates unavailable right now — showing approximate reference rates`;
  }
}
async function loadRemitRates(){
  try{
    const cached=JSON.parse(localStorage.getItem(CU_CACHE_KEY)||'null');
    if(cached&&Date.now()-cached.ts<CU_CACHE_MS){
      RATES=cached.rates;ratesLive=true;ratesUpdated=new Date(cached.ts);
      renderRemitStatus();rmApplyMidRate();
      return;
    }
  }catch(e){}
  try{
    const res=await fetch(`https://v6.exchangerate-api.com/v6/${EXR_API_KEY}/latest/USD`);
    const data=await res.json();
    if(data.result!=='success')throw new Error('API returned an error');
    const live={USD:1};
    Object.keys(RATES_FALLBACK).forEach(k=>{if(typeof data.conversion_rates[k]==='number')live[k]=data.conversion_rates[k];});
    RATES=live;ratesLive=true;ratesUpdated=new Date();
    try{localStorage.setItem(CU_CACHE_KEY,JSON.stringify({rates:RATES,ts:Date.now()}));}catch(e){}
  }catch(e){
    RATES={...RATES_FALLBACK};ratesLive=false;ratesUpdated=null;
  }
  renderRemitStatus();rmApplyMidRate();
}
function rmApplyMidRate(){
  const f=gel('rm-from'),t=gel('rm-to');
  if(!f||!t)return;
  const mid=RATES[t.value]/RATES[f.value];
  const rateInput=gel('rm-rate');
  if(rateInput && (!rateInput.dataset.touched || +rateInput.value===0)){
    rateInput.value=(mid*0.975).toFixed(4);
  }
  cRemit();
}
function rmCurrencyChanged(){
  const f=gel('rm-from').value,t=gel('rm-to').value;
  gel('rm-from-lbl').textContent=f;
  gel('rm-to-lbl').textContent=t;
  const rateInput=gel('rm-rate');
  if(rateInput)rateInput.dataset.touched='';
  rmApplyMidRate();
}
function buildRemit(){
  const from=gel('rm-from'),to=gel('rm-to');
  Object.keys(RATES_FALLBACK).forEach(k=>{from.innerHTML+=`<option value="${k}">${k}</option>`;to.innerHTML+=`<option value="${k}">${k}</option>`;});
  to.value='EUR';
  gel('rm-from-lbl').textContent=from.value;
  gel('rm-to-lbl').textContent=to.value;
  const rateInput=gel('rm-rate');
  if(rateInput)rateInput.addEventListener('input',()=>{rateInput.dataset.touched='1';});
  loadRemitRates();
}
function cRemit(){
  const from=gel('rm-from'),to=gel('rm-to');
  if(!from||!to)return;
  const f=from.value,t=to.value;
  const amt=+gel('rm-amt').value||0;
  const fee=+gel('rm-fee').value||0;
  const mid=RATES[t]/RATES[f];
  let provRate=+gel('rm-rate').value||0;
  if(provRate<=0)provRate=mid;

  const amountAfterFee=Math.max(amt-fee,0);
  const received=amountAfterFee*provRate;
  const idealReceived=amt*mid;
  const totalCostTo=Math.max(idealReceived-received,0);
  const totalCostFrom=mid>0?totalCostTo/mid:0;
  const markupCostFrom=Math.max(totalCostFrom-fee,0);
  const markupPct=mid>0?Math.max((mid-provRate)/mid*100,0):0;
  const effRate=amt>0?received/amt:0;
  const costPct=amt>0?totalCostFrom/amt*100:0;

  gel('rm-received').textContent=received.toLocaleString('en-US',{maximumFractionDigits:2})+' '+t;
  gel('rm-cost').textContent='$'+totalCostFrom.toFixed(2);
  gel('rm-effrate').textContent=effRate.toFixed(4);
  gel('rm-costpct').textContent=costPct.toFixed(2)+'%';
  gel('rm-midrate').textContent=`1 ${f} = ${mid.toFixed(4)} ${t}`;
  gel('rm-provrate').textContent=`1 ${f} = ${provRate.toFixed(4)} ${t}`;
  gel('rm-feecost').textContent='$'+fee.toFixed(2);
  gel('rm-markupcost').textContent='$'+markupCostFrom.toFixed(2);
  gel('rm-markuppct').textContent=markupPct.toFixed(2)+'%';

  gel('rm-ideal').textContent=idealReceived.toLocaleString('en-US',{maximumFractionDigits:2})+' '+t;
  gel('rm-actual').textContent=received.toLocaleString('en-US',{maximumFractionDigits:2})+' '+t;

  const insights=[];
  if(markupPct>=2){
    insights.push({type:'bad',text:`The exchange rate offered includes a hidden markup of about <strong>${markupPct.toFixed(1)}%</strong> vs the mid-market rate — that's costing you roughly <strong>$${markupCostFrom.toFixed(2)}</strong> beyond the visible fee, often the bigger part of the total cost.`});
  }else if(markupPct<=0.5){
    insights.push({type:'good',text:`The exchange rate offered is close to the true mid-market rate (<strong>${markupPct.toFixed(2)}%</strong> markup) — this is a competitive rate.`});
  }else{
    insights.push({type:'neutral',text:`The exchange rate offered has a moderate markup of about <strong>${markupPct.toFixed(1)}%</strong> vs the mid-market rate.`});
  }
  if(fee>0){
    insights.push({type:'neutral',text:`On top of the rate markup, this provider charges a visible fee of <strong>$${fee.toFixed(2)}</strong>. Total cost combining both is <strong>$${totalCostFrom.toFixed(2)}</strong> (<strong>${costPct.toFixed(1)}%</strong> of the amount sent).`});
  }
  if(amt>0){
    insights.push({type:'neutral',text:`At the true mid-market rate with no fee, your recipient would get <strong>${idealReceived.toLocaleString('en-US',{maximumFractionDigits:2})} ${t}</strong> instead of <strong>${received.toLocaleString('en-US',{maximumFractionDigits:2})} ${t}</strong> — always compare a few providers' actual quoted rates before sending, since markups vary widely.`});
  }
  renderInsights('rm-insights',insights);
}


// ── Scientific ───────────────────────────────────────────────────
let scV='0',scE='',scM=0,scNew=true,scHist='';
const SC=[['MC','MR','MS','M+','M-'],['sin','cos','tan','log','ln'],['x²','√','1/x','n!','π'],['(',')','^','C','⌫'],['7','8','9','÷','%'],['4','5','6','×',''],['1','2','3','-',''],['0','.','±','+','=']];
function buildSci(){
  const g=gel('sc-grid');g.innerHTML='';
  SC.forEach(row=>row.forEach(b=>{if(!b){g.innerHTML+='<div></div>';return;}let cls='sci-btn';if(b==='=')cls+=' eq';else if(['C','⌫'].includes(b))cls+=' cl';else if(['+','-','×','÷','^','%'].includes(b))cls+=' op';else if(['sin','cos','tan','log','ln','x²','√','1/x','n!'].includes(b))cls+=' fn';g.innerHTML+=`<button class="${cls}" onclick="scP('${b}')">${b}</button>`;}));
}
function scU(){gel('sc-disp').textContent=scV;gel('sc-expr').textContent=scHist||scE;}
function scP(k){
  if(k==='C'){scV='0';scE='';scHist='';scNew=true;}
  else if(k==='⌫'){scV=scV.length>1?scV.slice(0,-1):'0';}
  else if(k==='MC')scM=0;else if(k==='MR'){scV=String(scM);scNew=true;}
  else if(k==='MS')scM=parseFloat(scV)||0;else if(k==='M+')scM+=parseFloat(scV)||0;else if(k==='M-')scM-=parseFloat(scV)||0;
  else if(['sin','cos','tan','log','ln','x²','√','1/x','n!'].includes(k)){
    const v=parseFloat(scV)||0;let r;
    if(k==='sin')r=Math.sin(v*Math.PI/180);else if(k==='cos')r=Math.cos(v*Math.PI/180);else if(k==='tan')r=Math.tan(v*Math.PI/180);
    else if(k==='log')r=Math.log10(v);else if(k==='ln')r=Math.log(v);else if(k==='x²')r=v*v;
    else if(k==='√')r=Math.sqrt(v);else if(k==='1/x')r=1/v;
    else if(k==='n!'){let f=1;for(let i=2;i<=v;i++)f*=i;r=f;}
    scHist=`${k}(${v})`;scE='';scV=isFinite(r)?parseFloat(r.toFixed(10)).toString():'Error';scNew=true;
  }
  else if(k==='π'){scV=String(Math.PI);scNew=true;}
  else if(k==='±')scV=String(-parseFloat(scV)||0);
  else if(k==='.'){if(scNew){scV='0.';scNew=false;}else if(!scV.includes('.'))scV+='.';}
  else if(k==='='){
    scHist='';
    try{let e=scE+scV;e=e.replace(/×/g,'*').replace(/÷/g,'/').replace(/\^/g,'**');const r=Function('"use strict";return('+e+')')();scE='';scV=isFinite(r)?parseFloat(r.toFixed(10)).toString():'Error';scNew=true;}
    catch{scV='Error';scNew=true;}
  }
  else if(['+','-','×','÷','^','%'].includes(k)){
    scHist='';
    if(scE && /[+\-×÷^%]$/.test(scE)){scE=scE.slice(0,-1)+k;}
    else{scE=scE+scV+k;}
    scNew=true;
  }
  else{scHist='';if(scNew){scV=k;scNew=false;}else scV=scV==='0'?k:scV+k;}
  scU();
}


// ── Savings Goal ─────────────────────────────────────────────────
function cSavingsGoal(){
  const goal=+gel('sg-goal').value||0,current=+gel('sg-current').value||0,rate=(+gel('sg-rate').value||0)/100,months=+gel('sg-months').value||1,k=+gel('sg-comp').value;
  const rk=rate/k,periods=k*months/12;
  const remaining=Math.max(0,goal-current);
  // Future value of current savings
  const fvCurrent=current*Math.pow(1+rk,periods);
  const stillNeeded=Math.max(0,goal-fvCurrent);
  // Monthly payment needed: PMT = PV * r / (1-(1+r)^-n)
  const mr=rate/12;
  const monthlyNeeded=mr>0?stillNeeded*mr/(Math.pow(1+mr,months)-1):stillNeeded/months;
  const totalContrib=monthlyNeeded*months;
  const interest=goal-current-totalContrib;
  const alreadyPct=goal>0?Math.min(100,current/goal*100):0;
  const achievable=monthlyNeeded>=0&&isFinite(monthlyNeeded);

  gel('sg-monthly').textContent=achievable?f$(monthlyNeeded):'—';
  gel('sg-contrib').textContent=f$(totalContrib);
  gel('sg-interest').textContent=f$(Math.max(0,interest));
  gel('sg-status').textContent=achievable?'✓ Yes':'✗ Review';
  gel('sg-status').style.color=achievable?'var(--g)':'var(--r)';
  gel('sg-gap').textContent=f$(remaining);
  gel('sg-pct').textContent=pct(alreadyPct);
  gel('sg-weekly').textContent=f$(monthlyNeeded*12/52);
  gel('sg-daily').textContent=f$(monthlyNeeded*12/365);

  // Progress bar
  const barW=Math.min(100,alreadyPct);
  gel('sg-progress-bar').style.width=barW+'%';
  gel('sg-prog-label').textContent=pct(alreadyPct);

  // Chart — balance over time vs goal line
  const balPts=[],goalPts=[];
  for(let m=0;m<=months;m++){
    const n=k*m/12;
    const bal=current*Math.pow(1+rk,n)+( mr>0?monthlyNeeded*(Math.pow(1+mr,m)-1)/mr*(1+mr):monthlyNeeded*m );
    balPts.push(Math.min(bal,goal*1.05));
    goalPts.push(goal);
  }
  drawLine('sg-chart',[{data:balPts,color:'#0F4F35',fill:true},{data:goalPts,color:'#F0B90B',fill:false,dash:[6,4],w:1.5}],190);

  // Insights
  const insights=[];
  if(alreadyPct>=100){
    insights.push({type:'good',text:'You\'ve already reached your goal with your current savings alone — nice work.'});
  }else if(achievable){
    insights.push({type:'good',text:`Saving <strong>${f$(monthlyNeeded)}/mo</strong> will get you to <strong>${f$(goal)}</strong> in ${months} months.`});
    insights.push({type:'neutral',text:`That works out to about <strong>${f$(monthlyNeeded*12/52)}/week</strong> or <strong>${f$(monthlyNeeded*12/365)}/day</strong> — easier to fit into a budget.`});
    const months2=months+12;
    const fvCurrent2=current*Math.pow(1+rk,k*months2/12);
    const stillNeeded2=Math.max(0,goal-fvCurrent2);
    const monthlyNeeded2=mr>0?stillNeeded2*mr/(Math.pow(1+mr,months2)-1):stillNeeded2/months2;
    const reduction=monthlyNeeded>0?(1-monthlyNeeded2/monthlyNeeded)*100:0;
    if(reduction>=5)insights.push({type:'neutral',text:`Giving yourself <strong>12 more months</strong> would lower the required amount to roughly <strong>${f$(monthlyNeeded2)}/mo</strong> (${reduction.toFixed(0)}% less).`});
  }else{
    insights.push({type:'bad',text:'The required monthly amount isn\'t calculating to an achievable number — check your inputs (timeline may be too short or rate too high).'});
  }
    insights.push({type:'neutral',text:`Saving for a rainy-day fund rather than a specific purchase? The <a href="/emergencyfund" style="color:var(--a);text-decoration:underline">Emergency Fund</a> calculator sizes that target differently.`});
  renderInsights('sg-insights',insights);
}


// ── Emergency Fund ───────────────────────────────────────────────
function cEmergency(){
  const expenses   = +gel('ef-expenses').value  || 0;
  const coverMonths= +gel('ef-months').value    || 6;
  const current    = +gel('ef-current').value   || 0;
  const saveRate   = +gel('ef-saverate').value  || 0;
  const rate       = (+gel('ef-rate').value || 0) / 100 / 12;
  const target     = expenses * coverMonths;
  const gap        = Math.max(0, target - current);
  const pct_done   = target > 0 ? Math.min(100, current / target * 100) : 0;

  // Months to reach target with compound interest
  let months = 0, bal = current;
  while (bal < target && months < 600) {
    bal = bal * (1 + rate) + saveRate;
    months++;
    if (saveRate <= 0) break;
  }
  const achievable = saveRate > 0 && bal >= target;
  const goalDate   = new Date();
  goalDate.setMonth(goalDate.getMonth() + months);

  gel('ef-target').textContent = f$(target);
  gel('ef-gap').textContent    = f$(gap);
  gel('ef-time').textContent   = achievable ? months + ' mo' : 'N/A';
  gel('ef-date').textContent   = achievable ? goalDate.toLocaleDateString('en-US',{month:'short',year:'numeric'}) : '—';

  // Progress bar
  gel('ef-bar').style.width   = pct_done.toFixed(1) + '%';
  gel('ef-pct-lbl').textContent = pct(pct_done);

  // Chart — savings balance vs target line
  const steps = Math.min(achievable ? months : 60, 60);
  const balPts = [], tgtPts = [];
  let b = current;
  for (let m = 0; m <= steps; m++) {
    balPts.push(Math.min(b, target * 1.05));
    tgtPts.push(target);
    b = b * (1 + rate) + saveRate;
  }
  drawLine('ef-chart', [
    {data: balPts, color: '#0F4F35', fill: true},
    {data: tgtPts, color: '#F0B90B', fill: false, dash: [6,4], w: 1.5}
  ], 170);

  // Insights
  const insights=[];
  if(pct_done>=100){
    insights.push({type:'good',text:`Fully funded — your emergency fund covers <strong>${coverMonths} months</strong> of expenses. Consider keeping it in a high-yield savings account so it at least keeps pace with inflation.`});
  }else if(pct_done>=50){
    insights.push({type:'good',text:`You're <strong>${pct(pct_done)}</strong> of the way there.`});
    if(saveRate>0)insights.push({type:'neutral',text:`Keep saving <strong>${f$(saveRate)}/mo</strong> and you'll be fully funded in <strong>${months} months</strong>.`});
  }else if(saveRate>0){
    insights.push({type:'bad',text:`You still need <strong>${f$(gap)}</strong> more to reach your <strong>${coverMonths}-month</strong> target.`});
    insights.push({type:'neutral',text:`At <strong>${f$(saveRate)}/mo</strong> you'll get there in <strong>${months} months</strong> — cutting non-essential spending could speed this up.`});
  }else{
    insights.push({type:'bad',text:'No monthly savings rate is set — enter how much you can save each month to see a realistic timeline.'});
  }
  const coverLabel=coverMonths<=3?'A 3-month target is the bare minimum — fine with very stable income, risky otherwise.'
    :coverMonths<=6?'6 months is the commonly recommended target for most people.'
    :coverMonths<=9?'9 months is a conservative target — a good fit for self-employed or variable income.'
    :'12+ months is an ultra-safe target, ideal for single-income households.';
  insights.push({type:'neutral',text:coverLabel});
    insights.push({type:'neutral',text:`Saving toward a specific goal instead, like a down payment? The <a href="/savingsgoal" style="color:var(--a);text-decoration:underline">Savings Goal</a> calculator shows the monthly amount needed to hit it by a target date.`});
  renderInsights('ef-insights',insights);
}


// ── Financial Health Score ───────────────────────────────────────
function cHealthScore(){
  const income      = +gel('hs-income').value     || 0;
  const expenses    = +gel('hs-expenses').value   || 0;
  const debtPay     = +gel('hs-debt-pay').value   || 0;
  const efMonths    = +gel('hs-ef').value         || 0;
  const retireSave  = +gel('hs-retire-save').value|| 0;
  const totalDebt   = +gel('hs-total-debt').value || 0;
  const networth    = +gel('hs-networth').value   || 0;
  const insurance   = +gel('hs-insurance').value  || 0;

  const savingsRate    = income > 0 ? (income - expenses) / income * 100 : 0;
  const debtToIncome   = income > 0 ? debtPay / income * 100 : 100;
  const debtToNetworth = networth > 0 ? totalDebt / networth * 100 : 100;
  const retireRate     = income > 0 ? retireSave / income * 100 : 0;

  // ── Score components (each out of 100, weighted) ──
  // 1. Savings rate (weight 25)
  const s1 = savingsRate >= 20 ? 100 : savingsRate >= 15 ? 85 : savingsRate >= 10 ? 70 : savingsRate >= 5 ? 50 : savingsRate > 0 ? 25 : 0;
  // 2. Debt-to-income ratio (weight 20)
  const s2 = debtToIncome === 0 ? 100 : debtToIncome <= 15 ? 90 : debtToIncome <= 25 ? 70 : debtToIncome <= 36 ? 50 : debtToIncome <= 50 ? 25 : 0;
  // 3. Emergency fund (weight 20)
  const s3 = efMonths >= 12 ? 100 : efMonths >= 9 ? 90 : efMonths >= 6 ? 80 : efMonths >= 3 ? 60 : efMonths >= 2 ? 40 : efMonths >= 1 ? 20 : 0;
  // 4. Retirement savings rate (weight 15)
  const s4 = retireRate >= 15 ? 100 : retireRate >= 10 ? 80 : retireRate >= 6 ? 60 : retireRate >= 3 ? 35 : retireRate > 0 ? 15 : 0;
  // 5. Net worth vs debt (weight 10)
  const s5 = debtToNetworth <= 10 ? 100 : debtToNetworth <= 30 ? 80 : debtToNetworth <= 50 ? 60 : debtToNetworth <= 80 ? 35 : debtToNetworth <= 100 ? 15 : 0;
  // 6. Insurance coverage (weight 10)
  const s6 = insurance === 3 ? 100 : insurance === 2 ? 75 : insurance === 1 ? 40 : 0;

  const total = Math.round(s1*.25 + s2*.20 + s3*.20 + s4*.15 + s5*.10 + s6*.10);

  // Grade
  const grade = total >= 85 ? {g:'A+',label:'Excellent',color:'#0F4F35',desc:'Outstanding financial health — keep it up!'} :
                total >= 75 ? {g:'A', label:'Very Good', color:'#0F4F35',desc:'Strong finances with minor areas to improve'} :
                total >= 65 ? {g:'B', label:'Good',      color:'#F0B90B',desc:'Solid foundation, some key areas need attention'} :
                total >= 50 ? {g:'C', label:'Fair',      color:'#F0B90B',desc:'You are managing, but important gaps exist'} :
                total >= 35 ? {g:'D', label:'Poor',      color:'#8C2E22',desc:'Significant financial stress — take action now'} :
                              {g:'F', label:'Critical',  color:'#8C2E22',desc:'Urgent action needed across multiple areas'};

  gel('hs-score-num').textContent = total;
  gel('hs-score-num').style.color = grade.color;
  gel('hs-grade').textContent = grade.g + ' — ' + grade.label;
  gel('hs-grade').style.color = grade.color;
  gel('hs-grade-desc').textContent = grade.desc;

  // Draw gauge
  drawGauge('hs-gauge', total, grade.color);

  // Breakdown bars
  const components = [
    {label:'Savings Rate',    score:s1, weight:25, hint:`${savingsRate.toFixed(1)}% of income saved`},
    {label:'Debt-to-Income',  score:s2, weight:20, hint:`${debtToIncome.toFixed(1)}% of income to debt`},
    {label:'Emergency Fund',  score:s3, weight:20, hint:`${efMonths} months covered`},
    {label:'Retirement Prep', score:s4, weight:15, hint:`${retireRate.toFixed(1)}% of income invested`},
    {label:'Net Worth Ratio', score:s5, weight:10, hint:`Debt is ${debtToNetworth.toFixed(0)}% of net worth`},
    {label:'Insurance',       score:s6, weight:10, hint:['None','Health only','Health + Life','Full'][insurance]},
  ];
  gel('hs-breakdown').innerHTML = components.map(c => {
    const col = c.score >= 75 ? 'var(--g)' : c.score >= 50 ? 'var(--a)' : 'var(--r)';
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
        <span>${c.label} <span style="font-size:10px;color:var(--m)">(${c.weight}%)</span></span>
        <span style="font-family:var(--mo);color:${col}">${c.score}/100 · ${c.hint}</span>
      </div>
      <div class="pbar-bg"><div class="pbar-fill" style="width:${c.score}%;background:${col}"></div></div>
    </div>`;
  }).join('');

  // Ratios
  gel('hs-ratios').innerHTML = [
    {label:'Savings Rate',       val:pct(savingsRate),      good:savingsRate>=20, target:'Target: ≥20%'},
    {label:'Debt-to-Income',     val:pct(debtToIncome),     good:debtToIncome<=36,target:'Target: ≤36%'},
    {label:'Retirement Rate',    val:pct(retireRate),       good:retireRate>=10,  target:'Target: ≥10%'},
    {label:'Debt-to-Net Worth',  val:pct(debtToNetworth),   good:debtToNetworth<=50,target:'Target: ≤50%'},
    {label:'Monthly Surplus',    val:f$(income-expenses),   good:(income-expenses)>0,target:'Should be positive'},
  ].map(r => `<div class="rrow"><span class="rk">${r.label}<br><span style="font-size:10px">${r.target}</span></span><span class="rv" style="color:${r.good?'var(--g)':'var(--r)'}">${r.val} ${r.good?'✓':'✗'}</span></div>`).join('');

  // Insights
  const insights = [];
  if(savingsRate < 20) insights.push({type:savingsRate<5?'bad':'neutral',text:`Boost your savings rate to <strong>20%+</strong> (currently <strong>${savingsRate.toFixed(1)}%</strong>) — try automating transfers on payday.`});
  if(debtToIncome > 36) insights.push({type:'bad',text:`Debt payments are <strong>${debtToIncome.toFixed(1)}%</strong> of income — above the safe 36% limit. Prioritize paying down high-interest debt first.`});
  if(efMonths < 6) insights.push({type:efMonths<2?'bad':'neutral',text:`Build your emergency fund to at least <strong>6 months</strong> of expenses (currently <strong>${efMonths} months</strong>).`});
  if(retireRate < 10) insights.push({type:retireRate<3?'bad':'neutral',text:`Contribute at least <strong>10%</strong> of income to retirement (currently <strong>${retireRate.toFixed(1)}%</strong>) — take full advantage of any employer match first.`});
  if(insurance < 2) insights.push({type:'bad',text:'Get both health and life insurance — unexpected medical bills or loss of income can devastate finances without coverage.'});
  if(insights.length === 0) insights.push({type:'good',text:'You\'re hitting all key financial targets. Consider increasing investments, giving back, or exploring early retirement.'});
    insights.push({type:'neutral',text:`Want to dig into any one of these areas specifically? Check your <a href="/cashflow" style="color:var(--a);text-decoration:underline">Cash Flow</a>, <a href="/emergencyfund" style="color:var(--a);text-decoration:underline">Emergency Fund</a>, or <a href="/retirement" style="color:var(--a);text-decoration:underline">Retirement</a> numbers individually.`});
  renderInsights('hs-tips',insights);
}

function drawGauge(id, score, color){
  const c = gel(id); if(!c) return;
  const ctx = c.getContext('2d'), W = c.width, H = c.height, cx = W/2, cy = H/2+10, r = 65;
  ctx.clearRect(0,0,W,H);
  // Background arc
  ctx.beginPath(); ctx.arc(cx,cy,r, Math.PI, 2*Math.PI);
  ctx.strokeStyle='#232D3A'; ctx.lineWidth=14; ctx.lineCap='round'; ctx.stroke();
  // Value arc
  const end = Math.PI + (score/100)*Math.PI;
  ctx.beginPath(); ctx.arc(cx,cy,r, Math.PI, end);
  ctx.strokeStyle=color; ctx.lineWidth=14; ctx.lineCap='round'; ctx.stroke();
  // Tick marks
  for(let i=0;i<=10;i++){
    const a = Math.PI + i*Math.PI/10;
    const x1=cx+Math.cos(a)*(r-20), y1=cy+Math.sin(a)*(r-20);
    const x2=cx+Math.cos(a)*(r-24), y2=cy+Math.sin(a)*(r-24);
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.strokeStyle='#2E3C4A';ctx.lineWidth=1.5;ctx.stroke();
  }
}



// ── Disclaimers ──────────────────────────────────────────────────
const DISCLAIMER_BASE='This calculator provides estimates for general informational and educational purposes only. It is not financial, tax, legal, or investment advice, and results should not be relied on as the sole basis for any financial decision.';
const DISCLAIMER_CAT={
  tax:'Tax laws, brackets, and deductions vary by jurisdiction and change frequently — <strong>consult a qualified tax professional</strong> before filing or making tax-related decisions.',
  investing:'Past performance does not guarantee future results. All expected returns shown are illustrative historical averages, not guarantees — actual investment returns involve risk, including possible loss of principal. <strong>Consider speaking with a licensed financial advisor</strong> before investing.',
  realestate:'Property values, rental income, taxes, and financing terms vary significantly by location and lender. <strong>Verify all figures with a local real estate or mortgage professional</strong> before making a purchase or investment decision.',
  business:'Business projections depend on assumptions that may not reflect your actual market, costs, or growth trajectory. <strong>Validate key assumptions with your own financial data</strong> before using these figures for planning or fundraising.',
  credit:'Loan terms, interest rates, and fees vary by lender and are subject to change. <strong>Confirm exact figures with your lender or financial institution</strong> before making borrowing or repayment decisions.',
  currency:'Exchange rates are pulled from a live rates provider and cached for up to 24 hours — they are indicative reference rates, not real-time interbank or market rates, and do not include the spread or fees your bank or payment provider will charge. <strong>Check with your bank or payment provider for the exact rate on any actual transaction.</strong>'
};
const PANEL_DISCLAIMER={
  loan:'credit',prepay:'credit',loancomp:'credit',autoloan:'credit',debtcomp:'credit',debt:'credit',loaneligibility:'credit',dti:'credit',
  tax:'tax',salary:'tax',
  mortgage:'realestate',mortcomp:'realestate',rental:'realestate',rentalprop:'realestate',rentvsbuy:'realestate',
  savings:'investing',provident:'investing',retirement:'investing',fire:'investing',savingsgoal:'investing',emergencyfund:'investing',healthscore:'investing','401k':'investing',millionaire:'investing',lifeinsurance:'investing',healthinsurance:'investing',
  cagr:'investing',xirr:'investing',drip:'investing',divgrowth:'investing',etf:'investing',allocation:'investing',dcf:'investing',peg:'investing',evebitda:'investing',invest:'investing',swp:'investing',stock:'investing',dilutionimpact:'investing',dca:'investing',
  burnrate:'business',pricing:'business',equity:'business',revenue:'business',breakeven:'business',cashflow:'business',
  currency:'currency',remit:'currency'
  // scientific intentionally excluded — pure math tool, no financial disclaimer applies
};
// ── Chart tooltips: hover a pie/donut slice or bar to see its exact
// label, value, and share of the total. Works generically across every
// chart on the site — no per-calculator wiring needed beyond calling
// attachChartTooltips() once per page.
let _chartTip=null;
function _getChartTip(){
  if(_chartTip)return _chartTip;
  _chartTip=document.createElement('div');
  _chartTip.className='chart-tooltip';
  document.body.appendChild(_chartTip);
  return _chartTip;
}
function _positionTip(tip,e){
  const pad=14;
  let left=e.clientX+pad,top=e.clientY+pad;
  if(left+210>window.innerWidth)left=e.clientX-210-pad;
  if(top+60>window.innerHeight)top=e.clientY-60-pad;
  tip.style.left=left+'px';tip.style.top=top+'px';
}
function _donutLabelsFor(canvas){
  const wrap=canvas.closest('.donut-wrap');
  if(!wrap)return [];
  return [...wrap.querySelectorAll('.leg-i')].map(el=>{
    const clone=el.cloneNode(true);
    const dot=clone.querySelector('.leg-dot');
    if(dot)dot.remove();
    return clone.textContent.trim();
  });
}
function attachDonutTooltip(canvas){
  if(canvas._tipAttached)return;
  canvas._tipAttached=true;
  const tip=_getChartTip();
  canvas.addEventListener('mousemove',e=>{
    if(!canvas._segments||!canvas._segments.length){tip.style.display='none';return;}
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;
    const x=(e.clientX-rect.left)*scaleX,y=(e.clientY-rect.top)*scaleY;
    const dx=x-canvas._cx,dy=y-canvas._cy,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>canvas._r||dist<canvas._r*0.57){tip.style.display='none';return;}
    let ang=Math.atan2(dy,dx);
    const seg=canvas._segments.find(s=>{
      let a=ang,a0=s.start,a1=s.end;
      while(a<a0-0.001)a+=2*Math.PI;
      return a>=a0-0.001&&a<=a1+0.001;
    });
    if(!seg){tip.style.display='none';return;}
    const labels=_donutLabelsFor(canvas);
    const label=labels[seg.index]||('Segment '+(seg.index+1));
    tip.innerHTML=`<strong>${label}</strong><br>${f$(seg.value)} · ${seg.pct.toFixed(1)}%`;
    _positionTip(tip,e);
    tip.style.display='block';
  });
  canvas.addEventListener('mouseleave',()=>{tip.style.display='none';});
}
function attachBarTooltip(canvas){
  if(canvas._tipAttached)return;
  canvas._tipAttached=true;
  const tip=_getChartTip();
  canvas.addEventListener('mousemove',e=>{
    if(!canvas._bars||!canvas._bars.length){tip.style.display='none';return;}
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;
    const x=(e.clientX-rect.left)*scaleX,y=(e.clientY-rect.top)*scaleY;
    const bar=canvas._bars.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
    if(!bar){tip.style.display='none';return;}
    tip.innerHTML=`<strong>${bar.label}</strong><br>${f$(bar.value)}`;
    _positionTip(tip,e);
    tip.style.display='block';
  });
  canvas.addEventListener('mouseleave',()=>{tip.style.display='none';});
}
function attachChartTooltips(){
  document.querySelectorAll('canvas[id$="-donut"]').forEach(attachDonutTooltip);
  document.querySelectorAll('canvas[id$="-chart"]').forEach(c=>{
    // only attach bar-tooltip to canvases actually drawn as bar charts
    // (drawBars populates c._bars — line charts don't, so this is safe
    // to call broadly and it'll simply no-op for line/area charts)
    attachBarTooltip(c);
  });
}

function injectDisclaimers(){
  document.querySelectorAll('.panel').forEach(panel=>{
    const id=panel.id;
    const cat=PANEL_DISCLAIMER[id];
    if(!cat)return;
    if(panel.querySelector('.calc-disclaimer'))return;
    const div=document.createElement('div');
    div.className='calc-disclaimer';
    div.innerHTML=`<span class="dx-icon">ⓘ</span><span class="dx-text">${DISCLAIMER_BASE} ${DISCLAIMER_CAT[cat]}</span>`;
    const faq=panel.querySelector('.faq-section');
    if(faq)faq.insertAdjacentElement('afterend',div);
    else panel.appendChild(div);
  });
}

// ── Input hint: tells first-time users the pre-filled numbers are just
// examples to replace, not their actual answer — added to the first
// input card of every calculator panel (skips home/legal/blog pages,
// which have no calculator inputs).
const NO_HINT_PANELS=new Set(['home','privacy','about','terms','currency','scientific']);
function injectInputHints(){
  // hint removed per request
}

// ── Print: a button per calculator that prints just that calculator's
// inputs + outputs (stat boxes, charts, tables) via a scoped print
// stylesheet — not the nav, guide, FAQ, or any other panel.
// ── Download Result: generates a clean PDF report of a calculator's
// inputs and outputs (labels come straight from the DOM, so this stays
// in sync automatically as calculators change). jsPDF + autoTable are
// loaded lazily from CDN on first use, not on every page load.
let _pdfLibPromise=null;
function _loadPdfLib(){
  if(_pdfLibPromise)return _pdfLibPromise;
  _pdfLibPromise=new Promise((resolve,reject)=>{
    const s1=document.createElement('script');
    s1.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s1.onload=()=>{
      const s2=document.createElement('script');
      s2.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
      s2.onload=()=>resolve();
      s2.onerror=()=>reject(new Error('autotable failed to load'));
      document.head.appendChild(s2);
    };
    s1.onerror=()=>reject(new Error('jsPDF failed to load'));
    document.head.appendChild(s1);
  });
  return _pdfLibPromise;
}

// Adds thousands-separator commas to a plain numeric string (e.g. the raw
// value out of a text input) without touching values that aren't numeric —
// percentages with a trailing %, plain text, dates, etc. pass through as-is.
// Preserves whatever decimal precision the user actually typed.
function _formatNumForPdf(val){
  if(val==null)return '';
  const s=String(val).trim();
  if(s==='')return s;
  const m=s.match(/^(-?)(\d+)(\.\d+)?$/);
  if(!m)return s;
  const [,sign,intPart,decPart]=m;
  return sign+Number(intPart).toLocaleString('en-US')+(decPart||'');
}

// Walks a calculator panel and extracts its inputs + outputs as
// {sectionTitle, rows:[[label,value],...]} blocks, in visual order,
// skipping nav/guide/FAQ/disclaimer/related-links (same scope as the
// old print stylesheet used).
function _extractCalculatorData(panel){
  const SKIP_CLASSES=['back-btn','print-btn','download-btn','share-btn','calc-links','calc-guide','faq-section','calc-disclaimer','input-hint'];
  const blocks=[];

  // Special-cased: calculators whose row entries live in a plain JS array
  // rather than static DOM fields (debt payoff, debt comparison, cash flow).
  const DYNAMIC_ROW_SOURCES={
    debt:()=>({title:'Debts Entered',rows:null,table:{head:['Debt','Balance','Rate %','Min Payment'],
      body:(typeof debts!=='undefined'?debts:[]).map(d=>[d.name,f$(d.bal),d.rate+'%',f$(d.min)])}}),
    debtcomp:()=>({title:'Debts Entered',rows:null,table:{head:['Debt','Balance','Rate %','Min Payment'],
      body:(typeof dc2Debts!=='undefined'?dc2Debts:[]).map(d=>[d.name,f$(d.bal),d.rate+'%',f$(d.min)])}}),
    cashflow:()=>({title:'Income & Expenses Entered',rows:null,table:{head:['Item','Type','Amount','Frequency'],
      body:[
        ...((typeof cfIncome!=='undefined'?cfIncome:[]).map(x=>[x.name,'Income',f$(x.amt),x.freq])),
        ...((typeof cfExpense!=='undefined'?cfExpense:[]).map(x=>[x.name,'Expense',f$(x.amt),x.freq]))
      ]}}),
  };
  if(DYNAMIC_ROW_SOURCES[panel.id]){
    try{ blocks.push(DYNAMIC_ROW_SOURCES[panel.id]()); }catch(e){}
  }

  const cards=panel.querySelectorAll('.card, .g3 > *');
  const seen=new Set();
  cards.forEach(card=>{
    if(seen.has(card))return;
    if(SKIP_CLASSES.some(c=>card.classList && card.classList.contains(c)))return;
    const titleEl=card.querySelector(':scope > .card-title');
    const title=titleEl?titleEl.textContent.trim():null;
    const rows=[];
    // standard .field-wrapped input fields
    const fieldInputs=new Set();
    card.querySelectorAll(':scope .field').forEach(f=>{
      const label=f.querySelector('label')?.textContent.trim();
      const input=f.querySelector('input,select');
      if(!label||!input)return;
      fieldInputs.add(input);
      let val=input.tagName==='SELECT'?input.options[input.selectedIndex]?.textContent.trim():_formatNumForPdf(input.value);
      rows.push([label,String(val)]);
    });
    // loose label+input pairs not wrapped in .field (e.g. "Extra Payment", "Strategy")
    card.querySelectorAll(':scope label').forEach(lbl=>{
      if(lbl.closest('.field'))return; // already handled above
      const container=lbl.parentElement;
      const input=container?container.querySelector('input,select'):null;
      if(!input||fieldInputs.has(input))return;
      const label=lbl.textContent.trim();
      if(!label)return;
      let val=input.tagName==='SELECT'?input.options[input.selectedIndex]?.textContent.trim():_formatNumForPdf(input.value);
      rows.push([label,String(val)]);
      fieldInputs.add(input);
    });
    // .sbox stat-summary pattern (label + big number, used by dynamic-row calculators)
    card.querySelectorAll(':scope .sbox, :scope .sgrid .sbox').forEach(box=>{
      const k=box.querySelector('.lbl')?.textContent.trim();
      const v=box.querySelector('.val')?.textContent.trim();
      if(k&&v)rows.push([k,v]);
    });
    // standard result rows
    card.querySelectorAll(':scope .rrow').forEach(r=>{
      const k=r.querySelector('.rk')?.textContent.trim();
      const v=r.querySelector('.rv')?.textContent.trim();
      if(k&&v)rows.push([k,v]);
    });
    if(rows.length)blocks.push({title,rows,table:null});
    // data tables (amortization, comparisons) — skip static guide-table reference tables
    card.querySelectorAll(':scope table.tbl').forEach(tbl=>{
      const theadCells=[...tbl.querySelectorAll('thead th')].map(th=>th.textContent.trim());
      const bodyRows=[...tbl.querySelectorAll('tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.trim()));
      if(bodyRows.length)blocks.push({title:title?title+' — Details':'Details',rows:null,table:{head:theadCells,body:bodyRows}});
    });
    seen.add(card);
  });
  return blocks;
}

// jsPDF's built-in fonts only reliably support plain ASCII / basic
// Latin-1 — typographic characters (em/en dashes, curly quotes,
// ellipsis, emoji) can render as garbled glyphs or, in some cases,
// throw mid-generation and silently cut off everything after them.
// Normalize all text to safe ASCII before it reaches jsPDF.
function _sanitizeForPdf(str){
  if(str==null)return '';
  return String(str)
    .replace(/[\u2013\u2014]/g,'-')      // en dash, em dash
    .replace(/[\u2018\u2019]/g,"'")      // curly single quotes
    .replace(/[\u201C\u201D]/g,'"')      // curly double quotes
    .replace(/\u2026/g,'...')            // ellipsis
    .replace(/\u00A0/g,' ')              // non-breaking space
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu,'') // emoji & arrows
    .replace(/[^\x00-\x7F]/g,'')         // strip any remaining non-ASCII (currency symbols like ₹ etc.)
    .replace(/\s+/g,' ')
    .trim();
}

async function downloadCalculatorPDF(id){
  const panel=gel(id);if(!panel)return;
  const btn=panel.querySelector('.download-btn');
  const origLabel=btn?btn.innerHTML:null;
  if(btn){btn.innerHTML='⏳ Preparing...';btn.disabled=true;}
  try{
    await _loadPdfLib();
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'pt',format:'a4'});
    const name=_sanitizeForPdf(panel.querySelector('.card-title')?.textContent||'FinCalc Result');
    const today=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    doc.setFontSize(16);doc.setTextColor(20,20,20);
    doc.text('FinCalc',40,40);
    doc.setFontSize(12);doc.setTextColor(90,90,90);
    doc.text(name,40,60);
    doc.setFontSize(9);doc.setTextColor(140,140,140);
    doc.text(_sanitizeForPdf(`Generated ${today} - finclac.com`),40,75);
    let y=95;
    const blocks=_extractCalculatorData(panel);
    blocks.forEach(block=>{
      if(y>760){doc.addPage();y=40;}
      const cleanTitle=block.title?_sanitizeForPdf(block.title):null;
      if(cleanTitle){
        doc.setFontSize(11);doc.setTextColor(30,30,30);
        doc.text(cleanTitle,40,y);
        y+=8;
      }
      if(block.rows){
        const cleanRows=block.rows.map(r=>r.map(_sanitizeForPdf));
        doc.autoTable({startY:y,margin:{left:40,right:40},styles:{fontSize:9,cellPadding:5},
          head:[['Field','Value']],body:cleanRows,
          headStyles:{fillColor:[240,185,11],textColor:[20,20,20]},
          theme:'grid'});
        y=doc.lastAutoTable.finalY+16;
      }else if(block.table){
        const cleanHead=block.table.head.map(_sanitizeForPdf);
        const cleanBody=block.table.body.map(r=>r.map(_sanitizeForPdf));
        doc.autoTable({startY:y,margin:{left:40,right:40},styles:{fontSize:8,cellPadding:4},
          head:[cleanHead],body:cleanBody,
          headStyles:{fillColor:[240,185,11],textColor:[20,20,20]},
          theme:'grid'});
        y=doc.lastAutoTable.finalY+16;
      }
    });
    doc.setFontSize(8);doc.setTextColor(160,160,160);
    doc.text('This is an estimate for informational purposes only, not financial advice.',40,doc.internal.pageSize.height-20);
    doc.save(`fincalc-${id}-result.pdf`);
  }catch(e){
    alert('Sorry, the download couldn\'t be generated. Please check your connection and try again.');
  }finally{
    if(btn){btn.innerHTML=origLabel;btn.disabled=false;}
  }
}

function _getCalcBtnRow(panel){
  let row=panel.querySelector('.calc-btn-row');
  if(row)return row;
  row=document.createElement('div');
  row.className='calc-btn-row';
  const anchor=panel.querySelector('.calc-links-label')||panel.querySelector('.calc-links');
  if(anchor)anchor.insertAdjacentElement('beforebegin',row);
  else{
    const back=panel.querySelector('.back-btn');
    if(back)back.insertAdjacentElement('afterend',row);
    else panel.insertBefore(row,panel.firstChild);
  }
  return row;
}

function injectPrintButtons(){
  document.querySelectorAll('.panel').forEach(panel=>{
    if(panel.id==='home'||panel.id==='privacy'||panel.id==='about'||panel.id==='terms'||panel.id==='scientific'||panel.id==='currency'||panel.id==='personal-finance'||panel.id==='investing-valuation'||panel.id==='startup-business'||panel.id==='tools'||panel.id==='404'||panel.id.indexOf('blog')===0)return;
    if(panel.querySelector('.download-btn'))return;
    const btn=document.createElement('button');
    btn.className='download-btn';
    btn.innerHTML='⬇️ Download Result';
    btn.onclick=function(){downloadCalculatorPDF(panel.id);};
    _getCalcBtnRow(panel).appendChild(btn);
  });
}

// ── Share Result ────────────────────────────────────────────────
function injectShareButtons(){
  document.querySelectorAll('.panel').forEach(panel=>{
    if(panel.id==='home'||panel.id==='privacy'||panel.id==='about'||panel.id==='terms'||panel.id==='scientific'||panel.id==='currency'||panel.id==='personal-finance'||panel.id==='investing-valuation'||panel.id==='startup-business'||panel.id==='tools'||panel.id==='404'||panel.id.indexOf('blog')===0)return;
    if(panel.querySelector('.share-btn'))return;
    const btn=document.createElement('button');
    btn.className='share-btn';
    btn.innerHTML='🔗 Share Calculator';
    btn.onclick=function(){openShareModal(panel.id);};
    _getCalcBtnRow(panel).appendChild(btn);
  });
}

function _ensureShareModal(){
  if(gel('share-backdrop'))return;
  const wrap=document.createElement('div');
  wrap.id='share-backdrop';
  wrap.className='share-backdrop';
  wrap.onclick=function(e){ if(e.target===wrap) closeShareModal(); };
  wrap.innerHTML=`
    <div class="share-modal">
      <div class="share-modal-head">
        <div class="share-modal-title" id="share-modal-title">Share Calculator</div>
        <button class="share-modal-close" onclick="closeShareModal()">✕</button>
      </div>
      <div class="share-grid">
        <button class="share-opt" onclick="_shareVia('whatsapp')"><span class="share-opt-ic" style="background:#25D366">💬</span><span class="share-opt-lbl">WhatsApp</span></button>
        <button class="share-opt" onclick="_shareVia('telegram')"><span class="share-opt-ic" style="background:#26A5E4">✈️</span><span class="share-opt-lbl">Telegram</span></button>
        <button class="share-opt" onclick="_shareVia('x')"><span class="share-opt-ic" style="background:#000">𝕏</span><span class="share-opt-lbl">X</span></button>
        <button class="share-opt" onclick="_shareVia('facebook')"><span class="share-opt-ic" style="background:#1877F2">f</span><span class="share-opt-lbl">Facebook</span></button>
        <button class="share-opt" onclick="_shareVia('messenger')"><span class="share-opt-ic" style="background:#00B2FF">💭</span><span class="share-opt-lbl">Messenger</span></button>
        <button class="share-opt" onclick="_shareVia('email')"><span class="share-opt-ic" style="background:#64748B">✉️</span><span class="share-opt-lbl">Email</span></button>
        <button class="share-opt" onclick="_shareVia('sms')"><span class="share-opt-ic" style="background:#0F9D58">📱</span><span class="share-opt-lbl">Messages</span></button>
        <button class="share-opt" onclick="_shareVia('more')"><span class="share-opt-ic" style="background:#7C3AED">⋯</span><span class="share-opt-lbl">More</span></button>
      </div>
      <div class="share-link-row">
        <input type="text" id="share-link-input" readonly>
        <button class="share-copy-btn" id="share-copy-btn" onclick="_copyShareLink()">Copy</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
}

let _shareCtx={url:'',text:'',title:''};

function openShareModal(panelId){
  _ensureShareModal();
  const panel=gel(panelId);
  const nameEl=panel? panel.querySelector('.card-title'):null;
  const calcName=nameEl? nameEl.textContent.trim():'Calculator';
  const url=location.href;
  _shareCtx={
    url:url,
    title:`${calcName} — FinCalc`,
    text:`Check out my ${calcName} results on FinCalc:`
  };
  gel('share-modal-title').textContent=`Share ${calcName}`;
  gel('share-link-input').value=url;
  const copyBtn=gel('share-copy-btn');
  copyBtn.textContent='Copy'; copyBtn.classList.remove('copied');
  gel('share-backdrop').classList.add('on');
}

function closeShareModal(){
  const b=gel('share-backdrop');
  if(b)b.classList.remove('on');
}

function _copyShareLink(){
  const input=gel('share-link-input');
  const btn=gel('share-copy-btn');
  const done=()=>{ btn.textContent='Copied!'; btn.classList.add('copied'); setTimeout(()=>{btn.textContent='Copy';btn.classList.remove('copied');},1800); };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(input.value).then(done).catch(()=>{ input.select(); document.execCommand('copy'); done(); });
  }else{
    input.select(); document.execCommand('copy'); done();
  }
}

function _shareVia(platform){
  const {url,text,title}=_shareCtx;
  const eu=encodeURIComponent(url), et=encodeURIComponent(text), etitle=encodeURIComponent(title);
  let target='';
  switch(platform){
    case 'whatsapp': target=`https://wa.me/?text=${et}%20${eu}`; break;
    case 'telegram': target=`https://t.me/share/url?url=${eu}&text=${et}`; break;
    case 'x': target=`https://twitter.com/intent/tweet?text=${et}&url=${eu}`; break;
    case 'facebook': target=`https://www.facebook.com/sharer/sharer.php?u=${eu}`; break;
    case 'messenger': target=`fb-messenger://share/?link=${eu}`; break;
    case 'email': target=`mailto:?subject=${etitle}&body=${et}%0A%0A${eu}`; break;
    case 'sms': target=`sms:?&body=${et}%20${eu}`; break;
    case 'more':
      if(navigator.share){
        navigator.share({title,text,url}).catch(()=>{});
        return;
      }
      _copyShareLink();
      alert('Link copied! Paste it into Instagram, TikTok, or any app to share.');
      return;
  }
  window.open(target,'_blank','noopener,noreferrer,width=600,height=650');
}

function toggleFAQ(el){
  el.parentElement.classList.toggle('open');
}


// ── Multi-page navigation (replaces old SPA go()/doSearch()) ──────
function go(id, el){
  location.href = (id === 'home' ? '/' : '/' + id);
}
function goSearch(){
  const q = gel('srch').value.trim();
  location.href = '/' + (q ? '?q=' + encodeURIComponent(q) : '');
}
function doSearch(){
  if(!window.__isHome) return; // live filtering only makes sense on the directory page
  const q = gel('srch').value.toLowerCase();
  document.querySelectorAll('.dir-card').forEach(c=>{
    c.style.display = (!q || c.innerText.toLowerCase().includes(q)) ? '' : 'none';
  });
}
function buildNavDropdowns(){
  document.querySelectorAll('.nav-dd').forEach(dd=>{
    const idx=+dd.dataset.cat;
    const sec=SECTIONS[idx];
    const menu=dd.querySelector('.nav-dd-menu');
    if(!sec||!menu||menu.children.length)return;
    menu.innerHTML=sec.items.map(it=>
      `<a class="nav-dd-item" href="/${it.id}" onclick="go('${it.id}',this);return false;">${it.icon} ${it.name}</a>`
    ).join('');
  });
}
function toggleNavDD(btn){
  const dd=btn.closest('.nav-dd');
  const menu=dd.querySelector('.nav-dd-menu');
  const wasOpen=dd.classList.contains('open');
  document.querySelectorAll('.nav-dd.open').forEach(d=>{d.classList.remove('open');d.querySelector('.nav-dd-btn').setAttribute('aria-expanded','false');});
  if(!wasOpen){
    const r=btn.getBoundingClientRect();
    menu.style.top=(r.bottom+6)+'px';
    let left=r.left;
    const maxLeft=window.innerWidth-Math.min(560,window.innerWidth*0.88)-8;
    if(left>maxLeft)left=Math.max(maxLeft,8);
    menu.style.left=left+'px';
    dd.classList.add('open');
    btn.setAttribute('aria-expanded','true');
  }
}
window.addEventListener('resize',()=>{
  document.querySelectorAll('.nav-dd.open').forEach(d=>{d.classList.remove('open');d.querySelector('.nav-dd-btn').setAttribute('aria-expanded','false');});
});
window.addEventListener('scroll',e=>{
  if(e.target && e.target.closest && e.target.closest('.nav-dd-menu'))return;
  document.querySelectorAll('.nav-dd.open').forEach(d=>{d.classList.remove('open');d.querySelector('.nav-dd-btn').setAttribute('aria-expanded','false');});
},true);
document.addEventListener('click',e=>{
  if(!e.target.closest('.nav-dd')){
    document.querySelectorAll('.nav-dd.open').forEach(d=>{d.classList.remove('open');d.querySelector('.nav-dd-btn').setAttribute('aria-expanded','false');});
  }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.nav-dd.open').forEach(d=>{d.classList.remove('open');d.querySelector('.nav-dd-btn').setAttribute('aria-expanded','false');});
  }
});
function highlightNavTab(id){
  document.querySelectorAll('.ntab').forEach(t=>{
    const oc = t.getAttribute('onclick');
    t.classList.toggle('on', !!oc && oc.includes("'"+id+"'"));
  });
  document.querySelectorAll('.nav-dd').forEach(dd=>{
    const idx=+dd.dataset.cat;
    const sec=SECTIONS[idx];
    const btn=dd.querySelector('.nav-dd-btn');
    const isActive=sec && sec.items.some(it=>it.id===id);
    btn.classList.toggle('on',isActive);
    dd.querySelectorAll('.nav-dd-item').forEach(item=>{
      item.classList.toggle('on', item.getAttribute('href')==='/'+id);
    });
  });
}
const PAGE_FNS={
  '401k':[c401k],
  'allocation':[cAllocRecommend],
  'autoloan':[cAutoLoan],
  'billsplit':[renderBSPeople],
  'breakeven':[cBE],
  'budget':[calcBudget],
  'burnrate':[cBurn],
  'cac':[calcCAC],
  'cagr':[calcCAGR],
  'cashflow':[renderCFRows,cCF],
  'ccpayoff':[calcCCPayoff],
  'currency':[buildCurrency,cCurrency],
  'dca':[cDCA],
  'dcf':[calcDCF],
  'debt':[renderDebtRows,cDebt],
  'debtcomp':[renderDC2],
  'dilutionimpact':[cDilutionImpact],
  'divgrowth':[cDivGrowth],
  'drip':[calcDRIP],
  'dti':[cDTI],
  'emergencyfund':[cEmergency],
  'equity':[renderFounders,renderRounds,calcEquity],
  'etf':[calcETF],
  'evebitda':[cEVEBITDA],
  'fire':[cFire],
  'healthinsurance':[cHealthIns],
  'healthscore':[cHealthScore],
  'heloc':[cHeloc],
  'home':[buildDir],
  'inflation':[calcInflation],
  'invest':[cSip],
  'lifeinsurance':[cLifeIns],
  'loan':[cLoan],
  'loancomp':[buildLoanComp],
  'loaneligibility':[cLoanElig],
  'millionaire':[cMillionaire],
  'mortcomp':[buildMortComp],
  'mortgage':[cMortgage],
  'networth':[calcNetWorth],
  'options':[calcOptions],
  'peg':[cPEG],
  'prepay':[cPrepay],
  'pricing':[cPricing],
  'provident':[cProvident],
  'refinance':[calcRefinance],
  'remit':[buildRemit],
  'rental':[cRental],
  'rentalprop':[calcRP],
  'rentvsbuy':[cRentVsBuy],
  'retirement':[cRetire],
  'revenue':[calcRevenue],
  'salary':[cSalary],
  'savings':[cSavings],
  'savingsgoal':[cSavingsGoal],
  'socialsecurity':[calcSocialSecurity],
  'scientific':[buildSci],
  'split':[cSplit],
  'stock':[cStock],
  'swp':[cSWP],
  'tax':[cTax],
  'xirr':[renderXIRR]
};
function initPage(id){
  document.body.dataset.page = id;
  window.__isHome = (id === 'home');
  buildNavDropdowns();
  highlightNavTab(id);
  const shared = [initGuideAccordions,injectDisclaimers,injectInputHints,injectPrintButtons,injectShareButtons,attachChartTooltips,applyCommaFormatting,attachInputGuards];
  shared.forEach(fn=>{ try{ fn(); }catch(e){ /* utility fn, expected to be safe site-wide */ } });
  (PAGE_FNS[id] || []).forEach(fn=>{ try{ fn(); }catch(e){ console.error('initPage: error running', fn.name, 'on page', id, e); } });
  if(window.__isHome){
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if(q){ gel('srch').value = q; doSearch(); }
  }
}
