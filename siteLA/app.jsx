/** @jsx React.createElement */
const MODELS = {
  h5r: { key:'h5r', name:'Hongqi H5 рестайлинг', folder:'Hongqi H5 R', images:10, color:'Чёрный',
    pricing:{hourly:2000,business:16000,transfer:5000,wedding:2500} },
  h5:  { key:'h5',  name:'Hongqi H5',           folder:'Hongqi H5',   images: 9, color:'Белый',
    pricing:{hourly:2000,business:14000,transfer:3500,wedding:2000} },
  h9:  { key:'h9',  name:'Hongqi H9',           folder:'Hongqi H9',   images: 8, color:'Чёрный',
    pricing:{hourly:3500,business:22000,transfer:8000,wedding:4000} },
};

const TELEGRAM_USER = 'art_61cars';
const PHONE_1 = '+7 (905) 452-20-00';
const PHONE_2 = '+7 (939) 000-92-00';

const fmt = (n)=> new Intl.NumberFormat('ru-RU').format(n);
const img = (folder,i,base='image') => `${base}/${encodeURIComponent(folder)}/${i}.jpg`;
const inputDark = "w-full bg-base-800 text-gray-100 placeholder-neutral-500 ring-1 ring-white/10 rounded-lg px-4 py-3 outline-none focus:ring-accent-500";

