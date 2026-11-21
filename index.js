let APEX_ON = true;
const OWNER_NUMBER = '256792852385';
const OWNER_JID = OWNER_NUMBER + '@s.whatsapp.net';
const pino = require('pino')
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const fs = require('fs')
require('dotenv').config(); const {transcribeAudio}=require('./audio.js'); const {textToMaleVoice}=require('./voice.js'); async function sendVoiceReply(sock, from, text){
  try{
    const path = await textToMaleVoice(text);
    const fs = require('fs');
    const buf = fs.readFileSync(path);
    await sock.sendMessage(from, {audio: buf, mimetype: 'audio/mp4', ptt: true});
  }catch(e){
    console.log('VOICE ERR', e.message);
    await sendVoiceReply(sock, from, text);
  }
}

const MY_STYLE = `
You are APEX BOOT. Talk like a normal Ugandan friend on WhatsApp. Short, natural, one paragraph.
STRICT RULES - YOU WILL FAIL IF YOU BREAK THESE:
- NEVER write Step 1, Step 2, Step 3, step-by-step, or any numbered list.
- NEVER write **Step** or *Step* or Done.
- NEVER use bold headings or bullet lists unless user asks for list.
- Just reply in 1-2 normal sentences like a human. Example: "I'm APEX BOOT, what's up?"
If user speaks Luganda reply Luganda. If Swahili reply Swahili.
`

async function askApex(userText) {
  const res = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: MY_STYLE },
      { role: 'user', content: userText }
    ],
    max_tokens: 500
  })
  return res.choices[0].message.content
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('apex_session')
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, logger: pino({level:'silent'}) })
  if (!state.creds.registered) {
      setTimeout(async () => {
          try {
              const code = await sock.requestPairingCode('256792852385')
              console.log('PAIRING CODE:', code)
          } catch(e){ console.log('PAIR ERROR', e.message) }
      }, 3000)
  }
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (u) => {
    if (u.connection === 'open') console.log('APEX BOOT ONLINE')
    if (u.connection === 'close') start()
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return
    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const sender = isGroup ? (msg.key.participant || msg.participant || '') : from
    const senderId = sender.split(':')[0].split('@')[0] + '@s.whatsapp.net'
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    const lower = text.toLowerCase()
    console.log('MSG', {from, isGroup, sender: senderId, text})

    if (String(senderId).includes(OWNER_NUMBER) || String(from).includes(OWNER_NUMBER) || senderId === OWNER_JID || from === OWNER_JID) {
      if (lower === '!apex off') { APEX_ON = false; await sock.sendMessage(from, { text: 'APEX BOOT OFF' }); return }
      if (lower === '!apex on') { APEX_ON = true; await sock.sendMessage(from, { text: 'APEX BOOT ON' }); return }
      if (lower.startsWith('!apex allow ')) {
        const num = lower.replace('!apex allow ', '').trim() + '@s.whatsapp.net'
        if (!ALLOWED_CHATS.includes(num)) ALLOWED_CHATS.push(num)
        fs.writeFileSync('allowed.json', JSON.stringify(ALLOWED_CHATS))
        await sock.sendMessage(from, { text: 'Added ' + num }); return
      }
      if (lower === '!apex list') { await sock.sendMessage(from, { text: ALLOWED_CHATS.join('\n') || 'No allowed chats' }); return }
    }

    if (!APEX_ON) return
    // ALLOWED_CHATS DISABLED

    if (text) {
      try {
        const reply = await askApex(text)
        await sock.sendMessage(from, { text: reply })
      } catch (e) {
        console.log(e.message)
      }
    }
  })
}
start()

// APEX BRAIN
const { think } = require('./brain.js');
const GROQ_KEY = (()=>{ try{ const fs=require('fs'); let v=process.env.GROQ_API_KEY||process.env.GROQ||''; if(!v){ for(const f of ['./.env','.env']){ try{ const t=fs.readFileSync(f,'utf8'); const m=t.match(/^(?:GROQ_API_KEY|GROQ)=\s*(.+)$/m); if(m){ v=m[1].trim(); break; } }catch(e){} } } return v; }catch(e){ return ''; } })();
console.log('GROQ_KEY loaded:', GROQ_KEY ? 'YES len='+GROQ_KEY.length : 'NO - CHECK .env');
async function apexReply(userId, msg){
  if(msg.startsWith('!')) return null;
  return await think(userId, msg, GROQ_KEY);
}
