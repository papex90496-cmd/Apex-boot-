const fs=require('fs');
async function transcribeAudio(mediaPath){
  const form=new FormData();
  form.append('file', new Blob([fs.readFileSync(mediaPath)]), 'audio.ogg');
  form.append('model','whisper-large-v3-turbo');
  const r=await fetch('https://api.groq.com/openai/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${process.env.GROQ_API_KEY}`},body:form});
  const j=await r.json();
  return j.text||'';
}
module.exports={transcribeAudio};
