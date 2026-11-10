# Paquete 68 — Prueba de humo x2 + auditoría de seguridad

Paquete único acumulado: incluye todo lo del 67 más lo nuevo de seguridad.

(Lo del paquete 67 —contador en directo completo, secciones del creador de ejercicios, radar, etc.— sigue incluido; su explicación está en el doc del proyecto "entrega67".)

## Qué hay que subir
- Todo lo de esta carpeta, respetando carpetas, al repositorio (22 páginas .html, `sw.js`, `security-guard.js` nuevo, `.github/workflows/deploy-infomaniak.yml`).
- **Supabase: NO es obligatorio.** Hay UN script opcional, de riesgo bajo, repetible sin problema: `database/step94_security_audit_nov2026.sql` (SQL Editor → pegar → Run). Ver abajo.

## Resultado
- Prueba de humo 1 y 2: 151 recorridos (páginas × idiomas EN/FR/ES × 3 modos × roles) sin errores nuevos; 2ª pasada idéntica a la 1ª tras los arreglos (único error JS: botón GIF de diseño de jugadas, solo en el entorno de pruebas). ~100 tests funcionales EN/FR/ES OK. Sin desbordes a 360/390 px.
- XSS: 93 recorridos/tests con datos "envenenados" (nombres, notas, Excel importados…): **0 ejecuciones de código**.
- Base de datos: reproducida en un Postgres local con los 88 scripts; todas las tablas con RLS; ~80 ataques simulados (otro club, otro equipo, anónimo, sin rol…) bloqueados salvo 2 hallazgos bajos → corregidos en step94.

## Cambios de seguridad
1. **security-guard.js** (nuevo, cargado en todas las páginas): si alguien mete PlayPivot en un iframe de otra web (clickjacking) la página se oculta; al cerrar sesión se borran borradores locales (ejercicios, contador en vivo).
2. **Enlaces `target="_blank"`** con `rel="noopener noreferrer"`.
3. **Quitado** de la política CSP el dominio de OCR (`tessdata...`) que ya no se usa, y los enlaces muertos a Google Fonts (privacidad: ya no se avisa a Google).
4. **sw.js v2**: no cachea `/analytics/` ni rutas que no sean archivos estáticos; incluye security-guard.js.
5. **training.html**: tolera `coaches` mal formado (no rompe la página).
6. **Despliegue** (deploy-infomaniak.yml): FTP **cifrado** (`protocol: ftps`) — antes usuario y contraseña viajaban sin cifrar —, y ya NO se publican `.sql`, `docs/`, `README.md` ni 4 PNG sueltos sin uso. ⚠️ Si Infomaniak rechazara la conexión cifrada, el Action fallará: pon `protocol: ftp` (una línea) y avísame.
7. **step94 (opcional)**: 
   - impide que un entrenador de un club registre estadísticas/asistencia de un jugador de OTRO club (solo se podía forzando llamadas a mano);
   - quita permiso de ejecución a `anon` en funciones internas `visible_*`.

## Opcional: cabeceras del servidor
`opcional/htaccess-seguridad-OPCIONAL.txt` → créalo como `.htaccess` en `sites/playpivot.app/` (en el gestor de archivos de Infomaniak, UNA vez; si ya tienes `.htaccess`, solo añade las líneas). Da `frame-ancestors`, nosniff, HSTS, etc. Si tras ponerlo algo falla, bórralo y vuelve todo a como estaba.

## Qué NO se ha hecho (honesto)
- **Scripts de CDN sin SRI y `supabase-js@2` sin fijar versión**: no pude calcular los hashes (el CDN está bloqueado desde mi entorno). Riesgo: si el CDN o esa versión se comprometen, entra código ajeno. Solución recomendada: alojar las librerías en tu propio dominio (carpeta `vendor/`); es un cambio mediano. **Dime si lo hago.**
- Sin 2FA (depende de Supabase Auth; se activa en su panel si quieres).
- Por diseño, nombres de club/equipo visibles sin sesión (hacen falta para registrarse). La clave anónima de Supabase es pública por naturaleza; la protección real es RLS (revisada).
- Los tests que usan tus Excel reales (import real) no se pudieron repetir sin esos archivos; el XSS de importación sí con Excel sintéticos.
- Recomendación manual: borra `step78_join_team_picker.sql` de la raíz del repo (ya no se publica, pero sobra).
