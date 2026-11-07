const $ = id => document.getElementById(id);
const money = n => (n<0?'-':'') + '$' + Math.round(Math.abs(n)).toLocaleString('es-AR');
const PRODUCTOS = {Remera:'👕', Chomba:'🎽', Taza:'☕', Plato:'🍽️', Gorra:'🧢', Tela:'🧵', Otro:'📦'};
const ESTADOS = {pedido:'🔴 Sin hacer', falta:'🟠 Falta entregar', entregado:'🟢 Entregado'};
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CAMPOS = ['id','fecha','cliente','estado','producto','color','talle','cantidad','lugar','costoPrenda','diseno','disenoLugar','costoDiseno','disenoModo','cobrado','notas'];
let datos = [], cfg = {margen:30, socios:3};

const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hoy = () => new Date().toISOString().slice(0,10);
const nombreMes = ym => { const [y,m] = ym.split('-'); return `${MESES[m-1]} ${y}`; };
// Pedidos viejos pueden no tener campos nuevos
const norm = p => ({producto:'Remera', disenoModo:'unidad', prendaPropia:false, talle:'', disenoLugar:'', ...p});

function leerForm(){
  const p = {};
  CAMPOS.forEach(k=>p[k] = $(k).value);
  p.id = p.id || crypto.randomUUID();
  ['cantidad','costoPrenda','costoDiseno','cobrado'].forEach(k=>p[k] = Number(p[k])||0);
  p.prendaPropia = $('prendaPropia').checked;
  if(p.prendaPropia){ p.costoPrenda = 0; p.lugar = ''; }
  ['cliente','color','talle','lugar','disenoLugar','notas'].forEach(k=>p[k] = p[k].trim());
  return p;
}

function togglePropia(){
  const x = $('prendaPropia').checked;
  $('lugar').disabled = $('costoPrenda').disabled = x;
}

function calcVivo(){
  const p = leerForm(), g = Calculos.ganancia(p);
  $('calcVivo').innerHTML =
    `<span>Prenda: <b>${money(Calculos.gastoPrenda(p))}</b></span>
     <span>Diseño: <b>${money(Calculos.gastoDiseno(p))}</b></span>
     <span>Gasto total: <b>${money(Calculos.gasto(p))}</b></span>
     <span>Sugerido (+${cfg.margen}%): <b>${money(Calculos.gasto(p)*(1+cfg.margen/100))}</b></span>
     <span>Ganancia bruta: <b class="${g>=0?'pos':'neg'}">${money(g)}</b></span>`;
}

function abrirForm(p){
  $('form').reset();
  $('id').value = '';
  $('fecha').value = hoy();
  $('tituloForm').textContent = p ? 'Editar pedido' : 'Nuevo pedido';
  if(p){
    p = norm(p);
    CAMPOS.forEach(k=>$(k).value = p[k] ?? '');
    $('prendaPropia').checked = !!p.prendaPropia;
  }
  togglePropia(); calcVivo();
  $('dlgForm').showModal();
}

async function eliminar(id){
  if(!confirm('¿Eliminar este pedido?')) return;
  await Storage.eliminar(id); await cargar();
}

function llenarFiltros(){
  const m = $('fMes').value;
  const meses = [...new Set(datos.map(Calculos.mes).filter(Boolean))].sort().reverse();
  $('fMes').innerHTML = '<option value="">Todos los meses</option>' + meses.map(x=>`<option value="${x}">${nombreMes(x)}</option>`).join('');
  $('fMes').value = meses.includes(m) ? m : '';
}

function filtrados(){
  const m = $('fMes').value, e = $('fEstado').value, pr = $('fProducto').value, q = $('fBuscar').value.toLowerCase();
  return datos.map(norm).filter(p =>
    (!m || Calculos.mes(p)===m) && (!e || p.estado===e) && (!pr || p.producto===pr) &&
    (!q || [p.cliente,p.color,p.lugar,p.disenoLugar,p.producto,p.notas].join(' ').toLowerCase().includes(q))
  ).sort((a,b)=>b.fecha.localeCompare(a.fecha));
}

