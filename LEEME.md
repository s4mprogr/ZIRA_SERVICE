# Zira · Portal de clientes

## Estructura
- `index.html` → portal de clientes (login con PIN, Mi sistema, Mi reporte)
- `prospecto/index.html` → landing para prospectos
- `_redirects` → hace que `tusitio.netlify.app/ana` abra el portal
- `apps-script/Code.gs` → API que va dentro de tu Google Sheet (no se usa desde Netlify)

## Configuración (una sola vez, ~30 min)
1. **Hoja:** Google Drive → Nuevo → Hojas de cálculo. Archivo → Importar → Subir `zira-portal-base.xlsx` → "Reemplazar hoja de cálculo".
2. **Script:** en la hoja, Extensiones → Apps Script. Borra lo que haya, pega `Code.gs` y guarda.
3. **Publicar el script:** Implementar → Nueva implementación → tipo "Aplicación web". Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier persona**. Implementar y autoriza (si Google dice "app no verificada": Configuración avanzada → Ir a… Es tu propio script). Copia la URL que termina en `/exec`.
4. **Conectar:** en `index.html`, busca `API: ""` y pega la URL entre las comillas.
5. **GitHub + Netlify:** sube esta carpeta a un repositorio. En Netlify: Add new project → Import from Git → elige el repo. Sin comando de build; carpeta de publicación: la raíz. Deploy.
6. **Probar:** abre `tusitio.netlify.app/demo` con PIN `1234`.

## Operación
- **Nuevo cliente:** fila en *Clientes* (slug, nombre, PIN, inicio, paso 1, activo "si"). Le envías `tusitio.netlify.app/slug` + su PIN.
- **Avance del onboarding:** cambia el número de *paso* (1 a 7). En 7 se desbloquea Mi reporte.
- **Cada lunes:** una fila en *Semanas* y una fila por cita en *Visitas*.
- *Expectativas* y *Feedback* se llenan solas desde el portal.
- Si cambias `Code.gs` más adelante: Implementar → Gestionar implementaciones → editar → Nueva versión (la URL no cambia).
- Borra las filas `demo` cuando tengas tu primer cliente real.
