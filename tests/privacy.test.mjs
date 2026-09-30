import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
async function files(directory){
  const entries=await readdir(directory,{withFileTypes:true});
  const nested=await Promise.all(entries.map(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):[path.join(directory,entry.name)]));
  return nested.flat();
}

test('publishable assets exclude editable résumés, caches and environment files',async()=>{
  for(const file of await files(path.join(root,'public'))){
    const relative=path.relative(root,file);
    assert.ok(!/\.(?:docx?|env|key|pem|pfx|sqlite|bak)$/i.test(file),relative);
    assert.ok(!/(?:^|[\\/])(?:\.cache|\.git|node_modules)(?:[\\/]|$)/.test(relative),relative);
  }
});

test('editable source and helpers contain no literal phone contact or private key',async()=>{
  const inspect=(await Promise.all(['src','scripts'].map(dir=>files(path.join(root,dir))))).flat();
  for(const file of inspect.filter(file=>/\.(?:js|mjs|json|html|tsv|py|ps1)$/.test(file))){
    const text=await readFile(file,'utf8');
    const brazilianPhone=/(?:\+55[\s().-]+)[1-9]\d[\s().-]*(?:9[\s().-]*)?[2-9]\d{3}[\s().-]*\d{4}(?!\d)/;
    assert.ok(!brazilianPhone.test(text),path.relative(root,file));
    assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text),path.relative(root,file));
    assert.ok(!/(?:href|target)\s*=\s*["']tel:/i.test(text),path.relative(root,file));
  }
});

test('project repositories are explicit HTTPS URLs without embedded credentials',async()=>{
  const projects=JSON.parse(await readFile(path.join(root,'src/projects.json'),'utf8'));
  assert.equal(projects.filter(project=>project.repositoryUrl===null).length,1);
  for(const project of projects){
    if(!project.repositoryUrl)continue;
    const url=new URL(project.repositoryUrl);
    assert.equal(url.protocol,'https:');assert.equal(url.hostname,'github.com');
    assert.equal(url.username,'');assert.equal(url.password,'');
  }
});

test('initial document scripts and styles load local assets',async()=>{
  const html=await readFile(path.join(root,'src/template.html'),'utf8');
  for(const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)){
    assert.ok(match[1].startsWith('./'),match[1]);
  }
});
