const STORAGE_KEY = "psychology-survey-responses-v1";
const imagePath = (n) => `assets/choice-${String(n).padStart(2, "0")}.png`;
const questions = [
  {
    title: "1、你现在的感受是愉悦还是不愉悦。",
    left: "非常愉快、开心、满足、充满希望",
    middle: "中性：既不愉快也不不愉快",
    right: "非常不愉快、烦恼、不满意"
  },
  {
    title: "2、你现在的感受是平静还是激动。",
    left: "极度兴奋、刺激、紧张、坐立不安",
    middle: "中性：既无激动也无平静",
    right: "极度平静、放松、困倦、昏昏欲睡"
  },
  {
    title: "3、你现在的感觉自己处于主导还是被支配的地位。",
    left: "感到被控制、很无力、很被动、被压制",
    middle: "",
    right: "感到有掌控力、有影响力、能主导自己的事情"
  }
];
let selections = [null, null, null];
let records = readLocalRecords();
let groups = {};

const $ = (id) => document.getElementById(id);
function readLocalRecords(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function writeLocalRecords(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function recordCode(record){ return record.participantCode ?? record.name ?? ""; }
function renderQuestions(){
  $("questions").innerHTML = questions.map((question, qi) => `<article class="question-card" data-question="${qi + 1}"><h3 class="question-title">${question.title}<small>单选</small></h3><p class="question-guidance"><span>${question.left}</span>${question.middle?`<span>${question.middle}</span>`:""}<span>${question.right}</span></p><div class="options" role="radiogroup" aria-label="${question.title}">${[1,2,3,4,5].map(score => { const n=qi*5+score; return `<label class="option" data-q="${qi}" data-score="${score}"><input type="radio" name="question-${qi+1}" value="${score}"/><img src="${imagePath(n)}" alt="第 ${score} 个图像选项"/></label>`; }).join("")}</div></article>`).join("");
  document.querySelectorAll(".option").forEach((option) => option.addEventListener("click", () => { const q=Number(option.dataset.q); selections[q]=Number(option.dataset.score); document.querySelectorAll(`.option[data-q="${q}"]`).forEach(el=>el.classList.remove("selected")); option.classList.add("selected"); $("questionError").textContent=""; }));
}
function validate(){ let ok=true; const code=$("participantCode").value.trim(); if(!code){$("nameError").textContent="请填写被试编号。";ok=false;}else{$("nameError").textContent="";} if(selections.some(v=>v===null)){$("questionError").textContent="请为三道题各选择一个图像。";ok=false;}else{$("questionError").textContent="";} return ok; }
async function submitRecord(record){
  if(location.protocol === "file:"){ records.unshift(record); writeLocalRecords(); return "本机演示模式"; }
  const config=window.SUPABASE_CONFIG || {};
  if(!config.url || !config.anonKey) throw new Error("问卷服务尚未配置，请联系研究人员。");
  const response=await fetch(`${config.url.replace(/\/$/,"")}/rest/v1/survey_responses`,{method:"POST",headers:{"Content-Type":"application/json",apikey:config.anonKey,Authorization:`Bearer ${config.anonKey}`,Prefer:"return=minimal"},body:JSON.stringify({participant_code:record.participantCode,q1_score:record.scores[0],q2_score:record.scores[1],q3_score:record.scores[2]})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(result.error || "提交失败，请稍后重试。");
  return "云端";
}
$("surveyForm").addEventListener("submit", async (event)=>{event.preventDefault();if(!validate())return;$("submitButton").disabled=true;$("saveState").textContent="正在提交…";$("saveState").classList.remove("error");const record={participantCode:$("participantCode").value.trim(),scores:[...selections],total:selections.reduce((a,b)=>a+b,0)};try{const source=await submitRecord(record);$("confirmationText").textContent=`被试编号 ${record.participantCode} 的回答已保存（${source}）。总分：${record.total} / 15。`;$("confirmation").hidden=false;if(source==="本机演示模式")renderRecords();window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});$("saveState").textContent="";}catch(error){$("saveState").textContent=error.message;$("saveState").classList.add("error");}finally{$("submitButton").disabled=false;}});
$("newResponseButton").addEventListener("click",()=>{selections=[null,null,null];$("participantCode").value="";document.querySelectorAll(".option").forEach(x=>x.classList.remove("selected"));$("confirmation").hidden=true;window.scrollTo({top:0,behavior:"smooth"});});
function formatDate(value){return new Date(value).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});}
function renderRecords(){ $("recordsBody").innerHTML=records.length?records.map(r=>`<tr><td><input type="checkbox" aria-label="选择 ${recordCode(r)}" data-pick="${r.id}" ${groups[r.id]?"checked":""}/></td><td>${escapeHtml(recordCode(r))}</td><td>${formatDate(r.createdAt)}</td><td>${r.scores[0]}</td><td>${r.scores[1]}</td><td>${r.scores[2]}</td><td><strong>${r.total}</strong></td><td><div class="record-actions"><button class="record-action" data-edit="${r.id}" type="button">修改</button><button class="record-action delete" data-delete="${r.id}" type="button">删除</button></div></td></tr>`).join(""):"<tr class=\"empty-row\"><td colspan=\"8\">暂无记录。完成一份问卷后，记录会显示在这里。</td></tr>"; document.querySelectorAll("[data-pick]").forEach(el=>el.addEventListener("change",()=>{if(el.checked){groups[el.dataset.pick]=groups[el.dataset.pick]||"A";}else delete groups[el.dataset.pick];renderGroupControls();renderComparison();}));document.querySelectorAll("[data-edit]").forEach(el=>el.addEventListener("click",()=>openEdit(el.dataset.edit)));document.querySelectorAll("[data-delete]").forEach(el=>el.addEventListener("click",()=>deleteRecord(el.dataset.delete)));renderGroupControls();renderComparison(); }
function openEdit(id){const r=records.find(x=>x.id===id);if(!r)return;$("editId").value=r.id;$("editName").value=recordCode(r);$("editQ1").value=r.scores[0];$("editQ2").value=r.scores[1];$("editQ3").value=r.scores[2];$("editDialog").showModal();}
function deleteRecord(id){const r=records.find(x=>x.id===id);if(!r||!confirm(`确定删除被试编号“${recordCode(r)}”这条记录吗？此操作不可恢复。`))return;records=records.filter(x=>x.id!==id);delete groups[id];writeLocalRecords();renderRecords();}
$("editForm").addEventListener("submit",event=>{event.preventDefault();const r=records.find(x=>x.id===$("editId").value);if(!r)return;r.participantCode=$("editName").value.trim();delete r.name;r.scores=[Number($("editQ1").value),Number($("editQ2").value),Number($("editQ3").value)];r.total=r.scores.reduce((a,b)=>a+b,0);r.updatedAt=new Date().toISOString();writeLocalRecords();$("editDialog").close();renderRecords();});
$("cancelEdit").addEventListener("click",()=>$("editDialog").close());
function renderGroupControls(){ $("groupControls").innerHTML=records.length?records.filter(r=>groups[r.id]).map(r=>`<div class="group-row"><span class="person" title="${escapeHtml(recordCode(r))}">${escapeHtml(recordCode(r))}</span><button class="${groups[r.id]==="A"?"active-a":""}" data-group="A" data-id="${r.id}">A 组</button><button class="${groups[r.id]==="B"?"active-b":""}" data-group="B" data-id="${r.id}">B 组</button></div>`).join(""):"<p class=\"muted\">先在上方记录列表勾选要比较的对象。</p>";document.querySelectorAll("[data-group]").forEach(btn=>btn.addEventListener("click",()=>{groups[btn.dataset.id]=btn.dataset.group;renderGroupControls();renderComparison();})); }
function renderComparison(){const a=records.filter(r=>groups[r.id]==="A"),b=records.filter(r=>groups[r.id]==="B");if(!a.length||!b.length){$("comparisonResult").innerHTML='<span class="result-kicker">COMPARE</span><h3>等待选择</h3><p>至少选择一条 A 组和一条 B 组记录，即可查看平均分与差异。</p>';return;}const avg=(arr,i)=>arr.reduce((s,r)=>s+r.scores[i],0)/arr.length;const totalAvg=arr=>arr.reduce((s,r)=>s+r.total,0)/arr.length;const ta=totalAvg(a),tb=totalAvg(b);$("comparisonResult").innerHTML=`<span class="result-kicker">COMPARE</span><h3>A 组 vs B 组</h3><div class="metric-row"><span>样本量</span><strong>${a.length} vs ${b.length}</strong></div><div class="metric-row"><span>总分均值</span><strong>${ta.toFixed(2)} vs ${tb.toFixed(2)}</strong></div><div class="metric-row"><span>总分差异（A−B）</span><strong class="${ta-tb>=0?"delta-positive":"delta-negative"}">${(ta-tb>=0?"+":"")}${(ta-tb).toFixed(2)}</strong></div><div class="metric-row"><span>题目均值（Q1 / Q2 / Q3）</span><strong>${[0,1,2].map(i=>avg(a,i).toFixed(2)).join(" / ")} vs ${[0,1,2].map(i=>avg(b,i).toFixed(2)).join(" / ")}</strong></div>`;}
$("refreshButton").addEventListener("click",async()=>{records=readLocalRecords();renderRecords();$("saveState").textContent="已刷新";setTimeout(()=>$("saveState").textContent="",1800);});
$("exportButton").addEventListener("click",()=>{if(!records.length)return;const rows=[["被试编号","提交时间","Q1","Q2","Q3","总分"],...records.map(r=>[recordCode(r),r.createdAt,...r.scores,r.total])];const csv="\ufeff"+rows.map(row=>row.map(cell=>`"${String(cell).replaceAll('"','""')}"`).join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`问卷记录-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);});
$("clearButton").addEventListener("click",()=>{if(!records.length)return;if(confirm("确定清空当前浏览器中的问卷记录吗？此操作不可恢复。")){records=[];groups={};writeLocalRecords();renderRecords();}});
function escapeHtml(value){return String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));}
renderQuestions();renderRecords();
