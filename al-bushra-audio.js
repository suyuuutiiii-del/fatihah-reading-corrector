(()=>{
const LANGS={en:'en-GB',ar:'ar-SA',yo:'yo-NG',ha:'ha-NG'};
const LABELS={
 en:{listen:'🔊 Listen',stop:'■ Stop',today:'🔊 Listen to today’s headlines',unsupported:'Audio reading is not supported on this browser.'},
 ar:{listen:'🔊 استمع',stop:'■ إيقاف',today:'🔊 استمع إلى عناوين اليوم',unsupported:'القراءة الصوتية غير مدعومة في هذا المتصفح.'},
 yo:{listen:'🔊 Gbọ́',stop:'■ Dúró',today:'🔊 Gbọ́ àwọn àkọlé òní',unsupported:'Fóònù yìí kò ṣe àtìlẹ́yìn fún ìkàwé ohùn.'},
 ha:{listen:'🔊 Saurara',stop:'■ Tsaya',today:'🔊 Saurari kanun labaran yau',unsupported:'Wannan burauzar ba ta goyon bayan karatun murya ba.'}
};
let speakingButton=null;
function lang(){return (document.getElementById('langSelect')||{}).value||localStorage.getItem('al-bushra-language')||'en'}
function label(k){const l=lang();return (LABELS[l]||LABELS.en)[k]}
function voices(){return window.speechSynthesis?window.speechSynthesis.getVoices():[]}
function chooseVoice(code){const vs=voices();return vs.find(v=>v.lang&&v.lang.toLowerCase()===code.toLowerCase())||vs.find(v=>v.lang&&v.lang.toLowerCase().startsWith(code.split('-')[0].toLowerCase()))||null}
function stopAudio(){if(window.speechSynthesis)window.speechSynthesis.cancel();if(speakingButton){speakingButton.textContent=label('listen');speakingButton=null}document.querySelectorAll('[data-audio-active="1"]').forEach(b=>{b.dataset.audioActive='0';b.textContent=label('listen')})}
function speak(text,button){if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){alert(label('unsupported'));return}stopAudio();const l=lang(),code=LANGS[l]||LANGS.en;const u=new SpeechSynthesisUtterance(text);u.lang=code;u.rate=l==='ar'?0.9:0.92;u.pitch=1;const v=chooseVoice(code);if(v)u.voice=v;if(button){speakingButton=button;button.dataset.audioActive='1';button.textContent=label('stop')}u.onend=u.onerror=()=>{if(button){button.dataset.audioActive='0';button.textContent=label('listen')}if(speakingButton===button)speakingButton=null};window.speechSynthesis.speak(u)}
function speakCard(button){if(button.dataset.audioActive==='1'){stopAudio();return}const card=button.closest('.card');if(!card)return;const title=card.querySelector('h3')?.textContent?.trim()||'';const summary=card.querySelector('p')?.textContent?.trim()||'';speak(title+'. '+summary,button)}
function enhanceCards(){document.querySelectorAll('#news .card').forEach(card=>{if(card.querySelector('.audio-listen'))return;const actions=card.querySelector('.actions')||card;const b=document.createElement('button');b.type='button';b.className='linkbtn audio-listen';b.textContent=label('listen');b.onclick=()=>speakCard(b);actions.appendChild(b)})}
function addTodayButton(){if(document.getElementById('listenToday'))return;const hero=document.querySelector('.hero');if(!hero)return;const b=document.createElement('button');b.id='listenToday';b.className='secondary';b.type='button';b.style.marginTop='12px';b.textContent=label('today');b.onclick=()=>{if(b.dataset.audioActive==='1'){stopAudio();b.dataset.audioActive='0';b.textContent=label('today');return}const cards=[...document.querySelectorAll('#news .card')];const text=cards.map(c=>{const h=c.querySelector('h3')?.textContent||'';const p=c.querySelector('p')?.textContent||'';return h+'. '+p}).join('. ');if(!text)return;stopAudio();b.dataset.audioActive='1';b.textContent=label('stop');speak(text,b);const oldEnd=window.speechSynthesis.onend};hero.appendChild(b)}
function refreshLabels(){document.querySelectorAll('.audio-listen').forEach(b=>{if(b.dataset.audioActive!=='1')b.textContent=label('listen')});const t=document.getElementById('listenToday');if(t&&t.dataset.audioActive!=='1')t.textContent=label('today')}
const news=document.getElementById('news');if(news){new MutationObserver(()=>{enhanceCards();refreshLabels()}).observe(news,{childList:true,subtree:true})}
const select=document.getElementById('langSelect');if(select)select.addEventListener('change',()=>{stopAudio();setTimeout(()=>{enhanceCards();refreshLabels()},60)});
window.addEventListener('beforeunload',stopAudio);
window.speakAlBushraCard=speakCard;window.stopAlBushraAudio=stopAudio;
addTodayButton();enhanceCards();refreshLabels();
if(window.speechSynthesis)window.speechSynthesis.onvoiceschanged=()=>{};
})();