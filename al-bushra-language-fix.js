(()=>{
const L={
 en:{subtitle:'The Good News of the Ummah',archive:'Archive',install:'Install App',share:'Share AL-BUSHRA',heroEye:"TODAY'S VERIFIED EDITION",heroTitle:'Good news that makes the Ummah say Alḥamdulillāh.',heroDesc:'Qur’an, Islamic education, Muslim achievers, youth leadership and practical ideas worth copying — with verified sources attached.',latest:'LATEST',today:'Today on AL-BUSHRA',achEye:'MUSLIM ACHIEVERS & YOUNG MUSLIM STARS',people:'People worth celebrating',highEye:'ALHAMDULILLAH HIGHLIGHTS',reasons:'Reasons for gratitude today',action:'FROM NEWS TO ACTION',ideas:'Ideas Muslim Communities Can Copy',grow:'HELP AL-BUSHRA GROW',submitTitle:'Submit good news or nominate an achiever',submit:'Submit',read:'Read & comment →',shareStory:'Share ↗',verified:'✓ Verified source'},
 ar:{subtitle:'الأخبار السارة للأمة',archive:'الأرشيف',install:'تثبيت التطبيق',share:'شارك البشرى',heroEye:'عدد اليوم الموثق',heroTitle:'أخبار طيبة تجعل الأمة تقول: الحمد لله.',heroDesc:'القرآن والتعليم الإسلامي وإنجازات المسلمين وقيادة الشباب وأفكار عملية نافعة — مع مصادر موثقة.',latest:'الأحدث',today:'اليوم في البشرى',achEye:'إنجازات المسلمين والنجوم الشباب',people:'نماذج تستحق الاحتفاء',highEye:'ومضات الحمد لله',reasons:'أسباب للشكر اليوم',action:'من الخبر إلى العمل',ideas:'أفكار يمكن للمجتمعات المسلمة تطبيقها',grow:'ساهم في تطوير البشرى',submitTitle:'أرسل خبراً ساراً أو رشّح شخصاً متميزاً',submit:'إرسال',read:'اقرأ وعلّق ←',shareStory:'مشاركة ↗',verified:'✓ مصدر موثّق'},
 yo:{subtitle:'Ìròyìn Ayọ̀ ti Ummah',archive:'Àkójọ́ Ìròyìn',install:'Fi App Sórí Fóònù',share:'Pín AL-BUSHRA',heroEye:'ÌRÒYÌN ÒNÍ TÍ A ṢÀYẸ̀WÒ',heroTitle:'Ìròyìn rere tí yóò mú kí Ummah sọ pé Alḥamdulillāh.',heroDesc:'Qur’ān, ẹ̀kọ́ Islam, àṣeyọrí Musulumi, aṣáájú ọdọ àti èrò tó wúlò — pẹ̀lú orísun tí a ṣàyẹ̀wò.',latest:'TUNTUN JÙ',today:'Lónìí lórí AL-BUSHRA',achEye:'ÀWỌN MUSULUMI TÓ ṢE ÀṢEYỌRÍ & ÀWỌN ỌDỌ́ TÓ TAYỌ',people:'Àwọn ẹni tó yẹ ká yìn',highEye:'ÀWỌN OHUN TÓ MÚ KÁ SỌ ALḤAMDULILLĀH',reasons:'Àwọn ìdí láti dúpẹ́ lónìí',action:'LÁTI ÌRÒYÌN SÍ ÌṢE',ideas:'Àwọn Èrò Tí Àwùjọ Musulumi Lè Tẹ̀lé',grow:'RAN AL-BUSHRA LỌ́WỌ́ LÁTI DÀGBÀ',submitTitle:'Fi ìròyìn rere ránṣẹ́ tàbí yan Musulumi tó ṣe àṣeyọrí',submit:'Ránṣẹ́',read:'Kà á & sọ̀rọ̀ →',shareStory:'Pín ↗',verified:'✓ Orísun tí a ṣàyẹ̀wò'},
 ha:{subtitle:'Labaran Alheri na Al’umma',archive:'Taskar Labarai',install:'Shigar da App',share:'Raba AL-BUSHRA',heroEye:'BUGUN YAU DA AKA TABBATAR',heroTitle:'Labaran alheri da ke sa Al’umma ta ce Alḥamdulillāh.',heroDesc:'Al-Qur’ani, ilimin Musulunci, nasarorin Musulmi, shugabancin matasa da dabarun amfani — tare da tabbatattun majiyoyi.',latest:'SABABBI',today:'Yau a AL-BUSHRA',achEye:'MUSULMAI MASU NASARA & TAURARIN MATASA',people:'Mutanen da suka cancanci yabo',highEye:'ABUBUWAN ALḤAMDULILLĀH',reasons:'Dalilan godiya a yau',action:'DAGA LABARI ZUWA AIKI',ideas:'Dabarun da Al’ummomin Musulmi Za Su Iya Kwaikwaya',grow:'TAIMAKA AL-BUSHRA TA GIRMA',submitTitle:'Aiko da labari mai daɗi ko gabatar da Musulmi mai nasara',submit:'Aika',read:'Karanta & yi sharhi →',shareStory:'Raba ↗',verified:'✓ Tabbatacciyar majiya'},
 ig:{subtitle:'Ozi Ọma nke Ummah',archive:'Nchekwa Ozi',install:'Wụnye App',share:'Kesaa AL-BUSHRA',heroEye:'MBIPỤTA TAA E KWADORO',heroTitle:'Ozi ọma na-eme ka Ummah kwuo Alḥamdulillāh.',heroDesc:'Qur’an, agụmakwụkwọ Islam, ndị Muslim rụpụtara ihe ọma, ndu ndị ntorobịa na echiche bara uru — tinyere isi mmalite a kwadoro.',latest:'KACHA ỌHỤRỤ',today:'Taa na AL-BUSHRA',achEye:'NDỊ MUSLIM RỤPỤTARA IHE & KPAKPA NDỊ NTOROBỊA',people:'Ndị kwesịrị ka e too',highEye:'IHE NDỊ NA-EME KA ANYỊ KWUO ALḤAMDULILLĀH',reasons:'Ihe mere anyị ji ekele taa',action:'SITE N’OZI BAA N’OMUME',ideas:'Echiche Obodo Muslim Ndị Ọzọ Pụrụ Iṅomi',grow:'NYERE AL-BUSHRA AKA ITO',submitTitle:'Zipu ozi ọma ma ọ bụ họpụta Muslim rụpụtara ihe',submit:'Zipu',read:'Gụọ & kwuo uche →',shareStory:'Kesaa ↗',verified:'✓ Isi mmalite a kwadoro'}
};
const C={
 'All':{ar:'الكل',yo:'Gbogbo',ha:'Duka',ig:'Niile'},
 'Qur’an & Ḥuffāẓ':{ar:'القرآن والحفّاظ',yo:'Qur’ān & Ḥuffāẓ',ha:'Al-Qur’ani & Ḥuffāẓ',ig:'Qur’an & Ḥuffāẓ'},
 'Islamic Education':{ar:'التعليم الإسلامي',yo:'Ẹ̀kọ́ Islam',ha:'Ilimin Musulunci',ig:'Agụmakwụkwọ Islam'},
 'Muslim Achievers':{ar:'إنجازات المسلمين',yo:'Musulumi Tó Ṣe Àṣeyọrí',ha:'Musulmai Masu Nasara',ig:'Ndị Muslim Rụpụtara Ihe'},
 'Young Muslim Stars':{ar:'نجوم المسلمين الشباب',yo:'Àwọn Ọdọ́ Musulumi Tó Tayọ',ha:'Taurarin Matasan Musulmi',ig:'Kpakpando Ndị Ntorobịa Muslim'},
 'Hajj & Umrah':{ar:'الحج والعمرة',yo:'Hajj & Umrah',ha:'Hajji & Umrah',ig:'Hajj & Umrah'}
};
const S={
'maryam-danazumi':{
 ar:['نيجيريا تكرّم بطلة دولية في القرآن عمرها 19 عاماً','حصلت مريم إبراهيم دان عزومي على دعم تعليمي بقيمة 20 مليون نايرا بعد فوزها في مسابقة دولية للقرآن في مكة.'],
 yo:['Nàìjíríà bu ọlá fún ọmọ ọdún 19 tó gba ìdíje Qur’ān àgbáyé','Maryam Ibrahim Dan’Azumi gba ìrànlọ́wọ́ ẹ̀kọ́ ₦20 milionu lẹ́yìn ìṣẹ́gun rẹ̀ ní ìdíje Qur’ān àgbáyé ní Makkah.'],
 ha:['Najeriya ta karrama zakarar gasar Al-Qur’ani ta duniya mai shekaru 19','Maryam Ibrahim Dan’Azumi ta samu tallafin ilimi na ₦20 miliyan bayan nasararta a gasar Al-Qur’ani a Makkah.'],
 ig:['Naịjirịa na-asọpụrụ nwaanyị Muslim dị afọ 19 meriri asọmpi Qur’an mba ụwa','Maryam Ibrahim Dan’Azumi nwetara nkwado agụmakwụkwọ ₦20 nde mgbe o meriri n’asọmpi Qur’an mba ụwa na Makkah.']},
'katsina-87-huffaz':{
 ar:['87 طالباً يتمّون حفظ القرآن كاملاً في كاتسينا','خرّجت مدرسة في كاتسينا 87 حافظاً أتموا حفظ القرآن كاملاً.'],
 yo:['Àwọn akẹ́kọ̀ọ́ 87 parí hifz Qur’ān ní Katsina','Ilé-ẹ̀kọ́ kan ní Katsina kó ḥuffāẓ 87 jáde lẹ́yìn tí wọ́n parí Qur’ān.'],
 ha:['Dalibai 87 sun kammala haddar Al-Qur’ani a Katsina','Makaranta a Katsina ta yaye huffaz 87 bayan sun kammala haddar Al-Qur’ani.'],
 ig:['Ụmụ akwụkwọ 87 mezuru iburu Qur’an n’isi na Katsina','Ụlọ akwụkwọ dị na Katsina gụsịrị ḥuffāẓ 87 bụ ndị mezuru iburu Qur’an dum n’isi.']},
'indonesia-inclusive-mtq':{
 ar:['المسابقة الوطنية الإندونيسية تفتح المشاركة القرآنية للصم والمكفوفين','تشمل المسابقة فئات للمكفوفين ومعرضاً للمسلمين الصم ومصحفاً بلغة الإشارة.'],
 yo:['MTQ Indonesia ṣí Qur’ān sílẹ̀ fún Musulumi adití àti afọ́jú','Ètò náà ní ẹ̀ka fún afọ́jú, àfihàn fún adití àti mushaf Qur’ān èdè àmì.'],
 ha:['MTQ na Indonesia ya buɗe damar Al-Qur’ani ga kurame da makafi','Shirin ya haɗa da rukunin makafi, baje-kolin kurame da Mushafin harshen alama.'],
 ig:['MTQ Indonesia meghere ụzọ Qur’an nye ndị Muslim ntị chiri na ndị ìsì','Ọ gụnyere ngalaba maka ndị ìsì, ngosi maka ndị ntị chiri na Mushaf Qur’an n’asụsụ akara.']},
'mtq-2242':{
 ar:['أكثر من 2200 مشارك في مسابقة القرآن الوطنية بإندونيسيا','تجمع المسابقة 2242 مشاركاً في التلاوة والحفظ والتفسير وغيرها من علوم القرآن.'],
 yo:['Ju 2,200 lọ kópa nínú ìdíje Qur’ān Indonesia','Àwọn olukópa 2,242 péjọ fún tilāwah, hifz, tafsir àti ẹ̀ka Qur’ān mìíràn.'],
 ha:['Fiye da mahalarta 2,200 a gasar Al-Qur’ani ta Indonesia','Mahalarta 2,242 sun taru domin tilawa, hifzi, tafsiri da sauran fannoni.'],
 ig:['Ihe karịrị mmadụ 2,200 sonyere n’asọmpi Qur’an mba Indonesia','Ndị sonyere 2,242 zukọtara maka tilāwah, hifz, tafsir na ngalaba Qur’an ndị ọzọ.']},
'strive-muslim-youth':{
 ar:['انطلاق برنامج شبابي قيادي إسلامي في لندن','بدأ برنامج للشباب المسلمين يجمع بين التعلم الإسلامي والقيادة والخدمة والعمل الخيري.'],
 yo:['Ètò aṣáájú ọdọ Musulumi bẹ̀rẹ̀ ní London','Ètò náà darapọ̀ ẹ̀kọ́ Islam, aṣáájú, iṣẹ́ ìránṣẹ́ àti àánú.'],
 ha:['An fara shirin shugabancin matasan Musulmi a London','Shirin yana haɗa ilimin Musulunci, shugabanci, hidima da ayyukan alheri.'],
 ig:['Mmemme ndu ndị ntorobịa Muslim amalitela na London','Mmemme ahụ jikọtara mmụta Islam, ndu, ọrụ obodo na ọrụ ebere.']},
'hajj-research-forum':{
 ar:['منتدى بحثي للحج والعمرة لتحسين خدمة الحجاج','جمع المنتدى الباحثين وصناع القرار ومقدمي الخدمات لتحسين تجربة الحجاج والمعتمرين.'],
 yo:['Àpérò ìwádìí Hajj àti Umrah fẹ́ mú iṣẹ́ arìnrìn-àjò dára síi','Àpérò náà kó olùwádìí, olùpinnu àti olùpèsè iṣẹ́ jọ.'],
 ha:['Taron binciken Hajji da Umrah domin inganta hidimar mahajjata','Taron ya haɗa masu bincike, masu yanke shawara da masu ba da hidima.'],
 ig:['Nzukọ nyocha Hajj na Umrah na-achọ imezi ọrụ ndị njem nsọ','Nzukọ ahụ jikọtara ndị nyocha, ndị na-eme mkpebi na ndị na-enye ọrụ.']}
};
let lang='en';
const $e=id=>document.getElementById(id);
function tx(id,k){const e=$e(id);if(e)e.textContent=L[lang][k]||L.en[k]||''}
function cat(c){return lang==='en'?c:((C[c]||{})[lang]||c)}
function st(s,idx){return lang==='en'?(idx===0?s.title:s.summary):(((S[s.id]||{})[lang]||[])[idx]||(idx===0?s.title:s.summary))}
function renderNewsFixed(){const box=$e('news');if(!box||typeof stories==='undefined')return;const list=stories.filter(s=>typeof active==='undefined'||active==='All'||s.category===active);box.innerHTML=list.map(s=>`<article class="card"><span class="tag">${cat(s.category)}</span><span class="verified">${L[lang].verified}</span><h3>${st(s,0)}</h3><p>${st(s,1)}</p><div class="actions"><button class="linkbtn" onclick="openArticle('${s.id}')">${L[lang].read}</button><button class="linkbtn" onclick="shareStory('${s.id}')">${L[lang].shareStory}</button></div></article>`).join('')||'<p>No stories in this section today.</p>'}
function renderFiltersFixed(){const box=$e('filters');if(!box||typeof categories==='undefined')return;box.innerHTML=categories.map(c=>`<button class="chip ${typeof active!=='undefined'&&c===active?'active':''}" data-c="${c}">${cat(c)}</button>`).join('');box.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{active=b.dataset.c;renderFiltersFixed();renderNewsFixed()})}
function apply(code){lang=L[code]?code:'en';localStorage.setItem('al-bushra-lang',lang);document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';const sel=$e('langSelect');if(sel)sel.value=lang;document.querySelector('.brand p')&&(document.querySelector('.brand p').textContent=L[lang].subtitle);tx('archiveLink','archive');tx('installLink','install');tx('shareBtn','share');tx('heroEye','heroEye');tx('heroTitle','heroTitle');tx('heroDesc','heroDesc');tx('latestEye','latest');tx('todayTitle','today');tx('achieversEye','achEye');tx('peopleTitle','people');tx('highlightsEye','highEye');tx('reasonsTitle','reasons');tx('actionEye','action');tx('ideasTitle','ideas');tx('growEye','grow');tx('submitTitle','submitTitle');tx('submitBtn','submit');renderFiltersFixed();renderNewsFixed();
}
window.applyLanguage=apply;
window.renderNews=renderNewsFixed;
window.renderFilters=renderFiltersFixed;
const sel=$e('langSelect');if(sel){sel.onchange=e=>apply(e.target.value)}
const saved=localStorage.getItem('al-bushra-lang')||'en';
setTimeout(()=>apply(saved),0);
})();