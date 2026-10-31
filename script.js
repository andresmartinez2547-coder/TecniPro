const $ = (id) => document.getElementById(id);
const screens = ["welcome","login","dashboard","courses","quote","quoteDetail","quotes","progress","tools","profile"];
let currentScreen = "welcome";
let currentQuote = null;
let notificationsEnabled = true;
const courses = [
  {id:"python",title:"Programación en Python",category:"Programación",desc:"Aprende desde cero y crea tus primeros programas.",icon:"💻",duration:8,progress:0},
  {id:"redes",title:"Redes y conectividad",category:"Redes",desc:"Conceptos de conexión y administración de redes.",icon:"🌐",duration:6,progress:0},
  {id:"pc",title:"Mantenimiento de PC",category:"Hardware",desc:"Conoce los componentes y el mantenimiento preventivo.",icon:"🖥️",duration:7,progress:0},
  {id:"hardware",title:"Hardware básico",category:"Hardware",desc:"Identifica componentes y sus funciones.",icon:"🧩",duration:5,progress:0},
  {id:"systems",title:"Sistemas operativos",category:"Sistemas",desc:"Introducción a Windows y Linux.",icon:"⚙️",duration:5,progress:0}
];
let user = JSON.parse(localStorage.getItem("tecniproUser") || "null") || {name:"Técnico",email:""};
let quotes = JSON.parse(localStorage.getItem("tecniproQuotes") || "[]");
let courseProgress = JSON.parse(localStorage.getItem("tecniproCourses") || "{}");

function save(){localStorage.setItem("tecniproQuotes",JSON.stringify(quotes));localStorage.setItem("tecniproCourses",JSON.stringify(courseProgress));localStorage.setItem("tecniproUser",JSON.stringify(user));}
function money(n){return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(Number(n)||0);}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2400);}
function go(name){
  if(!screens.includes(name))return;
  currentScreen=name;
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  const target=$(name+"Screen");if(target)target.classList.add("active");
  $("bottomNav").classList.toggle("hidden",["welcome","login"].includes(name));
  $("backBtn").classList.toggle("hidden",["welcome","dashboard"].includes(name));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.go===name || (name==="quote"&&b.dataset.go==="quotes") || (name==="quoteDetail"&&b.dataset.go==="quotes")));
  if(name==="dashboard")renderDashboard();
  if(name==="courses")renderCourses();
  if(name==="quotes")renderQuotes();
  if(name==="progress")renderProgress();
  if(name==="profile")renderProfile();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-go]");if(b)go(b.dataset.go);});