function render(){
  const lista = filtrados(), r = Calculos.reparto(lista, cfg.margen, cfg.socios);
  const m = $('fMes').value;
  $('subReparto').textContent = m ? nombreMes(m) : 'todos los meses';

  $('reparto').innerHTML = `
    <div class="paso"><span>Total cobrado</span><b>${money(r.cobrado)}</b></div><div class="op">−</div>
    <div class="paso"><span>Gastos (prendas + diseños)</span><b>${money(r.gastos)}</b></div><div class="op">−</div>
    <div class="paso"><span>Para el negocio (${cfg.margen}% de gastos)</span><b>${money(r.reserva)}</b></div><div class="op">=</div>
    <div class="paso"><span>Ganancia a repartir</span><b class="${r.neta>=0?'':'neg'}">${money(r.neta)}</b></div><div class="op">÷ ${cfg.socios}</div>
    <div class="paso dest"><span>Cada uno se lleva</span><b>${money(r.porSocio)}</b></div>`;
  $('stats').innerHTML =
    `<span class="stat">Pedidos <b>${lista.length}</b></span><span class="stat">Unidades <b>${r.unidades}</b></span>
     <span class="stat">Sin entregar <b>${r.pendientes}</b></span>`;

  $('tbody').innerHTML = lista.map(p=>{
    const g = Calculos.ganancia(p);
    const prenda = p.prendaPropia ? '<small>Trae el cliente</small>' : `${esc(p.lugar)||'—'}<small>${money(p.costoPrenda)} c/u</small>`;
    const dis = p.diseno==='Ninguno' ? '—' : `${esc(p.diseno)}<small>${esc(p.disenoLugar)} · ${money(p.costoDiseno)} ${p.disenoModo==='total'?'total':'c/u'}</small>`;
    return `<tr>
      <td>${esc(p.fecha)}</td><td><b>${esc(p.cliente)}</b></td>
      <td class="prod">${PRODUCTOS[p.producto]||'📦'} ${esc(p.producto)}<small>${esc([p.color,p.talle].filter(Boolean).join(' · '))}</small></td>
      <td>${p.cantidad}</td><td>${prenda}</td><td>${dis}</td>
      <td><select class="est ${p.estado}" data-estado="${p.id}">${Object.entries(ESTADOS).map(([k,v])=>`<option value="${k}" ${k===p.estado?'selected':''}>${v}</option>`).join('')}</select></td>
      <td class="num">${money(Calculos.gasto(p))}</td><td class="num">${money(p.cobrado)}</td>
      <td class="num ${g>=0?'pos':'neg'}">${money(g)}</td>
      <td><div class="acc"><button class="mini sec" data-edit="${p.id}">Editar</button><button class="mini del" data-del="${p.id}">✕</button></div></td></tr>`;
  }).join('') || '<tr><td colspan="11" class="vacio">No hay pedidos todavía. Tocá “+ Nuevo pedido”.</td></tr>';

  $('tbClientes').innerHTML = Calculos.porCliente(lista).map(c=>
    `<tr><td><b>${esc(c.nombre)}</b></td><td>${c.pedidos}</td><td>${c.unidades}</td>
     <td class="num pos">${money(c.cobrado)}</td><td class="num">${money(c.gastos)}</td><td>${c.pendientes||'—'}</td></tr>`
  ).join('') || '<tr><td colspan="6" class="vacio">Sin datos</td></tr>';
}

async function cargar(){ datos = await Storage.listar(); llenarFiltros(); render(); }

// Eventos
$('btnNuevo').onclick = () => abrirForm();
$('btnCancelar').onclick = () => $('dlgForm').close();
$('btnAjustes').onclick = () => $('dlgAjustes').showModal();
$('btnCerrarAjustes').onclick = () => $('dlgAjustes').close();
$('prendaPropia').onchange = () => { togglePropia(); calcVivo(); };
$('form').addEventListener('input', calcVivo);
$('form').addEventListener('submit', async e=>{
  e.preventDefault(); await Storage.guardar(leerForm()); $('dlgForm').close(); await cargar();
});
$('tbody').addEventListener('click', e=>{
  const t = e.target;
  if(t.dataset.edit) abrirForm(datos.find(x=>x.id===t.dataset.edit));
  if(t.dataset.del) eliminar(t.dataset.del);
});
$('tbody').addEventListener('change', async e=>{
  const id = e.target.dataset.estado; if(!id) return;
  const p = datos.find(x=>x.id===id); p.estado = e.target.value;
  await Storage.guardar(p); await cargar();
});
['fMes','fEstado','fProducto'].forEach(id=>$(id).addEventListener('change', render));
$('fBuscar').addEventListener('input', render);

['margen','socios'].forEach(k=>$(k).addEventListener('input', async ()=>{
  cfg[k] = Math.max(k==='socios'?1:0, Number($(k).value)||0);
  await Storage.setConfig(cfg); render();
}));

$('btnExportar').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(datos,null,2)],{type:'application/json'}));
  a.download = `pedidos-${hoy()}.json`; a.click();
};
$('fileImportar').addEventListener('change', async e=>{
  const f = e.target.files[0]; if(!f) return;
  try{
    const lista = JSON.parse(await f.text());
    if(!Array.isArray(lista)) throw 0;
    if(confirm('Esto reemplaza los datos actuales. ¿Seguir?')){ await Storage.reemplazarTodo(lista); await cargar(); }
  }catch{ alert('Archivo inválido'); }
  e.target.value = '';
});

function mostrarLogin(msg){
  $('login').hidden = false;
  if(msg) $('loginMsg').textContent = msg;
}

$('btnLogin').onclick = async () => {
  try{ await Storage.entrar(); }catch(e){ mostrarLogin('No se pudo iniciar sesión (' + (e.code||e.message) + ')'); }
};
$('btnSalir').onclick = () => Storage.salir();
$('btnMigrar').onclick = async () => {
  if(!confirm('Esto sube a la nube los pedidos que había en este navegador. ¿Seguir?')) return;
  try{ const n = await Storage.migrarLocal(); alert(n + ' pedidos subidos.'); await cargar(); }
  catch(e){ alert('Error: ' + (e.code||e.message)); }
};

(async function init(){
  const opts = Object.entries(PRODUCTOS).map(([k,v])=>`<option value="${k}">${v} ${k}</option>`).join('');
  $('producto').innerHTML = opts;
  $('fProducto').innerHTML = '<option value="">Todos</option>' + opts;
  try{
    await Storage.iniciar(async user => {
      if(!user){ $('usuario').textContent = ''; return mostrarLogin(); }
      try{
        cfg = await Storage.getConfig(); $('margen').value = cfg.margen; $('socios').value = cfg.socios;
        await cargar();
        $('usuario').textContent = user.email;
        $('login').hidden = true;
      }catch(e){
        await Storage.salir();
        mostrarLogin(e.code === 'permission-denied'
          ? 'Ese correo no tiene permiso para entrar. Probá con otra cuenta.'
          : 'Error al cargar los datos (' + (e.code||e.message) + ')');
      }
    });
  }catch(e){ mostrarLogin('No se pudo conectar con Firebase. Revisá tu internet.'); }
})();