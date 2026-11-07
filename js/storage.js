// Capa de datos. Hoy usa localStorage (navegador).
// Para pasar a Firestore después, solo reescribí estas funciones (mismos nombres, todas async).
const Storage = {
  KEY: 'pedidos_v1', CFG: 'pedidos_cfg_v1',
  DEF: {margen:30, socios:3},
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
  async getConfig(){ try{ return {...this.DEF, ...JSON.parse(localStorage.getItem(this.CFG))}; }catch{ return {...this.DEF}; } },
  async setConfig(c){ localStorage.setItem(this.CFG, JSON.stringify(c)); }
};