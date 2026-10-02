(function (g) {
  let locale = 'pt';
  const catalogs = g.PORTFOLIO_LOCALES || {};
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const phrases=Object.keys(catalogs).filter(k=>k.length>2).sort((a,b)=>b.length-a.length);
  const fragments=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+phrases.map(escape).join('|')+')(?![\\p{L}\\p{N}_])','gu');
  function translate(value, to) {
    if (typeof value !== 'string' || !value.trim()) return value;
    const entry = catalogs[normalize(value)];
    if(entry?.[to])return value.replace(value.trim(), entry[to]);
    return value.replace(fragments,part=>catalogs[part]?.[to]||part);
  }
  const t = value => translate(value, locale);
  // A specific language, whatever the current one is (the language picker speaks to every visitor).
  const tIn = (value, to) => translate(value, ['pt','en','ja'].includes(to) ? to : locale);
  // keep=false shows a language without choosing it, e.g. a first visit greeted in the browser's language.
  function set(next, keep=true) {
    if (!['pt','en','ja'].includes(next)) return;
    locale = next;
    document.documentElement.lang = {pt:'pt-BR',en:'en',ja:'ja'}[next];
    document.documentElement.dir='ltr';
    document.title = {pt:'Portfólio',en:'Portfolio',ja:'ポートフォリオ'}[next] + ' — Hikaru Ogasawara';
    if (keep) try { localStorage.setItem('okaru-language', next); } catch { /* Storage may be disabled. */ }
  }
  function preferred() {
    try { const saved = localStorage.getItem('okaru-language'); if (['pt','en','ja'].includes(saved)) return saved; } catch {}
    return /^ja/.test(navigator.language) ? 'ja' : /^pt/.test(navigator.language) ? 'pt' : 'en';
  }
  function saved(){try{const value=localStorage.getItem('okaru-language');return ['pt','en','ja'].includes(value)?value:null;}catch{return null;}}
  // Translation happens at the rendering boundary, without rewriting React-owned DOM.
  const create = g.React.createElement;
  // Mixed-language UI needs literal leaves, created before the translation wrapper.
  // React elements also pass through the template runtime without string interpolation.
  const nativeText = (text, lang) => create('span', {key:lang, lang, translate:'no'}, text);
  g.React.createElement = function (type, props, ...children) {
    if (props) {
      props = {...props};
      for (const key of ['title','aria-label','placeholder','alt']) if (props[key]) props[key] = t(props[key]);
    }
    const translate = child => Array.isArray(child) ? child.map(translate) : t(child);
    return create(type, props, ...children.map(translate));
  };
  g.PortfolioI18n = {t,tIn,set,preferred,saved,nativeText,get locale(){ return locale; }};
})(window);
