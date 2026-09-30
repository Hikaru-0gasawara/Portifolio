(function (g) {
  g.PortfolioSkills = { layout(S) {
    const nodes = [{ k: 'root', x: 286, y: 22, ...S.root, cls: 'is-root', tx: 16, ta: 'start' }];
    const links = [], heads = [];
    // Unequal depths and side branches preserve each skill's category.
    const paths = [ [[56,108],[56,168],[94,230],[94,294],[120,350]], [[222,100],[192,146],[224,206],[192,254],[220,308]], [[366,126],[394,188],[354,226],[394,280],[390,326]], [[534,104],[548,144],[504,188],[548,238],[534,278]] ];
    S.branches.forEach((b, bi) => {
      const pts = paths[bi], hx = pts[0][0], hy = pts[0][1]-32;
      heads.push({ x: hx, y: hy, t: b.name });
      links.push({ d: `M286 32 C286 50 ${hx} 40 ${hx} ${hy-12}`, cls: 'is-on' });
      let prev = [hx,hy+8];
      [...b.nodes, { k: b.k+'-next', ...S.locked }].forEach((n,i) => {
        const [x,y] = pts[i], lock = i === b.nodes.length;
        const cls = lock ? 'is-lock' : 'is-on';
        links.push({ d: `M${prev[0]} ${prev[1]} V${(prev[1]+y)/2} H${x} V${y-10}`, cls });
        nodes.push({ ...n,x,y,cls,tx:bi===3?-16:16,ta:bi===3?'end':'start' });
        prev=[x,y+10];
      });
    });
    return {nodes,links,heads};
  }};
})(window);
