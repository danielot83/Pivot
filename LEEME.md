# Paquetes 68 + 69 + 70 en un solo zip (sin carpetas)

Todo suelto, al mismo nivel. Contiene lo nuevo o cambiado desde el paquete 67 (supone que el 67 ya está subido).

## Qué hacer (en este orden)

### 1. Supabase (SQL Editor → New query → pegar el CONTENIDO del archivo → Run)
1. `step95_season_objectives.sql` — **necesario** para guardar objetivos en la página nueva «Season plan». Repetible sin problema.
2. `step94_security_audit_nov2026.sql` — **opcional pero recomendado** (seguridad: impide que un entrenador de un club toque datos de otro club y quita permisos innecesarios a usuarios anónimos). Repetible sin problema.
Hazlo ANTES de subir las páginas. Pega el contenido, no el nombre del archivo ni el de otro archivo (por ejemplo, el .htaccess daría el error «syntax error at or near #»).

### 2. GitHub: subir a la RAÍZ del repositorio (reemplazando los existentes)
Páginas: `assessment.html`, `attendance.html`, `compare.html`, `dashboard.html`, `exercises.html`, `help.html`, `index.html`, `legal-architecture.html`, `library.html`, `login.html`, `match.html`, `module.html`, `play_design.html`, `play_library.html`, `privacy.html`, `privacy-archive.html`, `privacy-v2026-08-15.html`, `privacy-v2026-09-17.html`, `roster.html`, `season.html`, `settings.html`, `stats.html`, `training.html`.
Scripts: `security-guard.js`, `stat-measured.js`, `sw.js`, `i18n-fr.js`, `i18n-es.js`.

### 3. El archivo de despliegue (único que NO va en la raíz)
`deploy-infomaniak.yml` debe quedar en la ruta **`.github/workflows/deploy-infomaniak.yml`** del repositorio (reemplaza el existente). En GitHub: Add file → Create new file → escribe `.github/workflows/deploy-infomaniak.yml` como nombre y pega el contenido. Cambia la subida a FTP **cifrado** (ftps) y ya no publica `.sql`, `docs/` ni `README.md`.
⚠️ Si tras subirlo el Action falla por la conexión, cambia la línea `protocol: ftps` por `protocol: ftp` y avísame.

### 4. Opcional: cabeceras de seguridad del servidor
`htaccess-seguridad-OPCIONAL.txt` → créalo como `.htaccess` en `sites/playpivot.app/` en el gestor de archivos de Infomaniak (una vez; si ya tienes `.htaccess`, solo añade las líneas). Si algo falla, bórralo. No es necesario para que nada funcione.

### 5. Comprobar
Ctrl+F5 en la web. En el menú lateral, grupo Team, debe salir **Season plan**.

## Qué trae cada paquete
**68 — seguridad:** `security-guard.js` (anti-iframe y limpieza de borradores al cerrar sesión), enlaces externos seguros, CSP sin dominios que ya no se usan, `sw.js` más estricto, despliegue cifrado, step94.
**69 — «solo lo medido»:** ficha del jugador, estadísticas y comparar solo muestran lo que realmente se anotó (`stat-measured.js`).
**70 — organizador de temporada:** página «Season plan» (objetivos globales y de equipo, % por temática, qué falta, consejos, informe PDF/Excel), copiar jugadores de otra temporada, avisos en el Dashboard, ficha más rica, reparto del tiempo de juego. EN/FR/ES.

## Honesto
- No hecho: vista de padres/jugadores (pospuesta); lesiones y contactos (dijiste que no); alojar las librerías externas (CDN) en tu dominio y fijar versiones (te lo propuse en el 68, sigue pendiente si quieres); 2FA.
- Los consejos de calendario son genéricos.
