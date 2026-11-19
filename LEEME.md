# Paquete 88 — Términos de uso + Política de privacidad (versión 2026-11-18)

Sube **todos** los archivos de este zip a la raíz (mismo sitio que el resto). **Sin SQL** (usa tablas y funciones que ya existen). Incluye lo de los paquetes 83–87 en `match.html`, `i18n-fr.js` e `i18n-es.js`.

## Qué cambia
- **`privacy.html` reescrito** en EN/FR/ES: Parte A (Condiciones de uso) y Parte B (Política de privacidad), con resumen «En claro» y índice. Cambia de idioma con el selector de la página.
- **`terms-version.js`:** versión nueva `2026-11-18` y un bloque `PIVOT_LEGAL` para rellenar **tú**: nombre del operador, correo de contacto, tribunal (por defecto Lausana) y región real de Supabase. Vacío = el documento usa un texto neutro («el equipo de PlayPivot»).
- **Re-aceptación (`dashboard.html`):** al abrir el Panel, quien no haya aceptado la versión vigente ve una pantalla para aceptarla (o cerrar sesión). Antes el documento lo prometía y no existía.
- **`login.html`:** la casilla del registro corregida (datos del club vs. datos de tu cuenta) y confirma «soy adulto y actúo en nombre de mi club».
- **`match.html`:** aviso de privacidad en «Rellenar con IA» y en su guía.
- **Versiones antiguas:** `privacy-archive.html` lista las cuatro; las páginas archivadas ahora muestran **su** versión fija (antes mostraban la vigente) y comprueban la aceptación de esa versión. Texto de las archivadas intacto. Nueva: `privacy-v2026-09-17-final.html` (la página viva anterior, que difería ligeramente de la publicada).
- **Matomo sin cookies:** `_paq.push(['disableCookies'])` en todas las páginas (el texto decía «sin cookies» pero el código no lo hacía). Son las demás `.html` del zip.

## Probado
Página legal en EN/FR/ES (99 bloques traducidos sin restos en inglés, mismas etiquetas, índice y referencias A/P válidos), tarjeta de estado de aceptación, pantalla de re-aceptación (sin aceptaciones / versión antigua / versión actual; no escribe sin marcar; llama a la función del servidor con la versión), login traducido, todas las páginas en 3 idiomas, comprobación estática, XSS limpio (`XSSHITS=[]`).

## No hecho / pendiente tuyo
- **No es revisión de un abogado.** Léelo con un jurista antes de dar publicidad entre clubes con menores.
- Rellenar `PIVOT_LEGAL` (operador, correo, **región real de Supabase**) y firmar/guardar el DPA de Supabase.
- Confirmar en Matomo que la anonimización de IP está activada en el servidor (no lo puedo ver).
- La pantalla de re-aceptación solo está en el Panel: quien entre directo a otra página no la ve hasta abrirlo. Si falla la consulta, no se bloquea a nadie.
- No tocado: librerías de jsDelivr (sin SRI, `supabase-js@2` flotante), la frase «sin ánimo de lucro» de la portada, alemán.
- Supuestos míos: derecho suizo/Lausana, servicio gratuito, cuentas solo adultos.
