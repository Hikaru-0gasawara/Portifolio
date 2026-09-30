(function(g){
  const entries=[
    ['ghost-laugh','Abraço de urso','Abrace o urso de pelúcia.','Um abraço para recarregar as energias.',true],
    ['little-sun','Lugar do jogador dois','Sente no puff em frente à TV.','O segundo controle é seu.',true],
    ['curtain-call','Abrem-se as cortinas','Descubra a cartola de Hatty.','O espetáculo começou.',true],
    ['party-guard','Pronto para o cooperativo','Erga o escudo de Castle Crashers.','A equipe pode contar com você.',false],
    ['sketch-page','Página em branco','Vire uma página do caderno de Omori.','Uma nova ideia ganhou forma.',true],
    ['plush-club','Clube das pelúcias','Interaja com as seis pelúcias da coleção.','Você conheceu toda a turma.',false],
    ['earth-lesson','Lição de terra','Veja Hikaru tropeçar em uma pedrinha.','Toph recomenda prestar atenção no chão.',false],
    ['honour-die','O peso da honra','Role o D20 dourado.','Um dado dourado para lembrar o Honour Mode.',false],
    ['gallery-reader','Além da capa','Veja a segunda imagem dos quatro projetos.','Você explorou os esquemas de cada projeto.',false],
    ['circuit-start','Primeira missão','Jogue Operação Circuito no fliperama de tiro.','O circuito está sob sua proteção.',false],
    ['tank-call','Reforço blindado','Chame o tanque dentro de Operação Circuito.','Reforços chegaram.',false],
    ['circuit-win','Circuito protegido','Conclua Operação Circuito com 2.400 pontos.','Todos os setores estão seguros.',false],
    ['boot-recovery','Nada que um reboot não resolva','Reinicie após a falha fictícia do boot.','O sistema voltou e nenhum arquivo foi perdido.',true],
    ['desktop-login','Bem-vindo ao desktop','Sente e abra o computador do quarto.','Okaru Desktop está pronto para explorar.',false],
    ['fetch-yourself','Conheça sua máquina','Execute neofetch no terminal do computador.','Uma ficha técnica inteiramente de faz de conta.',true],
    ['desktop-resume','Currículo na área de trabalho','Abra a prévia do currículo dentro do computador.','O próximo capítulo começa por aqui.',false],
    ['portal-return','Viagem de volta','Use um pedestal para voltar ao início.','Você encontrou um atalho entre as páginas.',false],
    ['hitbox-classics','Memória muscular','Execute dez golpes clássicos diferentes na hitbox.','Dez homenagens aos jogos de luta, um só controle.',false],
    ['cartridge-tour','Cinco gerações de diversão','Jogue com os cinco controles clássicos.','Cada controle tem uma história e um jogo.',false]
  ];
  g.PortfolioAchievements={entries,install(C){
    const p=C.prototype,base={};
    const wrap=(name,fn)=>{base[name]=p[name];p[name]=function(...args){return fn.call(this,base[name].bind(this),...args);};};
    wrap('data',function(fn){const d=fn();if(!d.extraAchievements){d.extraAchievements=true;for(const [id,name,goal,done,secret] of entries){d.trophies.push({id,name,goal,done,secret,hint:goal,ic:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z'});d.hints[id]=goal;}}return d;});
    wrap('roomAct',function(fn,code,e){
      const r=fn(code,e),key=code.slice(5),id={bear:'ghost-laugh',hat:'curtain-call',sword:'party-guard',sketchbook:'sketch-page'}[key];
      if(code.startsWith('prop:')){if(id)this.unlock(id);const collection=g.PortfolioRoom.collectibles.map(x=>x[0]);if(collection.includes(key)){this._plushMeet={...this._plushMeet,[key]:true};if(collection.every(k=>this._plushMeet[k]))this.unlock('plush-club');this.persistSoon();}}
      return r;
    });
    wrap('tripStart',function(fn,...args){const r=fn(...args);this.unlock('earth-lesson');return r;});
    wrap('d20Land',function(fn,r){fn(r);this.unlock('honour-die');});
    wrap('galleryMove',function(fn,delta){const s=this.st(),length=this.data().projects[s.openProj]?.gallery?.length||0,next=length?((s.galleryIndex||0)+delta+length)%length:0;fn(delta);if(next>0){this._galleryRead={...this._galleryRead,[s.openProj]:true};if(Object.keys(this._galleryRead).length===this.data().projects.length)this.unlock('gallery-reader');this.persistSoon();}});
  }};
})(window);
