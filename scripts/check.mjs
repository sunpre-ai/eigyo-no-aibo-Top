// 外部通信や業務処理を実行せず、公開前に構文・資材・既存テストを確認する。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
function required(file) {
  if (!fs.statSync(path.join(root, file), { throwIfNoEntry: false })?.isFile())
    throw Error('必要なファイルがありません：' + file);
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['.git', 'node_modules', '.github', 'docs'].includes(entry.name)) return [];
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(name) : [path.relative(root, name)];
  });
}
function node(args, input) {
  const result = spawnSync(process.execPath, args, { cwd: root, input, encoding: 'utf8', stdio: input === undefined ? 'inherit' : 'pipe' });
  if (result.error || result.status !== 0) {
    if (input !== undefined) process.stderr.write(result.stderr || '');
    throw Error('検証に失敗しました：' + args.join(' ') + (result.error ? ' ' + result.error.message : ''));
  }
}
try {
  for (const file of ['AGENTS.md', 'README.md', 'docs/共同編集.md', 'docs/運用ルール(AI用).md', '.github/PULL_REQUEST_TEMPLATE.md', '.github/workflows/preview-check.yml']) required(file);
  const files = walk(root);
  for (const file of files.filter(name => /\.(?:js|mjs|cjs)$/.test(name))) node(['--check', file]);
  for (const file of files.filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc\s*=/.test(match[1]) || !match[2].trim()) continue;
      const type = match[1].match(/\btype\s*=\s*['"]([^'"]+)['"]/i)?.[1];
      if (type === 'module') node(['--check', '--input-type=module'], match[2]);
      else if (!type || /^(?:text|application)\/javascript$/.test(type)) new vm.Script(match[2], { filename: file });
    }
  }
  const html = fs.readFileSync('app/index.html', 'utf8');
  function asset(value, base = 'app/') {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return;
    const url = new URL(value, 'https://example.test/' + base);
    const file = decodeURIComponent(url.pathname).slice(1);
    required(file.endsWith('/') ? file + 'index.html' : file);
  }
  for (const match of html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)\s*=\s*['"]([^'"]+)['"]/gi)) asset(match[1]);
  const manifest = JSON.parse(fs.readFileSync('app/manifest.json', 'utf8'));
  for (const icon of manifest.icons || []) asset(icon.src);
  asset(manifest.start_url || './');
  const tests = fs.readdirSync('tests').filter(name => name.endsWith('.test.cjs')).sort().map(name => 'tests/' + name);
  if (!tests.length) throw Error('検証対象のテストがありません');
  node(['--test', ...tests]);
  console.log('構文・本アプリの参照先ファイル・共通文書・既存テストを確認しました（外部通信・本番書込なし）。');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
