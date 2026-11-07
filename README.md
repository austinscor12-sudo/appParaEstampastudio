# Control de pedidos

Carpeta:
```
control-pedidos/
├── index.html
├── css/styles.css
└── js/
    ├── calculos.js   ← fórmulas (costo, sugerido, ganancia, %)
    ├── storage.js    ← guardado de datos (hoy localStorage, mañana Firestore)
    └── app.js        ← pantalla y eventos
```

## Usar
Abrí `index.html` (o Live Server en VS Code). Los datos se guardan en el navegador.
Hacé copias con "Exportar copia" seguido.

## Subir
- GitHub: `git init`, commit, push.
- Cloudflare Pages: conectar el repo, sin build command, output directory `/`.

## Fórmulas
- Costo total = cantidad × (costo prenda + costo diseño)
- Sugerido = costo total × (1 + margen%)
- Ganancia = cobrado − costo total
