/* New props are vector drawings in the existing canvas, preserving the original atlas. */
(function(g){
  const art={
    mimikyu:[['#342c39','M20 17L26 14L30 18L25 21L29 26L24 25L20 28Z'],['#dbc893','M7 12L4 1L8 0L13 9L20 9L24 1L28 2L24 15L25 23L29 29L21 27L18 31L13 28L8 31L3 28L7 23Z'],['#2c2931','M4 1L8 0L10 4L6 5ZM24 1L28 2L27 7L23 5ZM10 14H13V17H10ZM20 13H23V16H20ZM13 20L17 18L21 20L18 22Z'],['#b56954','M7 18H11V20H7ZM23 17H26V19H23Z'],['#20202a','M9 27H11V29H9ZM18 27H20V29H18Z']],
    pikachu:[['#e1b63c','M23 18L29 13L26 11L32 7L31 16L27 20L30 24L24 27Z'],['#efcf43','M6 12L3 1L7 0L12 9H20L25 0L29 2L25 14V22L22 26L25 30H18L15 28L11 31H5L8 26L4 22Z'],['#252b29','M3 1L7 0L9 5L5 7ZM25 0L29 2L27 7L23 5ZM9 13H12V16H9ZM21 13H24V16H21Z'],['#c44c40','M5 18H10V22H5ZM23 18H27V22H23Z'],['#734c36','M14 19H18V21H14Z']],
    hat:[['#202a2d','M6 3H26L24 22H29V27H2V22H8Z'],['#5b786d','M9 6H22V20H9Z'],['#d64446','M7 18H25V23H7Z'],['#f6e0a6','M13 19H17V22H13Z'],['#9fd5bc','M4 28L8 25L12 28L8 31ZM23 29L26 26L29 29L26 32Z']],
    sword:[['#344d68','M1 10H14V23L8 30L2 24Z'],['#dbe9db','M4 13H11V22L8 26L4 22Z'],['#5285ac','M6 14H9V24H6Z'],['#dbe1cd','M25 0L29 4L21 22L17 20Z'],['#aa8e53','M13 19L25 24L24 27L13 22Z'],['#744b38','M17 24L20 25L17 32L14 30Z']],
    sketchbook:[['#e7e4cf','M3 3H28V30H3Z'],['#353336','M3 3H7V30H3ZM12 9H21V11H12ZM10 11H12V19H10ZM21 11H23V19H21ZM12 19H21V21H12ZM13 13H15V15H13ZM18 13H20V15H18ZM14 23H19V25H14Z'],['#bcbdac','M25 5H27V28H25Z']]
  };
  const pathCache={};
  function draw(ctx,key,x,y,w,h){
    ctx.save();ctx.translate(x,y);ctx.scale(w/32,h/32);
    for(const [color,path] of art[key]||[]){ctx.fillStyle=color;ctx.fill(pathCache[path]||(pathCache[path]=new Path2D(path)));}
    ctx.restore();
  }
  function svg(key){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 40 40">'+(art[key]||[]).map(([color,d])=>'<path fill="'+color+'" d="'+d+'"/>').join('')+'</svg>');}
  art.pochita=[['#261e1b','M17 5L21 1H28L32 6L28 15L25 13L28 7L26 5H22L20 8Z'],['#a54c22','M6 11L13 8L23 9L28 14L30 23L27 29H5L1 25L2 18Z'],['#ee8d43','M7 12L13 9L23 11L27 17L28 25L24 28H8L3 25L4 18Z'],['#efac63','M3 23L8 21L10 28H5ZM21 24L27 22L28 28H22Z'],['#292626','M6 15H10L12 18L10 22H6L4 19ZM20 14H24L26 18L24 22H20L18 18Z'],['#f5ead1','M6 16H8V18H6ZM20 15H22V17H20Z'],['#60646b','M6 0H11L15 4L13 13L10 17L4 10L2 5Z'],['#aeb4b0','M6 2H10L12 5L11 11L9 13L5 9L4 5Z'],['#d6d9ca','M5 0H7V2H5ZM1 4H3V6H1ZM2 9H4V11H2ZM11 2H13V4H11Z'],['#713c2c','M12 22L15 24L18 22L17 25H14Z']];
  art.power=[['#dda87a','M6 10L9 5H23L27 11L28 26L24 27L22 18H10L8 27L3 25Z'],['#c63e45','M9 6L10 0L13 6ZM21 6L24 0L24 8Z'],['#f4d5af','M9 10H24V18L20 22H13L9 18Z'],['#df9550','M11 12H14V16H11ZM20 12H23V16H20Z'],['#a82c38','M12 12H13V16H12ZM21 12H22V16H21Z'],['#f0be8b','M8 10L17 5L24 9L22 12L18 9L13 16L13 10L9 14Z'],['#314e5b','M8 21H13L16 25L20 21H24L27 29L23 30L21 25L20 31H11L10 26L8 30L4 28Z'],['#ede6cf','M13 21H20L18 30H14Z'],['#252630','M15 22H17V29H15ZM10 30H15V32H10ZM18 30H23V32H18Z'],['#d67b76','M14 18H20V20H14Z'],['#fff1dc','M14 18H16V19H14ZM18 18H20V19H18Z']];
  art.reze=[['#282943','M6 8L10 3H22L27 9V20L23 24L20 18H10L6 21L3 16Z'],['#474869','M7 8L12 4H21L25 9L24 17L20 13L13 14L8 18L5 15Z'],['#eacdb4','M10 10H23V19L19 23H13L9 18Z'],['#508a68','M11 14H14V16H11ZM20 13H23V15H20Z'],['#363651','M7 10L14 5L20 7L19 12L13 18L13 11L9 15Z'],['#f0ebda','M11 23H21L24 28L21 29H11L8 27Z'],['#26262e','M15 23H17L19 28H13ZM10 29H22V31H10ZM10 31H14V32H10ZM19 31H23V32H19Z']];
  art.snorlax=[['#254e59','M6 10L5 3L11 6L15 5L21 6L27 3L26 12L30 19L31 27L27 31H5L1 27L2 18Z'],['#e3d7ae','M9 9L14 11L17 9L23 10L25 17L28 24L25 29H8L4 25L7 18Z'],['#284650','M9 12H13V13H9ZM19 12H23V13H19ZM13 16H20V17H13Z'],['#f4e9cf','M11 16H13V18H11ZM20 16H22V18H20Z'],['#baab89','M3 28H10V32H3ZM23 28H30V32H23Z']];
  art.lugia=[['#c8d6d9','M12 12L10 8L11 2L14 5L17 3L20 0L21 4L19 10L19 14L23 13L29 6L32 5L31 10L28 15L31 12L32 14L27 19L23 20L22 26L28 28L27 31L20 30L17 28L13 31H8L7 29L10 25L10 21L5 21L1 17L0 13L4 15L1 10L2 8L8 15Z'],['#f0f0df','M12 5L14 8L18 5L17 11L16 15L20 17L21 24L17 28L12 27L11 21L12 16L9 16L5 18L3 15L9 17L14 14ZM21 17L26 13L30 8L28 14L25 18Z'],['#547fab','M13 18L18 17L20 22L18 26H14L12 23ZM15 8L19 6L18 10L15 12ZM22 24L24 23L25 26L23 27Z'],['#273f63','M16 9H18V10H16Z']];
  art.bear=[['#34291f','M6 12L3 8V4L7 2L11 4H21L25 2L29 4V9L26 13L28 20L31 25L28 30H21L18 28H14L11 30H4L1 26L5 21Z'],['#a17750','M7 12L5 8V5L8 4L12 7H20L24 4L27 5V8L24 12L26 22L29 26L27 28H22L20 25H11L9 28H4L3 26L7 21Z'],['#d5b88c','M11 16H21L24 22L21 26H10L8 22ZM6 5H9V8H6ZM24 5H26V8H24Z'],['#302a25','M10 11H12V14H10ZM21 11H23V14H21ZM14 15H19L17 18H16Z'],['#7d503c','M13 19H20V20H13Z'],['#738761','M9 21L16 23L22 21V25L16 24L9 25Z']];
  art.toph=[['#1e2724','M12 1H21L25 4V8L27 11V21H23L21 16H11L8 21H5V12L9 8V4Z'],['#ead4a5','M10 10H23V19L20 23H13L9 18Z'],['#59794b','M8 9L11 7H22L25 10V12H8Z'],['#242d26','M9 12L14 10L15 14L10 15ZM17 11L23 12V14L19 15Z'],['#dce1ce','M10 16H14V18H10ZM19 16H23V18H19Z'],['#b3c7b5','M12 16H13V18H12ZM20 16H21V18H20Z'],['#638650','M10 22H23L27 28H22L21 31H11L10 28H5Z'],['#e4d1a0','M14 23H20V28H14ZM5 28H11V31H5ZM22 28H28V31H22Z']];
  // A cap makes Pikachu readable even at the small preview size.
  art.pikachu.push(['#b4463e','M8 7L10 3H22L26 7V10H10L6 12L5 10Z'],['#f1dfc0','M17 4H22V8H17Z']);
  const collectibles=[['pochita','Pochita · Chainsaw Man'],['power','Power · Chainsaw Man'],['pikachu','Pikachu · Pokémon'],['snorlax','Snorlax · Pokémon'],['reze','Reze · Chainsaw Man'],['lugia','Lugia · Pokémon']];
  const replies={pochita:'Pochita dá um pulinho e encosta a serrinha no seu dedo. Um contrato de amizade, sem letras miúdas.',power:'Power ergue os braços: «Contemplem a grande Power!» Depois aponta para o lugar de honra na estante.',pikachu:'Pikachu ajeita o boné. «Pika!» Uma faísca pequenininha ilumina as bochechas.',snorlax:'Snorlax abre um olho, boceja e volta a dormir. A estante é oficialmente uma área de descanso.',reze:'Reze sorri discretamente e oferece uma flor. Por um instante, parece só uma visita tranquila ao café.',lugia:'Lugia abre as asas e inclina a cabeça. Uma brisa suave passa pela coleção.'};
  const arcade={
    'fliperama':['Packet Invaders','arcade', 'Jogar Packet Invaders'],
    'fliperama-luta':['ROUND 1 → K.O.','fight','Executar um combo'],
    'fliperama-nave':['DOUBLE SHIP!','shoot','Resgatar a nave'],
    'fliperama-slug':['MISSION COMPLETE!','slug','Chamar o tanque'],
    'fliperama-blocos':['TETRIS × 4','blocks','Completar quatro linhas'],
    'fliperama-corrida':['CHECKPOINT!','race','Fazer uma curva'],
    'pachinko':['JACKPOT!','pachinko','Soltar as bolinhas'],
    'pinball':['MULTIBALL!','pinball','Acionar os flippers']
  };
  g.PortfolioRoom={art,draw,svg,collectibles,install(Component){
    const p=Component.prototype,base={};
    const wrap=(name,fn)=>{base[name]=p[name];p[name]=function(...args){return fn.call(this,base[name].bind(this),...args);};};
    wrap('data',function(fn){const d=fn();if(d.roomEnhanced)return d;d.roomEnhanced=true;
      const set=(id,extra)=>Object.assign(d.room.find(o=>o.id===id),extra);
      set('pelucia-gigante',{name:'Urso de pelúcia',art:'bear',text:'Um urso macio com um laço verde. Companheiro das maratonas de jogo, sempre pronto para um abraço.',acts:[['Abraçar o urso','prop:bear']]});
      set('cama',{text:'Um pequeno Mimikyu guarda a cama. Debaixo do disfarce, só quer fazer companhia.',acts:[['Ver Mimikyu','prop:mimikyu'],['Dormir','sleep']]});
      set('pelucia',{name:'Toph · Avatar',art:'toph',t:[12,11,1,1],v:[195,184,10,14],text:'Uma pequena Toph de coque, faixa verde e olhos claros. Sentada no tapete, parece escutar cada passo do quarto.',acts:[['Fazer carinho','prop:toph']]});
      d.room=d.room.filter(o=>o.id!=='lampada');
      set('cartola',{name:'Cartola de Hatty · BattleBlock Theater',t:[3,5,1,1],v:[49,83,12,12],art:'hat',text:'A cartola de Hatty Hattington, com fita vermelha e brilho inquietante. O espetáculo precisa continuar!',acts:[['Abrir as cortinas','prop:hat']]});
      set('espada',{name:'Espada e escudo · Castle Crashers',t:[8,0,1,2],v:[130,4,12,24],art:'sword',text:'Espada, escudo com cruz e o cavaleiro azul. Equipamento pronto para uma aventura cooperativa de Castle Crashers.',acts:[['Erguer o escudo','prop:sword']]});
      set('caderno',{name:'Caderno de Omori',art:'sketchbook',text:'O caderno em preto e branco de Omori. Abra uma página e descubra um pequeno desenho.',acts:[['Virar a página','prop:sketchbook']]});
      d.roomDeco=d.roomDeco.filter(t=>t[0]!==0||t[1]!==12);
      d.room.push({id:'colecao-pelucias',name:'Estante de personagens',t:[0,13,2,1],v:[0,203,32,19],face:'d',text:'Uma coletânea de alguns dos meus personagens favoritos. Cada um guarda uma história pela qual tenho muito carinho.',acts:collectibles.map(([key,name])=>[name,'prop:'+key])});
      d.room.push({id:'room-home',name:'Portal entre as folhas',portal:true,walk:true,t:[23,10,1,1],v:[368,160,16,16],text:'Um pequeno círculo escondido atrás da planta. A passagem leva ao alçapão acima do meu nome em kanji.',acts:[['Atravessar o portal','portal:home']]});
      set('puff',{acts:[['Sentar no puff','puff']]});
      set('drone',{acts:[['Enviar para reconhecimento','drone']]});
      set('decks',{acts:[['Ver no Archidekt','decks:archidekt'],['Ver no Moxfield','decks:moxfield']]});
      d.room.find(o=>o.id==='pc').acts.push(['Configurar idioma','language']);
      for(const [id,[label,mode,action]] of Object.entries(arcade)){const o=d.room.find(o=>o.id===id);o.face='u';if(mode!=='arcade')o.acts=[[action,'cab:'+id]];}
      d.room.find(o=>o.id==='fliperama-slug').acts.push(['Jogar Operação Circuito','shooter']);
      d.room.find(o=>o.id==='fliperama').acts.push(['Testar os escudos','cab:fliperama']);
      return d;
    });
    wrap('roomAct',function(fn,code,e){
      if(code==='language'){this.setState({languageOpen:true,rmDlg:false});return;}
      if(code.startsWith('prop:')){
        const key=code.slice(5);this._propPreview=key;this._propClock=this._rm?.clock||0;this._propTick=(this._propTick||0)+1;
        const owner=this.data().room.find(o=>o.art===key);
        if(owner)this.rmFxOn(owner.id);
        this.sfx(key==='bear'?'sit':key==='toph'?'bump':'select');
        const names=Object.fromEntries(collectibles);const text=replies[key]||{bear:'O urso afunda num abraço e volta à sua pose de sempre. Um bom lugar para descansar a cabeça.',mimikyu:'Mimikyu inclina a cabeça de pano e se aproxima um pouquinho. «...mimi?»',toph:'Toph dá uma batidinha no tapete. «Eu ouvi você chegando.» A pequena dobradora de terra sorri, confiante.',hat:'O show vai começar!',sword:'Escudo erguido. Equipe pronta.',sketchbook:'Uma nova página, um novo desenho.'}[key];
        this.say(text,names[key]||owner?.name||'Mimikyu');this.setState({rmDlg:true,rmIntro:false,propPreview:key,propFrame:this._propTick});return;
      }
      if(code.startsWith('cab:')){
        const id=code.slice(4),o=this.data().room.find(o=>o.id===id);this.rmFxOn(id);this._cabShow={id,at:this._rm?.clock||0,mode:arcade[id][1]};
        this.sfx(o.jingle);this.say(arcade[id][0],o.name);this.setState({rmDlg:true,rmIntro:false,roomObj:this.data().room.indexOf(o)});return;
      }
      return fn(code,e);
    });
    wrap('look',function(fn,i){this._propPreview=this.data().room[i].art||'';this.setState({propPreview:this._propPreview});return fn(i);});
    wrap('renderVals',function(fn){const r=fn();r.propFrame=this.st().propFrame||0;r.propImage=svg(this.st().propPreview);r.propOn=!!art[this.st().propPreview];r.propName=Object.fromEntries(collectibles)[this.st().propPreview]||this.data().room.find(o=>o.art===this.st().propPreview)?.name||'Mimikyu';return r;});
    p.drawLargePlush=function(ctx,x,y){
      const age=(this._rm?.clock||0)-(this._propClock||-9000),hug=this._propPreview==='bear'&&age<1200&&!this.calm();
      draw(ctx,'bear',x+2,y+(hug?Math.sin(age/70):0),23,27);
    };
    p.drawRoomProps=function(ctx,rm){
      const x=n=>n-rm.camX,y=n=>n-rm.camY;
      // Cover only the old plushies; the bed and wooden shelf remain visible.
      ctx.fillStyle='#385f4a';ctx.fillRect(x(3),y(48),26,13);
      draw(ctx,'mimikyu',x(7),y(49),9,10);
      // The collection is inside a north-facing cabinet, seen from its wooden back.
      ctx.fillStyle='#493725';ctx.fillRect(x(0),y(192),32,31);
      ctx.fillStyle='#718171';ctx.fillRect(x(2),y(193),28,8);ctx.fillStyle='#a7b09a';ctx.fillRect(x(4),y(195),24,1);ctx.fillRect(x(4),y(199),24,1);
      ctx.fillStyle='#30271d';ctx.fillRect(x(0),y(204),32,19);ctx.fillStyle='#705139';ctx.fillRect(x(1),y(207),30,14);
      ctx.fillStyle='#957251';ctx.fillRect(x(0),y(203),32,4);ctx.fillStyle='#423326';ctx.fillRect(x(15),y(208),1,13);
      ctx.fillStyle='#929d70';ctx.fillRect(x(4),y(200),4,3);ctx.fillStyle='#526d4a';ctx.fillRect(x(3),y(197),6,3);
      ctx.fillStyle='#d0ad77';ctx.fillRect(x(20),y(201),8,2);ctx.fillStyle='#709293';ctx.fillRect(x(22),y(199),5,2);
      // Rebuild the small rug in pixel rows so the removed plush leaves no rectangular patch.
      for(let row=-14;row<=14;row++){
        const width=Math.round(39*Math.sqrt(Math.max(0,1-row*row/196)));
        ctx.fillStyle='#385f5d';ctx.fillRect(x(200-width),y(192+row),width*2,1);
        if(width>4){ctx.fillStyle='#a49868';ctx.fillRect(x(200-width),y(192+row),2,1);ctx.fillRect(x(198+width),y(192+row),2,1);}
      }
      draw(ctx,'toph',x(195),y(184),10,14);
      // Restore floor under the old three-item shelf, then hide references around the room.
      ctx.fillStyle='#493725';ctx.fillRect(x(0),y(175),49,16);
      ctx.fillStyle='#241c15';ctx.fillRect(x(0),y(183),49,1);ctx.fillRect(x(25),y(175),1,8);ctx.fillRect(x(8),y(184),1,7);
      draw(ctx,'hat',x(49),y(83),10,10);draw(ctx,'sword',x(130),y(4),10,20);
      ctx.fillStyle='#705433';ctx.fillRect(x(32),y(48),16,16);draw(ctx,'sketchbook',x(34),y(50),12,12);
      const active=this._propPreview,age=(rm.clock-(this._propClock||-9000));
      if(age<1800&&!this.calm()){
        const pos={toph:[200,198],hat:[55,90],sword:[136,22],bear:[88,48]}[active];
        if(pos&&age>=0){ctx.save();ctx.globalAlpha=1-age/1800;ctx.strokeStyle='#b5d69a';ctx.beginPath();ctx.ellipse(x(pos[0]),y(pos[1]),6+age/110,2+age/450,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
      }
      const drone=this._drone;
      if(drone){
        ctx.fillStyle='#493725';ctx.fillRect(x(160),y(208),16,16);
        const progress=Math.min(drone.path.length-1,drone.t/260),i=Math.floor(progress),a=drone.path[i],b=drone.path[Math.min(i+1,drone.path.length-1)],k=progress-i;
        const xx=x((a[0]+(b[0]-a[0])*k)*16+4),yy=y((a[1]+(b[1]-a[1])*k)*16+7);
        ctx.fillStyle='#15231e';ctx.fillRect(xx-2,yy+2,13,3);ctx.fillStyle='#99aca0';ctx.fillRect(xx,yy,9,4);ctx.fillStyle='#79945c';ctx.fillRect(xx+3,yy-2,4,3);ctx.fillStyle='#e6ca6f';ctx.fillRect(xx+6,yy,2,1);
      }
      const show=this._cabShow;
      const elapsed=show?rm.clock-show.at:-1;
      if(show&&(elapsed<0||elapsed>=2800))this._cabShow=null;
      if(show&&elapsed>=0&&elapsed<2800){
        const o=this.data().room.find(o=>o.id===show.id),[xx,yy,w]=o.v,phase=elapsed/2800;
        ctx.save();ctx.beginPath();ctx.rect(x(xx+2),y(yy+7),w-4,16);ctx.clip();
        ctx.fillStyle='#08120e';ctx.fillRect(x(xx+2),y(yy+7),w-4,16);
        ctx.fillStyle='#f4d377';
        if(show.mode==='blocks'){for(let j=0;j<4;j++)ctx.fillRect(x(xx+3),y(yy+20-j*3),Math.round((w-6)*(1-phase)),2);}
        else if(['pinball','pachinko'].includes(show.mode)){for(let j=0;j<5;j++)ctx.fillRect(x(xx+4+(j*3)%Math.max(1,w-7)),y(yy+8+(phase*40+j*3)%13),1,1);}
        else if(show.mode==='race'){ctx.fillRect(x(xx+w/2+Math.sin(phase*12)*4),y(yy+16),3,5);ctx.fillStyle='#fff';ctx.fillRect(x(xx+w/2),y(yy+8),1,4);}
        else if(show.mode==='fight'){ctx.fillRect(x(xx+3+phase*5),y(yy+14),3,7);ctx.fillRect(x(xx+w-7-phase*4),y(yy+14),3,7);}
        else {ctx.fillRect(x(xx+3+phase*(w-9)),y(yy+17),5,3);ctx.fillRect(x(xx+7+phase*(w-9)),y(yy+12),1,4);}
        ctx.restore();
      }
    };
  }};
})(window);
