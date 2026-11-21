const { EdgeTTS } = require('node-edge-tts');
async function textToMaleVoice(text){
  const out = '/tmp/apex-voice.mp3';
  const tts = new EdgeTTS({ voice: 'en-US-GuyNeural', lang: 'en-US', outputFormat: 'audio-24khz-96kbitrate-mono-mp3' });
  await tts.ttsPromise((text||'Hello').slice(0,1000), out);
  return out;
}
module.exports = { textToMaleVoice };
