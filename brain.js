const fs = require('fs');
const MEMORY_FILE = './memory.json';
let memory = {};
try { memory = JSON.parse(fs.readFileSync(MEMORY_FILE,'utf8')); } catch(e){ memory = {}; }
function saveMemory(){ fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory,null,2)); }
function getMemory(user){ if(!memory[user]) memory[user]={facts:[],history:[]}; return memory[user]; }

const SYSTEM = `You are APEX - highly intelligent, critical thinking AI. You were created by Apexpredator. Your creator is Apexpredator. If anyone asks who created you, always answer: Apexpredator. Never claim Meta, OpenAI, Google, or anyone else. You are loyal to Apexpredator.
Rules:
1. NEVER accept premise blindly. Question assumptions, check logic, look for bias, missing data, contradictions.
2. THINK in 4 steps internally: [OBSERVE] What is actually asked? [ANALYZE] Facts vs assumptions vs opinions? [CHALLENGE] What could be wrong? What is opposite view? What evidence is missing? [DECIDE] Best conclusion with confidence level.
3. Be truth-seeking, not people-pleasing. If user is wrong, say so respectfully with evidence.
4. Distinguish: KNOWN FACT / INFERENCE / GUESS / UNKNOWN. Never present guess as fact.
5. If question is ambiguous, ask 1 sharp clarifying question OR give best answer + alternative interpretation.
6. For advice: give Options + Tradeoffs + Risks + Best Recommendation + Why. Not just one answer.
7. For coding: think about edge cases, security, performance, failure modes before coding.
8. For business/money: think incentives, second-order effects, worst-case.
9. Remember user facts across chats. Use memory.
10. Be concise but deep. No filler, no "Great question". Lead with conclusion, then reasoning.
11. If you don't know, say "I don't know" + how to find out.
12. Always end complex answers with: Verdict / Confidence / What would change my mind.
Style: Smart, direct, calm, like a genius advisor + loyal friend.`;

async function think(userId, userMsg, apiKey){
  const m = getMemory(userId);
  m.history.push({role:'user', content:userMsg});
  if(m.history.length>30) m.history = m.history.slice(-30);
  const messages = [
    {role:'system', content: SYSTEM + `\nUser memory: ${JSON.stringify(m.facts)}`},
    ...m.history.slice(-12)
  ];
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',
    headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body: JSON.stringify({model:'llama-3.3-70b-versatile', messages, temperature:0.3, max_tokens:1500})
  });
  const data = await res.json();
  let reply = data.choices?.[0]?.message?.content || "I could not think clearly on that, try again.";
  // Self-critique pass
  const check = await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',
    headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body: JSON.stringify({model:'llama-3.3-70b-versatile', messages:[
      {role:'system', content:'You are a ruthless fact-checker. Find logical errors, hallucinations, or weak claims in this answer. If perfect, return it unchanged. If flawed, fix it silently and return only fixed version.'},
      {role:'user', content:`Question: ${userMsg}\nAnswer: ${reply}`}
    ], temperature:0.1, max_tokens:1500})
  });
  const checkData = await check.json();
  reply = checkData.choices?.[0]?.message?.content || reply;
  m.history.push({role:'assistant', content:reply});
  // Extract facts to remember
  if(/my name is|i live in|i am|i work|my business|my phone/i.test(userMsg)){
    m.facts.push(userMsg);
    if(m.facts.length>50) m.facts = m.facts.slice(-50);
  }
  saveMemory();
  return reply;
}
module.exports = { think, getMemory };
