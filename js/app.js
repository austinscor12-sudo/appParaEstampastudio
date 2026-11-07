const $ = id => document.getElementById(id);
const money = n => '$' + Math.round(n).toLocaleString('es-AR');
const ESTADOS = {pedido:'Pedido', falta:'Falta entregar', entregado:'Entregado'};
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
let datos = [], margen = 30;

const nombreMes = ym => { const [y,m] = ym.split('-'); return `${MESES[m-1]} ${y}`; };
const hoy = () => new Date().toISOString().slice(0,10);
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function leerForm(){
  return {
    id: $('id').value || crypto.randomUUID(),
    fecha: $('fecha').value, tipo: $('tipo').value, color: $('color').value.trim(),
    cantidad: Number($('cantidad').value)||0, lugar: $('lugar').value.trim(),
    cliente: $('cliente').value.trim(), estado: $('estado').value, diseno: $('diseno').value,
    costoPrenda: Number($('costoPrenda').value)||0, costoDiseno: Number($('costoDiseno').value)||0,
    cobrado: Number($('cobrado').value)||0, notas: $('notas').value.trim()
  };
}

function calcVivo(){
  const p = leerForm(), g = Calculos.ganancia(p);
  $('calcVivo').innerHTML =
    `<span>Costo total: <b>${money(Calculos.costoTotal(p))}</b></span>
     <span>Precio sugerido (+${margen}%): <b>${money(Calculos.sugerido(p,margen))}</b></span>
     <span>Ganancia: <b class="${g>=0?'pos':'neg'}">${money(g)} (${Calculos.porcentaje(p).toFixed(0)}%)</b></span>`;
}

function limpiarForm(){
  $('form').reset(); $('id').value=''; $('fecha').value = hoy();
  $('tituloForm').textContent='Nuevo pedido'; $('btnCancelar').hidden=true; calcVivo();
}

function editar(id){
  const p = datos.find(x=>x.id===id); if(!p) return;
  for(const k of ['id','fecha','tipo','color','cantidad','lugar','cliente','estado','diseno','costoPrenda','costoDiseno','cobrado','notas']) $(k).value = p[k] ?? '';
  $('tituloForm').textContent='Editando pedido'; $('btnCancelar').hidden=false;
  calcVivo(); window.scrollTo({top:0,behavior:'smooth'});
}

async function eliminar(id){
  if(!confirm('¿Eliminar este pedido?')) return;
  await Storage.eliminar(id); await cargar();
}

function llenarMeses(){
  const actual = $('fMes').value;
  const meses = [...new Set(datos.map(Calculos.mes).filter(Boolean))].sort().reverse();
  $('fMes').innerHTML = '<option value="">Todos los meses</option>' + meses.map(m=>`<option value="${m}">${nombreMes(m)}</option>`).join('');
  $('fMes').value = meses.includes(actual) ? actual : '';
}

function filtrados(){
  const m=$('fMes').value, e=$('fEstado').value, q=$('fBuscar').value.toLowerCase();
  return datos.filter(p =>
    (!m || Calculos.mes(p)===m) && (!e || p.estado===e) &&
    (!q || [p.cliente,p.color,p.lugar,p.tipo,p.notas].join(' ').toLowerCase().includes(q))
  ).sort((a,b)=> b.fecha.localeCompare(a.fecha));
}

function render(){
  const lista = filtrados(), t = Calculos.totales(lista, margen);
  $('resumen').innerHTML = [
    ['Pedidos', t.pedidos], ['Unidades', t.unidades], ['Pendientes de entregar', t.falta],
    ['Costo total', money(t.costo)], ['Sugerido (+'+margen+'%)', money(t.sugerido)],
    ['Cobrado', money(t.cobrado)], ['Ganancia', `<span class="${t.ganancia>=0?'pos':'neg'}">${money(t.ganancia)} (${t.porcentaje.toFixed(0)}%)</span>`]
  ].map(([l,v])=>`<div class="kpi"><span>${l}</span><b>${v}</b></div>`).join('');

  $('tbody').innerHTML = lista.map(p=>{
    const g = Calculos.ganancia(p);
    return `<tr>
      <td>${esc(p.fecha)}</td><td>${esc(p.tipo)}</td><td>${esc(p.color)}</td><td>${p.cantidad}</td>
      <td>${esc(p.lugar)}</td><td>${esc(p.cliente)}</td><td>${esc(p.diseno)}</td>
      <td><span class="tag ${p.estado}">${ESTADOS[p.estado]}</span></td>
      <td>${money(Calculos.costoTotal(p))}</td><td>${money(Calculos.sugerido(p,margen))}</td>
      <td>${money(p.cobrado)}</td>
      <td class="${g>=0?'pos':'neg'}">${money(g)} (${Calculos.porcentaje(p).toFixed(0)}%)</td>
      <td><button class="mini sec" data-edit="${p.id}">Editar</button>
          <button class="mini del" data-del="${p.id}">X</button></td></tr>`;
  }).join('') || '<tr><td colspan="13">No hay pedidos.</td></tr>';
}

async function cargar(){ datos = await Storage.listar(); llenarMeses(); render(); }

$('form').addEventListener('submit', async e=>{
  e.preventDefault(); await Storage.guardar(leerForm()); limpiarForm(); await cargar();
});
$('form').addEventListener('input', calcVivo);
$('btnCancelar').addEventListener('click', limpiarForm);
$('tbody').addEventListener('click', e=>{
  if(e.target.dataset.edit) editar(e.target.dataset.edit);
  if(e.target.dataset.del) eliminar(e.target.dataset.del);
});
['fMes','fEstado'].forEach(id=>$(id).addEventListener('change', render));
$('fBuscar').addEventListener('input', render);
$('margen').addEventListener('input', async ()=>{
  margen = Number($('margen').value)||0; await Storage.setConfig({margen}); calcVivo(); render();
});

$('btnExportar').addEventListener('click', ()=>{
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(datos,null,2)],{type:'application/json'}));
  a.download = `pedidos-${hoy()}.json`; a.click();
});
$('fileImportar').addEventListener('change', async e=>{
  const f = e.target.files[0]; if(!f) return;
  try{
    const lista = JSON.parse(await f.text());
    if(!Array.isArray(lista)) throw 0;
    if(confirm('Esto reemplaza los datos actuales. ¿Seguir?')){ await Storage.reemplazarTodo(lista); await cargar(); }
  }catch{ alert('Archivo inválido'); }
  e.target.value='';
});

(async function init(){
  margen = (await Storage.getConfig()).margen; $('margen').value = margen;
  limpiarForm(); await cargar();
})();