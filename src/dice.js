(function(g){
  const phi=(1+Math.sqrt(5))/2;
  const vertices=[[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]];
  const faces=[];
  const edge=(a,b)=>Math.abs(Math.hypot(...a.map((v,i)=>v-b[i]))-2)<.0001;
  for(let a=0;a<12;a++)for(let b=a+1;b<12;b++)for(let c=b+1;c<12;c++)if(edge(vertices[a],vertices[b])&&edge(vertices[a],vertices[c])&&edge(vertices[b],vertices[c]))faces.push([a,b,c]);
  function rotate([x,y,z],a,b){const y1=y*Math.cos(a)-z*Math.sin(a),z1=y*Math.sin(a)+z*Math.cos(a);return [x*Math.cos(b)+z1*Math.sin(b),y1,-x*Math.sin(b)+z1*Math.cos(b)];}
  const unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const center=f=>f.map(i=>vertices[i]).reduce((a,v)=>a.map((x,i)=>x+v[i]/3),[0,0,0]);
  function orientation(result){const f=faces[Math.max(0,Math.min(19,(result||20)-1))],n=unit(center(f)),a=Math.atan2(n[1],n[2]),b=-Math.atan2(n[0],Math.hypot(n[1],n[2])),u=rotate(unit(vertices[f[1]].map((v,j)=>v-vertices[f[0]][j])),a,b);return {a,b,c:-Math.atan2(u[1],u[0])};}
  function draw(canvas,angle,result,rolling){
    if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
    if(canvas.width!==260){canvas.width=260;canvas.height=260;}
    ctx.clearRect(0,0,260,260);
    const target=orientation(result),a=target.a+angle*.79,b=target.b+angle;
    const rot=v=>{const q=rotate(v,a,b),c=target.c;return [q[0]*Math.cos(c)-q[1]*Math.sin(c),q[0]*Math.sin(c)+q[1]*Math.cos(c),q[2]];};
    const pts=vertices.map(rot);
    const project=v=>[130+v[0]*52,126+v[1]*52];
    ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(130,229,68,10,0,0,Math.PI*2);ctx.fill();
    faces.map((f,i)=>({f,i,z:f.reduce((n,j)=>n+pts[j][2],0)/3})).filter(f=>f.z>0).sort((a,b)=>a.z-b.z).forEach(({f,i,z})=>{
      const points=f.map(j=>project(pts[j]));const shade=Math.round(37+(z+1.6)*11);
      ctx.fillStyle=`hsl(42 65% ${shade}%)`;ctx.strokeStyle='#8b642c';ctx.lineWidth=1.5;ctx.beginPath();points.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();
      // Project each numeral in the plane of its own face, using the same rotation as the mesh.
      const normal=unit(center(f)),u=unit(vertices[f[1]].map((v,j)=>v-vertices[f[0]][j])),v=cross(normal,u);
      const ru=rot(u),rv=rot(v),c=rot(center(f)),[x,y]=project(c);
      ctx.save();ctx.translate(x,y);ctx.transform(ru[0],ru[1],rv[0],rv[1],0,0);
      ctx.fillStyle='#382707';ctx.font='bold 28px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),0,1);ctx.restore();
    });
  }
  const tasks=[
    {t:'Monte um dashboard em React com filtros, gráficos e estados de carregamento.',area:'sw',dc:12,adv:1,why:'Você já construiu o dashboard do AquaSense.'},
    {t:'Conecte o dashboard ao WebSocket e valide os dados recebidos com Zod.',area:'sw',dc:14,adv:0},
    {t:'Encontre um vazamento temporal escondido no conjunto de treino.',area:'dados',dc:15,adv:1,why:'Você já investigou uma acurácia boa demais.'},
    {t:'Configure um alerta do SIEM sem transformar cada login em incidente.',area:'sec',dc:14,adv:0},
    {t:'Meça o barramento I²C e descubra por que o LCD não responde.',area:'hw',dc:11,adv:1,why:'Multímetro e documentação estão na bancada.'},
    {t:'Restaure uma máquina virtual a partir de um backup validado.',area:'infra',dc:12,adv:0},
    {t:'Escreva testes de contrato para os endpoints da API.',area:'sw',dc:13,adv:0},
    {t:'Explique o projeto para um visitante japonês sem recorrer ao inglês.',area:'idiomas',dc:13,adv:0},
    {t:'Negocie o escopo de uma entrega que já começou atrasada.',area:'humanas',dc:14,adv:0},
    {t:'Crie uma campanha publicitária viral para um resistor de 10 kΩ.',area:'mkt',dc:17,adv:-1,why:'O briefing só diz: faça viralizar.'},
    {t:'Desenhe um mascote em perspectiva usando apenas o touchpad.',area:'artes',dc:15,adv:-1,why:'A mesa digitalizadora ficou em casa.'},
    {t:'Preencha um formulário com vinte anexos antes que a sessão expire.',area:'buro',dc:16,adv:0},
    {t:'Apresente o orçamento para uma plateia que só quer saber do prazo.',area:'humanas',dc:15,adv:0},
    {t:'Recupere um firmware que travou sem apagar a configuração do usuário.',area:'hw',dc:14,adv:0},
    {t:'Escolha tipografia e hierarquia visual para um relatório de dados.',area:'artes',dc:12,adv:0},
    {t:'Documente o ambiente para que outra pessoa consiga reproduzir o lab.',area:'infra',dc:11,adv:1,why:'Você anotou os passos durante a montagem.'}
  ];
  g.PortfolioDice={vertices,faces,draw,orientation,rotate,center,tasks,install(C){
    const p=C.prototype,data=p.data,render=p.renderVals,roll=p.d20Roll;
    p.data=function(){const d=data.call(this);if(!d.diceEnhanced){d.diceEnhanced=true;d.d20Tasks=d.d20Tasks.concat(tasks);}return d;};
    p.d20Roll=function(){this._goldRollAt=typeof performance!=='undefined'?performance.now():Date.now();return roll.call(this);};
    p.loopGoldDice=function(t){if(!this.st().dOpen)return;const r=this.st().dRoll,spinning=r?.phase==='rolling'&&!this.calm();const elapsed=Math.max(0,t-(this._goldRollAt??t));const k=Math.min(1,elapsed/1362);const angle=spinning?Math.pow(1-k,3)*Math.PI*6:0;draw(this._goldA,angle,r?.a||20,spinning);draw(this._goldB,-angle,r?.b||20,spinning);};
    p.renderVals=function(){return {...render.call(this),setGoldA:el=>{this._goldA=el;},setGoldB:el=>{this._goldB=el;}};};
  }};
})(window);
