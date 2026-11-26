const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('app/index.html','utf8');
function extract(name){const i=source.indexOf('function '+name+'('),j=source.indexOf('\nfunction ',i+10);return source.slice(i,j);}
function ui(role='CAD',canAssign=true){const data={user:{name:'架空リーダー',alias:'水'},projects:[],quoteAssignmentPeople:{canAssignCad:canAssign,sales:[{name:'架空営業',alias:'営'}],cadForLeader:[{name:'架空CAD',alias:'甲'}]},quoteCadAssignmentRequests:[{id:'Q-test',customer:'架空会社',site:'架空現場',sales:'営',quoteDeadline:'2026-12-10'}]};const c=vm.createContext({data,role,escape:s=>String(s??'').replaceAll('<','&lt;').replaceAll('"','&quot;'),notificationReadState:()=>({pending:new Set()})});for(const f of ['quoteAssignmentPanel','quoteCadAssignmentHome','notificationItem'])vm.runInContext(extract(f),c);return c;}
const quote={id:'Q-test',source:'見積',outcome:'見積',sales:'営',cad:'',quoteVersion:1};
test('水金の担当決めはCAD選択だけで営業や金額の入力を出さない',()=>{const c=ui();const html=c.quoteAssignmentPanel(quote);assert.match(html,/data-quote-cad-assignment/);assert.match(html,/name="cad"/);assert.doesNotMatch(html,/name="sales"|name="amount"|name="cost"/);assert.match(html,/架空CAD/);assert.equal(c.quoteAssignmentPanel({...quote,quoteVersion:2}),'');c.data.quoteCadAssignmentRequests=[];assert.equal(c.quoteAssignmentPanel(quote),'');});
test('他CADと閲覧プレビューには担当決めを表示しない',()=>{assert.equal(ui('CAD',false).quoteAssignmentPanel(quote),'');const c=ui();c.data.adminPreview={};assert.equal(c.quoteAssignmentPanel(quote),'');assert.equal(c.quoteCadAssignmentHome([]),'');});
test('自分の案件一覧に未取得でも担当決め一覧と通知から案件へ進める',()=>{const c=ui();assert.match(c.quoteCadAssignmentHome([]),/架空会社.*架空現場/);assert.match(c.quoteCadAssignmentHome([]),/data-case="Q-test"/);assert.match(c.notificationItem({id:'quote-cad-leader:Q-test',caseId:'Q-test',subject:'担当決め依頼',body:'架空の通知',at:'2026-11-27',unread:true,mailStatus:'未送信'}),/data-case="Q-test"/);assert.match(source,/innerHTML=quoteCadAssignmentHome\(visible\(\)\)\+todayWorkHome/);});
test('営業登録は水金の担当決めを案内し、CAD決定は専用APIへ送る',()=>{assert.match(source,/data.quoteCadAssignmentByLeader \? '<p>担当CADは水金さんが決定/);assert.match(source,/rpc\('saveQuoteCadAssignment',token,f.dataset.quoteAssignment,\{cad:v.cad.value\}/);});
