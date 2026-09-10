
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
let agingChart, quizChart, playerChart;

function showPanel(id){
  tabs.forEach(t => t.classList.toggle('active', t.dataset.target === id));
  panels.forEach(p => p.classList.toggle('active', p.id === id));
  if(id === 'learn') drawAgingChart();
  if(id === 'quiz') setupQuiz();
  if(id === 'coach') setupMission();
  window.scrollTo({top:0, behavior:'smooth'});
}
tabs.forEach(t => t.addEventListener('click',()=>showPanel(t.dataset.target)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.go)));

function agingFunction(x){
  return 2.35e-5*x**5 - 0.003181*x**4 + 0.171*x**3 - 4.563*x**2 + 60.44*x - 317.2;
}

function drawAgingChart(){
  const xs=[];
  for(let x=18;x<=39;x+=0.1) xs.push(Number(x.toFixed(1)));
  const ys=xs.map(x=>agingFunction(x));
  if(agingChart) agingChart.destroy();
  agingChart = new Chart(document.getElementById('agingChart'),{
    type:'line',
    data:{
      labels:xs,
      datasets:[{
        label:'5차 다항회귀 에이징 커브',
        data:ys,
        borderColor:'#5aa7ff',
        backgroundColor:'rgba(90,167,255,.12)',
        fill:true,
        pointRadius:0,
        tension:.18
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      scales:{
        x:{title:{display:true,text:'나이 (Age)',color:'#9fb0c4'},ticks:{color:'#9fb0c4',maxTicksLimit:12},grid:{color:'rgba(159,176,196,.08)'}},
        y:{title:{display:true,text:'득점률 (Goals per Game)',color:'#9fb0c4'},ticks:{color:'#9fb0c4'},grid:{color:'rgba(159,176,196,.08)'}}
      },
      plugins:{legend:{labels:{color:'#f4f7fb'}}}
    }
  });
}

// ---------- Quiz ----------
const quizSelect = document.getElementById('quizPlayer');
let quizSelectedChoice = null;
let quizRevealed = false;

function setupQuiz(){
  if(!quizSelect.options.length){
    Object.keys(HISTORICAL_PLAYERS).forEach(name=>{
      const o=document.createElement('option'); o.value=name; o.textContent=name; quizSelect.appendChild(o);
    });
    quizSelect.addEventListener('change',()=>{quizSelectedChoice=null;quizRevealed=false;drawQuiz();});
  }
  drawQuiz();
}

function drawQuiz(){
  const name=quizSelect.value || Object.keys(HISTORICAL_PLAYERS)[0];
  const entries=Object.entries(HISTORICAL_PLAYERS[name]).map(([a,v])=>[Number(a),v]).sort((a,b)=>a[0]-b[0]);
  const cutIndex=Math.max(4,Math.floor(entries.length*0.55));
  const cutAge=entries[cutIndex][0];
  document.getElementById('quizPrompt').textContent = `${cutAge}세 이후 이 선수의 득점률은 전체적으로 어떻게 변했을까요?`;
  document.getElementById('quizResult').classList.add('hidden');
  const shown = quizRevealed ? entries : entries.slice(0,cutIndex+1);
  const data = shown.map(([x,y])=>({x,y}));

  if(quizChart) quizChart.destroy();
  quizChart=new Chart(document.getElementById('quizChart'),{
    type:'line',
    data:{datasets:[{label:name,data,borderColor:'#5aa7ff',pointBackgroundColor:'#87c3ff',tension:.15}]},
    options:{
      responsive:true,maintainAspectRatio:false,parsing:false,
      scales:{
        x:{type:'linear',title:{display:true,text:'나이',color:'#9fb0c4'},ticks:{color:'#9fb0c4'},grid:{color:'rgba(159,176,196,.08)'}},
        y:{title:{display:true,text:'득점률',color:'#9fb0c4'},ticks:{color:'#9fb0c4'},grid:{color:'rgba(159,176,196,.08)'}}
      },
      plugins:{legend:{labels:{color:'#f4f7fb'}}}
    }
  });
}

document.querySelectorAll('[data-choice]').forEach(b=>{
  b.addEventListener('click',()=>{
    quizSelectedChoice=b.dataset.choice;
    const words={up:'상승',flat:'비슷',down:'하락'};
    const box=document.getElementById('quizResult');
    box.textContent=`선택: ${words[quizSelectedChoice]} — 이제 실제 기록을 확인해보세요.`;
    box.classList.remove('hidden');
  });
});
document.getElementById('revealQuiz').addEventListener('click',()=>{
  quizRevealed=true; drawQuiz();
  const name=quizSelect.value;
  const entries=Object.entries(HISTORICAL_PLAYERS[name]).map(([a,v])=>[Number(a),v]).sort((a,b)=>a[0]-b[0]);
  const cutIndex=Math.max(4,Math.floor(entries.length*0.55));
  const before=entries[cutIndex][1];
  const after=entries.slice(cutIndex+1).reduce((s,e)=>s+e[1],0)/(entries.length-cutIndex-1);
  const actual=after > before*1.07 ? '상승' : after < before*0.93 ? '하락' : '비슷';
  const box=document.getElementById('quizResult');
  box.innerHTML=`실제 이후 평균 흐름은 <b>${actual}</b>에 더 가까웠습니다. 그래프 전체를 보면서 자신의 예측과 비교해보세요.`;
  box.classList.remove('hidden');
});

// ---------- Coach mode ----------
const missions=[
  {
    title:'장기 리빌딩',
    text:'향후 5년 이상 팀의 핵심이 될 공격수 한 명을 영입하세요. 현재 기록뿐 아니라 나이와 성장 여지도 중요합니다.',
    candidates:['Macklin Celebrini','Connor Bedard','Leo Carlsson','Wyatt Johnston'],
    weights:{age:-0.035,current:0.55,trend:0.45}
  },
  {
    title:'지금 우승해야 한다',
    text:'이번 시즌 득점력이 가장 중요합니다. 장기 성장성보다 현재 생산성을 우선해 한 명을 고르세요.',
    candidates:['Connor McDavid','Nathan MacKinnon','Leon Draisaitl','Auston Matthews'],
    weights:{age:-0.005,current:0.85,trend:0.15}
  },
  {
    title:'균형 잡힌 3년 계약',
    text:'현재 득점력과 앞으로의 위험을 모두 고려해야 합니다. 3년 동안 안정적으로 기여할 선수를 골라보세요.',
    candidates:['Jack Hughes','Auston Matthews','Connor McDavid','Nikita Kucherov'],
    weights:{age:-0.02,current:0.65,trend:0.35}
  }
];
let missionIndex=0;

function playerStats(name){
  const entries=Object.entries(CURRENT_PLAYERS[name]).map(([a,v])=>[Number(a),v]).sort((a,b)=>a[0]-b[0]);
  const [age,current]=entries.at(-1);
  const recent=entries.slice(-3);
  let trend=0;
  if(recent.length>=2) trend=(recent.at(-1)[1]-recent[0][1])/(recent.length-1);
  return {entries,age,current,trend};
}

function setupMission(){
  const m=missions[missionIndex];
  document.getElementById('missionTitle').textContent=m.title;
  document.getElementById('missionText').textContent=m.text;
  document.getElementById('coachResult').classList.add('hidden');
  document.getElementById('selectedTitle').textContent='선수를 선택하면 그래프가 표시됩니다.';
  const grid=document.getElementById('candidateGrid');
  grid.innerHTML='';
  m.candidates.forEach(name=>{
    const s=playerStats(name);
    const btn=document.createElement('button');
    btn.className='candidate';
    btn.innerHTML=`<strong>${name}</strong><span>현재 나이: ${s.age}세</span><span>최근 득점률: ${s.current.toFixed(3)}</span><span>최근 추세: ${s.trend>=0?'+':''}${s.trend.toFixed(3)}/년</span>`;
    btn.addEventListener('click',()=>selectPlayer(name,btn));
    grid.appendChild(btn);
  });
}

function selectPlayer(name,btn){
  document.querySelectorAll('.candidate').forEach(x=>x.classList.remove('selected'));
  btn.classList.add('selected');
  const s=playerStats(name);
  document.getElementById('selectedTitle').textContent=`${name}의 나이별 득점률`;

  if(playerChart) playerChart.destroy();
  playerChart=new Chart(document.getElementById('playerChart'),{
    type:'line',
    data:{
      datasets:[
        {
          label:name,
          data:s.entries.map(([x,y])=>({x,y})),
          borderColor:'#87c3ff',
          backgroundColor:'#87c3ff',
          tension:.15
        },
        {
          label:'평균 에이징 커브(참고)',
          data:Array.from({length:131},(_,i)=>18+i/10).map(x=>({x,y:agingFunction(x)})),
          borderColor:'rgba(255,255,255,.35)',
          borderDash:[6,6],pointRadius:0,tension:.18
        }
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,parsing:false,
      scales:{
        x:{type:'linear',title:{display:true,text:'나이',color:'#9fb0c4'},ticks:{color:'#9fb0c4'},grid:{color:'rgba(159,176,196,.08)'}},
        y:{title:{display:true,text:'득점률',color:'#9fb0c4'},ticks:{color:'#9fb0c4'},grid:{color:'rgba(159,176,196,.08)'}}
      },
      plugins:{legend:{labels:{color:'#f4f7fb'}}}
    }
  });

  const m=missions[missionIndex];
  const scored=m.candidates.map(n=>{
    const p=playerStats(n);
    // Normalize simple factors inside the candidate group.
    return {name:n,p};
  });
  const minAge=Math.min(...scored.map(x=>x.p.age)), maxAge=Math.max(...scored.map(x=>x.p.age));
  const minCur=Math.min(...scored.map(x=>x.p.current)), maxCur=Math.max(...scored.map(x=>x.p.current));
  const minTr=Math.min(...scored.map(x=>x.p.trend)), maxTr=Math.max(...scored.map(x=>x.p.trend));
  const norm=(v,min,max)=>max===min?0.5:(v-min)/(max-min);
  scored.forEach(x=>{
    const youth=1-norm(x.p.age,minAge,maxAge);
    x.score = m.weights.current*norm(x.p.current,minCur,maxCur)
            + m.weights.trend*norm(x.p.trend,minTr,maxTr)
            + Math.abs(m.weights.age)*youth;
  });
  scored.sort((a,b)=>b.score-a.score);
  const best=scored[0].name;

  const avgAtAge=agingFunction(s.age);
  const comparison=s.current>=avgAtAge?'평균 에이징 커브보다 높은':'평균 에이징 커브보다 낮은';
  const box=document.getElementById('coachResult');
  box.innerHTML=`
    <h3>${name} 선택</h3>
    <p><b>현재 득점률:</b> ${s.current.toFixed(3)} G/GP · <b>현재 나이:</b> ${s.age}세 · <b>최근 추세:</b> ${s.trend>=0?'+':''}${s.trend.toFixed(3)}/년</p>
    <p>현재 값은 같은 나이의 회귀곡선 기준으로 보면 <b>${comparison}</b> 수준입니다.</p>
    <p><b>이 미션의 간단한 데이터 점수 기준 추천:</b> ${best}</p>
    <p class="note">※ 추천 결과는 현재 득점률·최근 추세·나이를 단순 가중해 계산한 게임용 판단입니다. 현역 선수의 실제 미래 성적을 의미하지 않습니다.</p>`;
  box.classList.remove('hidden');
}

document.getElementById('nextMission').addEventListener('click',()=>{
  missionIndex=(missionIndex+1)%missions.length;
  setupMission();
});
