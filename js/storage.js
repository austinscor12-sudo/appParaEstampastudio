// Capa de datos con Firebase (Login con Google + Firestore).
// Los pedidos se guardan en la colección "pedidos" y los ajustes en config/general.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA3fgL8cQnQOyV3muja4FoyrBHWHCqUjgg",
  authDomain: "appestampastudio.firebaseapp.com",
  projectId: "appestampastudio",
  storageBucket: "appestampastudio.firebasestorage.app",
  messagingSenderId: "1083527327094",
  appId: "1:1083527327094:web:79be86ef4496877d025e57"
};

const Storage = {
  LOCAL_KEY: 'pedidos_v1', // datos viejos del navegador (para migrar)
  DEF: {margen:30, socios:3},
  _f: null,

  async _fb(){
    if(this._f) return this._f;
    const B = 'https://www.gstatic.com/firebasejs/13.2.0/';
    const [appM, authM, fsM] = await Promise.all([
      import(B+'firebase-app.js'), import(B+'firebase-auth.js'), import(B+'firebase-firestore.js')
    ]);
    const app = appM.initializeApp(FIREBASE_CONFIG);
    this._f = {authM, fsM, auth: authM.getAuth(app), db: fsM.getFirestore(app)};
    return this._f;
  },

  // Llama a cb(user) cuando cambia el login (user = null si no hay sesión)
  async iniciar(cb){ const f = await this._fb(); f.authM.onAuthStateChanged(f.auth, cb); },
  async entrar(){ const f = await this._fb(); await f.authM.signInWithPopup(f.auth, new f.authM.GoogleAuthProvider()); },
  async salir(){ const f = await this._fb(); await f.authM.signOut(f.auth); },

  async listar(){
    const {fsM, db} = await this._fb();
    const snap = await fsM.getDocs(fsM.collection(db, 'pedidos'));
    return snap.docs.map(d => d.data());
  },
  async guardar(p){
    const {fsM, db} = await this._fb();
    await fsM.setDoc(fsM.doc(db, 'pedidos', p.id), p);
  },
  async eliminar(id){
    const {fsM, db} = await this._fb();
    await fsM.deleteDoc(fsM.doc(db, 'pedidos', id));
  },
  async _lote(ops){ // ops: [{set:p} | {del:id}] en tandas de 400
    const {fsM, db} = await this._fb();
    for(let i=0; i<ops.length; i+=400){
      const b = fsM.writeBatch(db);
      ops.slice(i, i+400).forEach(o => o.del
        ? b.delete(fsM.doc(db,'pedidos',o.del))
        : b.set(fsM.doc(db,'pedidos',o.set.id), o.set));
      await b.commit();
    }
  },
  async reemplazarTodo(lista){
    lista = lista.map(p => ({...p, id: p.id || crypto.randomUUID()}));
    const ids = new Set(lista.map(p=>p.id));
    const ops = (await this.listar()).filter(p=>!ids.has(p.id)).map(p=>({del:p.id}));
    await this._lote(ops.concat(lista.map(p=>({set:p}))));
  },
  async migrarLocal(){ // sube a la nube lo que había en este navegador
    let local = [];
    try{ local = JSON.parse(localStorage.getItem(this.LOCAL_KEY)) || []; }catch{}
    await this._lote(local.map(p=>({set:{...p, id: p.id || crypto.randomUUID()}})));
    return local.length;
  },
  async getConfig(){
    const {fsM, db} = await this._fb();
    const s = await fsM.getDoc(fsM.doc(db,'config','general'));
    return {...this.DEF, ...(s.exists() ? s.data() : {})};
  },
  async setConfig(c){
    const {fsM, db} = await this._fb();
    await fsM.setDoc(fsM.doc(db,'config','general'), c);
  }
};