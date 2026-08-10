# 📦 Barcode Studio

Aplicación web en **React + TypeScript + Vite** para generar códigos de barras e
imprimir etiquetas profesionales. Funciona 100 % en el navegador (sin servidores)
y está lista para desplegar en **Vercel**.

## ✨ Características

- **9 simbologías**: Code 128, EAN-13, EAN-8, UPC-A, UPC-E, ITF-14, Code 39, Code 93 y Codabar.
- **Propuesta automática de códigos** ✨: genera valores válidos (con dígito de control) para la simbología elegida, siempre editables.
- **Etiquetas editables**: modifica el código, la simbología o el texto de cualquier etiqueta ya añadida a la hoja.
- **Vista previa en vivo** con validación de formato y dígito de control.
- **Generación masiva**: pega una lista de códigos (uno por línea) y define la cantidad por código.
- **Plantillas de etiquetas A4** en milímetros: Grande, 2 × 7, 3 × 8 y 4 × 6.
- **Impresión optimizada**: CSS de impresión que imprime solo las etiquetas en A4 vertical sin márgenes.
- **Exportar a PDF**: descarga la hoja como PDF real (A4, medidas en mm) con un solo clic.
- **Personalización**: ancho de barra, altura, tamaño de texto, margen, color y texto personalizado por etiqueta.
- **Descarga PNG** de alta resolución de cada código.
- Diseño responsivo y en español.

## 🚀 Uso local

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # compilación de producción (carpeta dist/)
npm run preview    # previsualizar el build
```

## ▲ Desplegar en Vercel

### Opción A — Importar el repositorio (recomendada)

1. Sube este proyecto a un repositorio de GitHub/GitLab/Bitbucket.
2. Entra en [vercel.com/new](https://vercel.com/new) e **Import** el repositorio.
3. Vercel detecta automáticamente **Vite** (usa el `vercel.json` incluido):
   - Build command: `npm run build`
   - Output directory: `dist`
4. Pulsa **Deploy**. Listo. No se requieren variables de entorno.

### Opción B — CLI de Vercel

```bash
npm i -g vercel
vercel          # despliegue de prueba (preview)
vercel --prod   # despliegue de producción
```

## 🖨️ Consejos de impresión

1. Elige una plantilla (p. ej. A4 · 2 × 7) y añade tus etiquetas.
2. Pulsa **Imprimir hoja**.
3. En el diálogo del navegador: orientación **vertical**, tamaño **A4**,
   márgenes **ninguno** y desactiva encabezados y pies de página.

## 🛠️ Stack

| Tecnología | Uso |
| --- | --- |
| React 19 + TypeScript | Interfaz |
| Vite 6 | Bundler y dev server |
| [JsBarcode](https://github.com/lindell/JsBarcode) | Render de códigos de barras |

## 📄 Licencia

MIT — úsala y modifícala libremente.
