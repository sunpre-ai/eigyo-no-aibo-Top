const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('CADホームに見本の主要区画がある', () => {
  const script = fs.readFileSync('mockup/mockup.js', 'utf8');
  for (const label of ['期限超過', '本日まで', '引き継ぎ・回答待ち', '重要連絡', '期限の近い仕事']) assert.ok(script.includes(label), label);
  assert.ok(script.includes('架空'));
});