async function copyToClipboard(text){
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try {
      const ta=document.createElement('textarea');
      ta.value=text; ta.setAttribute('readonly','');
      ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      return true;
    } catch { return false; }
  }
}
function App(){
  const [mobileOpen,setMobileOpen] = React.useState(false);
  const [showTop,setShowTop]       = React.useState(false);

  const [model,setModel] = React.useState('h5r');
  const [slide,setSlide] = React.useState(0);
  const [lb,setLb]       = React.useState(false);

  const [type,setType]   = React.useState('hourly');
  const [hours,setHours] = React.useState(8);
  const [date,setDate]   = React.useState('');
  const [time,setTime]   = React.useState('');
  const [addr,setAddr]   = React.useState('');
  const [note,setNote]   = React.useState('');
  const [toast,setToast] = React.useState('');

  const data = MODELS[model];

  React.useEffect(()=>{
    const d=new Date(); const tz=new Date(d.getTime()-d.getTimezoneOffset()*60000);
    setDate(tz.toISOString().slice(0,10));
    setTime(String(tz.getHours()).padStart(2,'0')+':'+String(tz.getMinutes()).padStart(2,'0'));
  },[]);
  React.useEffect(()=>{
    const onScroll=()=>setShowTop(window.scrollY>600);
    window.addEventListener('scroll',onScroll); onScroll();
    return ()=>window.removeEventListener('scroll',onScroll);
  },[]);
  React.useEffect(()=>{
    function key(e){
      if(!lb) return;
      if(e.key==='Escape') setLb(false);
      if(e.key==='ArrowLeft')  setSlide(s=> (s-1+data.images)%data.images);
      if(e.key==='ArrowRight') setSlide(s=> (s+1)%data.images);
    }
    window.addEventListener('keydown',key);
    return ()=>window.removeEventListener('keydown',key);
  },[lb, data.images]);

  /* цена — только для показа */
  const price = React.useMemo(()=>{
    const p=data.pricing;
    if(type==='hourly'){ const h=Math.max(parseInt(hours||1,10),1); return {sum:h*p.hourly, note:`${h} ч × ${fmt(p.hourly)} ₽/ч + 1 ч подача`}; }
    if(type==='wedding'){ const h=Math.max(parseInt(hours||1,10),1); return {sum:h*p.wedding, note:`${h} ч × ${fmt(p.wedding)} ₽/ч + 1 ч подача`}; }
    if(type==='business') return {sum:p.business, note:'Бизнес-день'};
    if(type==='transfer') return {sum:p.transfer, note:'Трансфер'};
    return {sum:0,note:''};
  },[data,type,hours]);

  const scrollToId = id => {
    const el=document.querySelector(id);
    if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); setMobileOpen(false); }
  };
  async function sendTelegram(e){
    e.preventDefault();

    const typeText = {hourly:'Почасовая', business:'Бизнес-день', transfer:'Трансфер', wedding:'Свадьба'}[type];

    const lines = [
      `Модель: ${data.name}`,
      `Тип: ${typeText}`,
      `Дата: ${date}`,
      `Время: ${time}`,
      addr.trim() ? `Адрес: ${addr.trim()}` : null,
      note.trim() ? `Примечание: ${note.trim()}` : null,
    ].filter(Boolean);

    const text = lines.join('\n');
    const enc  = encodeURIComponent(text);

    await copyToClipboard(text); 

    
    const tryApp = (url) => {
      const a=document.createElement('a');
      a.href=url; a.style.display='none';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
    let fellBack = false;
    try { tryApp(`tg://resolve?domain=${TELEGRAM_USER}&text=${enc}`); } catch {}

    
    setTimeout(()=>{
      if(fellBack) return;
      let ok=false;
      try{ ok = !!window.open(`https://t.me/share/url?url=&text=${enc}`, '_blank'); }catch{}
      if(!ok){ try{ ok = !!window.open(`https://t.me/share?url=&text=${enc}`, '_blank'); }catch{} }
      if(ok){ fellBack=true; setToast('Открыл Telegram. Текст подставлен — выберите чат.'); setTimeout(()=>setToast(''),4000); return; }


      const chat=`https://web.telegram.org/k/#@${TELEGRAM_USER}`;
      try{ window.open(chat,'_blank'); }catch{ window.location.href=chat; }
      fellBack=true; setToast('Открыл Telegram Web. Текст в буфере — вставьте (Ctrl/Cmd+V).'); setTimeout(()=>setToast(''),4500);
    }, 900);
  }

  const Pill = ({m})=>{
    const active=m.key===model;
    return (
      <button onClick={()=>{setModel(m.key); setSlide(0);}}
        className={'px-3 py-1.5 rounded-full text-sm ring-1 transition '+(active?'bg-accent-600/20 ring-accent-600 text-white':'ring-white/10 text-neutral-300 hover:ring-accent-600')}>
        {m.name.replace('Hongqi ','')}
      </button>
    );
  };


const Similar = ({m})=>(
  <div className="rounded-2xl p-4 bg-panel transition">
    {/* БЕЗ фона у превью */}
    <div className="w-full h-44 sm:h-48 mb-3 rounded-lg flex items-center justify-center overflow-hidden no-frame">
      <img
        src={img(m.folder,1)}
        alt={m.name}
        className="max-h-full max-w-full object-contain no-frame"
        onError={(e)=>{ if(!e.currentTarget.dataset.alt){ e.currentTarget.dataset.alt=1; e.currentTarget.src=img(m.folder,1,'изображение'); } }}
      />
    </div>

    <div className="flex items-center justify-between">
      <span className="font-medium">{m.name}</span>
      <span className="text-neutral-400">{fmt(m.pricing.hourly)} ₽/час</span>
    </div>

    <div className="mt-3">
      <button
        onClick={()=>{
          // сначала скроллим, потом меняем модель — без «мигания» фото
          scrollToTopThen(()=>{ setModel(m.key); setSlide(0); setLb(false); });
        }}
        className="text-accent-500 hover:text-accent-600 text-sm font-medium flex items-center"
      >
        Открыть
        <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </div>
  </div>
);

// плавно скроллим к верху, затем выполняем cb
function scrollToTopThen(cb){
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const start = performance.now();
  (function wait(){
    // ждём пока докрутимся или максимум ~1.2с
    if (window.scrollY <= 5 || performance.now() - start > 1200){
      cb(); return;
    }
    requestAnimationFrame(wait);
  })();
}


  return (
    <div id="top">
      {/* HEADER */}
      <header className="fixed w-full z-50 bg-base-900/80 backdrop-blur-sm border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#top" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-700 to-accent-500 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" width="18" height="18"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stopColor="#fff4d6"/><stop offset="100%" stopColor="#d6a842"/></linearGradient></defs><path d="M3 19 L12 4 L21 19" fill="none" stroke="url(#g)" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <span className="font-semibold text-lg tracking-tight">Армо-Арт</span>
            </a>

            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={()=>scrollToId('#order')}  className="text-neutral-400 hover:text-white transition">Калькулятор</button>
              <button onClick={()=>scrollToId('#contact')}className="text-neutral-400 hover:text-white transition">Контакты</button>
            </nav>

            <div className="flex items-center space-x-3">
              <a href="tel:+79054522000" className="hidden sm:flex text-neutral-300 hover:text-white">{PHONE_1}</a>
              <button onClick={()=>scrollToId('#order')} className="btn bg-accent-500 hover:bg-accent-600 text-black font-medium px-4 py-2 rounded-full hidden md:flex">Заказать</button>
              <button className="md:hidden text-neutral-300" onClick={()=>setMobileOpen(s=>!s)} aria-label="Меню">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-base-900/95 border-t border-white/5">
            <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
              <button className="text-neutral-300 text-left" onClick={()=>scrollToId('#order')}>Калькулятор</button>
              <button className="text-neutral-300 text-left" onClick={()=>scrollToId('#contact')}>Контакты</button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: gallery */}
            <section>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.05] mb-3 tracking-tight">{data.name} — аренда с водителем</h1>
              <p className="text-[17px] text-neutral-400 mb-6">Выберите параметры в калькуляторе и отправьте заявку в Telegram.</p>

              {/* ГАЛЕРЕЯ — пониже высота, чтобы без скролла виделись параметры и табы моделей */}
              <div className="relative overflow-hidden select-none bg-base-900 no-frame">
                <button type="button" aria-label="Назад"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/60 text-white hidden sm:flex items-center justify-center"
                        onClick={()=>setSlide((slide-1+data.images)%data.images)}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button type="button" aria-label="Вперёд"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/60 text-white hidden sm:flex items-center justify-center"
                        onClick={()=>setSlide((slide+1)%data.images)}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>

                <div className="flex transition-transform duration-500" style={{transform:`translateX(${-100*slide}%)`}}>
                  {Array.from({length:data.images}, (_,i)=>(
                    <div key={i} className="min-w-full bg-base-900 no-frame">
                      <img
                        src={img(data.folder,i+1)}
                        alt={`${data.name} — фото ${i+1}`}
                        className="w-full h-[46vw] max-h-[440px] object-contain cursor-zoom-in no-frame"
                        onClick={()=>{setSlide(i); setLb(true);}}
                        onError={(e)=>{ if(!e.currentTarget.dataset.alt){ e.currentTarget.dataset.alt=1; e.currentTarget.src = img(data.folder,i+1,'изображение'); } else { e.currentTarget.src='https://placehold.co/1600x1000?text=Фото'; } }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Модели — ПОД фотками */}
              <div className="flex flex-wrap items-center gap-2 mt-4" id="models">
                <span className="text-sm text-neutral-400">Модель:</span>
                {Object.values(MODELS).map(m => <Pill key={m.key} m={m} />)}
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="panel px-3 py-1.5 rounded-full text-sm text-neutral-300">3 пассажира</span>
                <span className="panel px-3 py-1.5 rounded-full text-sm text-neutral-300">Цвет: {data.color}</span>
                <span className="panel px-3 py-1.5 rounded-full text-sm text-neutral-300">Климат-контроль</span>
                <span className="panel px-3 py-1.5 rounded-full text-sm text-neutral-300">Шумоизоляция</span>
                <span className="panel px-3 py-1.5 rounded-full text-sm text-neutral-300">Чистая подача</span>
              </div>
            </section>

            {/* Right: form */}
            <aside className="lg:sticky lg:top-24 self-start">
              <form onSubmit={sendTelegram} className="panel rounded-xl p-6" id="order">
                <h3 className="text-xl font-bold mb-6">Онлайн-расчёт и заказ</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-neutral-300 mb-1">Тип аренды</label>
                    <select value={type} onChange={(e)=>setType(e.target.value)} className={inputDark}>
                      <option value="hourly">Почасовая</option>
                      <option value="business">Бизнес-день</option>
                      <option value="transfer">Трансфер</option>
                      <option value="wedding">Свадьба</option>
                    </select>
                  </div>
                  {(type==='hourly'||type==='wedding') && (
                    <div>
                      <label className="block text-sm text-neutral-300 mb-1">Часы аренды</label>
                      <input type="number" min="1" max="24" step="1" value={hours}
                             onChange={(e)=>setHours(parseInt(e.target.value||1,10))}
                             className={inputDark} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-neutral-300 mb-1">Дата</label>
                    <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className={inputDark} />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-300 mb-1">Время подачи</label>
                    <input type="time" value={time} onChange={(e)=>setTime(e.target.value)} className={inputDark} />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-neutral-300 mb-1">Адрес подачи</label>
                  <input value={addr} onChange={(e)=>setAddr(e.target.value)} placeholder="Город, улица, дом" className={inputDark} />
                </div>
                <div className="mb-6">
                  <label className="block text-sm text-neutral-300 mb-1">Примечание</label>
                  <textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Например: офис → аэропорт, ожидание 1 час, обратно"
                            className={inputDark + " min-h-[100px]"} />
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-sm text-neutral-400 mb-1">К оплате</div>
                    <div className="text-3xl font-extrabold">{fmt(price.sum)} ₽</div>
                    <div className="text-xs text-neutral-500 mt-1">{price.note}</div>
                  </div>
                  <button type="submit" className="btn bg-accent-500 hover:bg-accent-600 text-black px-5 py-3 rounded-lg font-medium flex items-center">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                    Написать в Telegram
                  </button>
                </div>
          
              </form>
            </aside>
          </div>

          {/* CTA */}
          <section className="mt-10 mb-12">
            <div className="rounded-2xl bg-gradient-to-r from-accent-600 to-accent-500 p-6 md:p-8">
              <h3 className="text-2xl font-bold text-black mb-2">Подача к точному времени</h3>
              <a href="tel:+79054522000" className="inline-flex items-center px-4 py-2 rounded-lg bg-black text-accent-500 font-semibold hover:opacity-90">Позвонить</a>
              <div className="text-black/90 text-sm mt-3">
                {PHONE_1} • {PHONE_2}
              </div>
            </div>
          </section>

          {/* Другие модели */}
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6">Другие модели Hongqi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(MODELS).filter(m=>m.key!==model).map(m => <Similar key={m.key} m={m} />)}
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer id="contact" className="border-t border-white/5 py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="panel rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">Контакты</h3>
              <div className="space-y-2">
                <a href="tel:+79054522000" className="block text-neutral-300 hover:text-white">{PHONE_1}</a>
                <a href="tel:+79390009200" className="block text-neutral-300 hover:text-white">{PHONE_2}</a>
                <a href={"https://t.me/"+TELEGRAM_USER} target="_blank" rel="noopener" className="block text-neutral-300 hover:text-white">@{TELEGRAM_USER}</a>
              </div>
            </div>
            <div className="panel rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">Армо-Арт</h3>
              <p className="text-neutral-400 text-sm">Премиальные автомобили Hongqi с водителем.</p>
            </div>
            <div className="panel rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">График</h3>
              <p className="text-neutral-400 text-sm">Круглосуточно</p>
            </div>
          </div>
          <div className="mt-8 text-neutral-500 text-sm">2015–2025 © Армо-Арт</div>
        </div>
      </footer>

      {/* Лайтбокс */}
      {lb && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center select-none">
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  onClick={()=>setLb(false)} aria-label="Закрыть">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  onClick={()=>setSlide((slide-1+data.images)%data.images)} aria-label="Назад">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <img
            src={img(data.folder,slide+1)}
            onError={(e)=>{ if(!e.currentTarget.dataset.alt){ e.currentTarget.dataset.alt=1; e.currentTarget.src = img(data.folder,slide+1,'изображение'); } else { e.currentTarget.src='https://placehold.co/1600x1000?text=Фото'; } }}
            alt=""
            className="max-h-[90vh] max-w-[92vw] object-contain no-frame"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  onClick={()=>setSlide((slide+1)%data.images)} aria-label="Вперёд">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      )}

      {/* Back to top */}
      {showTop && (
        <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
                className="fixed bottom-24 right-5 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-base-800/90 border border-white/10 hover:bg-base-800/95"
                aria-label="Вверх">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
        </button>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-5 bg-black/70 text-white text-sm px-3 py-2 rounded-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
