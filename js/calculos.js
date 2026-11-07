// Toda la matemática del negocio está acá (fácil de cambiar).
const Calculos = {
  costoTotal(p){ return (Number(p.cantidad)||0) * ((Number(p.costoPrenda)||0) + (Number(p.costoDiseno)||0)); },
  // Precio sugerido = costo + margen%
  sugerido(p, margen){ return this.costoTotal(p) * (1 + margen/100); },
  // Lo que queda en el negocio = lo cobrado - el costo
  ganancia(p){ return (Number(p.cobrado)||0) - this.costoTotal(p); },
  // % de ganancia sobre el costo
  porcentaje(p){ const c = this.costoTotal(p); return c > 0 ? this.ganancia(p)/c*100 : 0; },
  mes(p){ return (p.fecha||'').slice(0,7); }, // "2026-11"
  totales(lista, margen){
    const t = {pedidos:lista.length, unidades:0, costo:0, sugerido:0, cobrado:0, ganancia:0, falta:0};
    lista.forEach(p=>{
      t.unidades += Number(p.cantidad)||0;
      t.costo += this.costoTotal(p);
      t.sugerido += this.sugerido(p, margen);
      t.cobrado += Number(p.cobrado)||0;
      t.ganancia += this.ganancia(p);
      if(p.estado !== 'entregado') t.falta++;
    });
    t.porcentaje = t.costo > 0 ? t.ganancia/t.costo*100 : 0;
    return t;
  }
};