$("backBtn").addEventListener("click",()=>go(currentScreen==="quoteDetail"?"quotes":"dashboard"));
$("loginForm").addEventListener("submit",e=>{e.preventDefault();user.email=$("loginEmail").value.trim();user.name=user.email.split("@")[0].replace(/[._-]/g," ").replace(/\b\w/g,c=>c.toUpperCase())||"Técnico";save();go("dashboard");toast("¡Bienvenido a TecniPro!");});
function renderDashboard(){
  $("welcomeName").textContent=user.name||"Técnico";$("quoteCount").textContent=quotes.length;
  const completed=courses.filter(c=>(courseProgress[c.id]||0)>=100).length;$("progressMini").textContent=Math.round(completed/courses.length*100)+"%";
  const recent=quotes[0];$("recentQuote").innerHTML=recent?`<b>${escapeHtml(recent.service)}</b><p>${escapeHtml(recent.client)} · ${money(recent.total)}</p><button class="text-btn" id="openRecent">Ver detalle →</button>`:"Todavía no tienes cotizaciones. ¡Crea la primera!";
  if(recent)$("openRecent").onclick=()=>showQuote(recent.id);
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderCourses(filter="Todos"){
  const list=courses.filter(c=>filter==="Todos"||c.category===filter);
  $("courseList").innerHTML=list.map(c=>{const p=courseProgress[c.id]||0;return `<article class="panel course-card"><div class="course-icon">${c.icon}</div><div class="course-info"><b>${c.title}</b><p>${c.desc}</p><small>${c.duration} horas · ${p}% completado</small><div class="progress-track"><span style="width:${p}%"></span></div></div><button data-course="${c.id}">${p>=100?"Revisar":p?"Continuar":"Iniciar"}</button></article>`;}).join("");
  $("courseList").querySelectorAll("[data-course]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.course;const c=courses.find(x=>x.id===id);const p=courseProgress[id]||0;courseProgress[id]=p>=100?0:Math.min(100,p+25);save();renderCourses(filter);toast(courseProgress[id]>=100?"¡Curso completado!":"Progreso actualizado: "+courseProgress[id]+"%");}));
}
$("courseFilters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderCourses(b.dataset.filter);});
function calculateTotal(){return Math.max(0,Number($("materialsCost").value)||0)+Math.max(0,Number($("laborCost").value)||0);}
["materialsCost","laborCost"].forEach(id=>$(id).addEventListener("input",()=>$("quoteTotal").textContent=money(calculateTotal())));
$("quoteForm").addEventListener("submit",e=>{
  e.preventDefault();
  const q={id:"CT-"+Date.now().toString().slice(-8),client:$("clientName").value.trim(),service:$("serviceType").value,description:$("serviceDescription").value.trim(),materials:Number($("materialsCost").value)||0,labor:Number($("laborCost").value)||0,total:calculateTotal(),date:new Date().toLocaleDateString("es-CO")};
  if(!q.client||!q.service||!q.description){toast("Completa todos los campos obligatorios.");return;}
  quotes.unshift(q);save();e.target.reset();$("materialsCost").value=0;$("laborCost").value=0;$("quoteTotal").textContent=money(0);showQuote(q.id);toast("Cotización guardada correctamente.");
});
function showQuote(id){currentQuote=quotes.find(q=>q.id===id);if(!currentQuote)return;const q=currentQuote;
  $("quoteDetail").innerHTML=`<h3>📄 Cotización #${q.id}</h3><div class="detail-line"><span>Cliente</span><b>${escapeHtml(q.client)}</b></div><div class="detail-line"><span>Fecha</span><b>${q.date}</b></div><div class="detail-line"><span>Servicio</span><b>${escapeHtml(q.service)}</b></div><h3>Descripción del servicio</h3><p class="detail-description">${escapeHtml(q.description)}</p><h3>Resumen de costos</h3><div class="detail-line"><span>Materiales</span><b>${money(q.materials)}</b></div><div class="detail-line"><span>Mano de obra</span><b>${money(q.labor)}</b></div><div class="detail-line total"><span>TOTAL</span><b>${money(q.total)}</b></div><p class="tiny muted">TecniPro · Soluciones técnicas a tu alcance</p>`;
  go("quoteDetail");
}
function renderQuotes(){$("quotesList").innerHTML=quotes.length?quotes.map(q=>`<button class="panel quote-card" data-quote="${q.id}"><div class="quote-main"><b>${escapeHtml(q.service)}</b><p>${escapeHtml(q.client)} · ${q.date}</p><small>#${q.id}</small></div><span class="quote-price">${money(q.total)}</span></button>`).join(""):`<div class="panel empty-state">Aún no hay cotizaciones guardadas.</div>`;
  $("quotesList").querySelectorAll("[data-quote]").forEach(b=>b.addEventListener("click",()=>showQuote(b.dataset.quote)));
}
$("printQuote").addEventListener("click",()=>window.print());
$("shareQuote").addEventListener("click",async()=>{if(!currentQuote)return;const q=currentQuote;const text=`Cotización ${q.id}\nCliente: ${q.client}\nServicio: ${q.service}\nDescripción: ${q.description}\nMateriales: ${money(q.materials)}\nMano de obra: ${money(q.labor)}\nTOTAL: ${money(q.total)}`;if(navigator.share){try{await navigator.share({title:"Cotización TecniPro",text});}catch(_){}}else{try{await navigator.clipboard.writeText(text);toast("Resumen copiado para compartir.");}catch(_){toast("Tu navegador no permite compartir desde aquí.");}}});
function renderProgress(){const done=courses.filter(c=>(courseProgress[c.id]||0)>=100);const pct=Math.round(done.length/courses.length*100);$("progressValue").textContent=pct+"%";$("progressRing").style.setProperty("--progress",pct+"%");$("completedCount").textContent=done.length;$("studyHours").textContent=done.reduce((a,c)=>a+c.duration,0)+" h";$("progressQuotes").textContent=quotes.length;$("progressCourses").innerHTML=courses.map(c=>`<div class="panel course-card"><div class="course-icon">${c.icon}</div><div class="course-info"><b>${c.title}</b><small>${courseProgress[c.id]||0}% completado</small><div class="progress-track"><span style="width:${courseProgress[c.id]||0}%"></span></div></div></div>`).join("");}
function renderProfile(){$("profileName").textContent=user.name||"Técnico";$("profileEmail").textContent=user.email||"Sesión de invitado";$("notificationState").textContent=notificationsEnabled?"Activadas":"Desactivadas";}
$("editProfile").addEventListener("click",()=>{const name=prompt("¿Qué nombre quieres mostrar?",user.name||"Técnico");if(name&&name.trim()){user.name=name.trim();save();renderProfile();toast("Nombre actualizado.");}});
$("toggleNotifications").addEventListener("click",()=>{notificationsEnabled=!notificationsEnabled;renderProfile();toast("Notificaciones "+(notificationsEnabled?"activadas":"desactivadas"));});
$("aboutBtn").addEventListener("click",()=>toast("TecniPro 1.0 · Prototipo educativo local."));
$("logoutBtn").addEventListener("click",()=>{go("welcome");toast("Sesión cerrada en este dispositivo.");});
$("notificationBtn").addEventListener("click",()=>toast("No tienes notificaciones nuevas."));
// Restaurar una sesión de demostración guardada.
if(user.email){$("loginEmail").value=user.email;}
$("quoteTotal").textContent=money(0);
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("service-worker.js").catch(()=>{});
