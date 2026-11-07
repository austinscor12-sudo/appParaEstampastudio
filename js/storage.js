// Capa de datos. Hoy usa localStorage (navegador).
// Para pasar a Firestore después, solo reescribí estas funciones
// manteniendo los mismos nombres (todas son async).
const Storage = {
  KEY: 'pedidos_v1', CFG: 'pedidos_cfg_v1',
  async listar(){ try{ return JSON.parse(localStorage.getItem(this.KEY)) || []; }catch{ return []; } },
  async _guardarTodo(lista){ localStorage.setItem(this.KEY, JSON.stringify(lista)); },
  async guardar(p){
    const lista = await this.listar();
    const i = lista.findIndex(x=>x.id===p.id);
    if(i>=0) lista[i]=p; else lista.push(p);
    await this._guardarTodo(lista);
  },
  async eliminar(id){ await this._guardarTodo((await this.listar()).filter(x=>x.id!==id)); },
  async reemplazarTodo(lista){ await this._guardarTodo(lista); },
  async getConfig(){ try{ return JSON.parse(localStorage.getItem(this.CFG)) || {margen:30}; }catch{ return {margen:30}; } },
  async setConfig(c){ localStorage.setItem(this.CFG, JSON.stringify(c)); }
};