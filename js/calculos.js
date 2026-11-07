// Toda la matemática del negocio está acá.
const Calculos = {
  gastoPrenda(p){ return p.prendaPropia ? 0 : (Number(p.cantidad)||0) * (Number(p.costoPrenda)||0); },
  gastoDiseno(p){
    const c = Number(p.costoDiseno)||0;
    return p.disenoModo === 'total' ? c : (Number(p.cantidad)||0) * c;
  },
  gasto(p){ return this.gastoPrenda(p) + this.gastoDiseno(p); },
  ganancia(p){ return (Number(p.cobrado)||0) - this.gasto(p); },
  mes(p){ return (p.fecha||'').slice(0,7); },

  // Tu método: cobrado - (gastos + % del negocio sobre los gastos) = a repartir ÷ socios
  reparto(lista, margen, socios){
    const r = {cobrado:0, gastos:0, unidades:0, pendientes:0};
    lista.forEach(p=>{
      r.cobrado += Number(p.cobrado)||0;
      r.gastos += this.gasto(p);
      r.unidades += Number(p.cantidad)||0;
      if(p.estado !== 'entregado') r.pendientes++;
    });
    r.reserva = r.gastos * (margen/100);
    r.neta = r.cobrado - r.gastos - r.reserva;
    r.porSocio = r.neta / Math.max(1, socios);
    return r;
  },

  porCliente(lista){
    const m = {};
    lista.forEach(p=>{
      const k = (p.cliente||'Sin nombre').trim().toLowerCase();
      const c = m[k] ||= {nombre:(p.cliente||'Sin nombre').trim(), pedidos:0, unidades:0, cobrado:0, gastos:0, pendientes:0};
      c.pedidos++; c.unidades += Number(p.cantidad)||0;
      c.cobrado += Number(p.cobrado)||0; c.gastos += this.gasto(p);
      if(p.estado !== 'entregado') c.pendientes++;
    });
    return Object.values(m).sort((a,b)=>b.cobrado-a.cobrado);
  }
};