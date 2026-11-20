# Paquete 89 — Aviso de datos de menores (con registro en la base de datos)

Sube todos los archivos de este zip a la raíz (`step98_data_notice.sql` va a tu carpeta `database`, y se ejecuta en Supabase, ver abajo). Incluye lo de los paquetes 83–88 en `match.html`, `i18n-fr.js` e `i18n-es.js`.

## SQL: SÍ hay que ejecutarlo
Supabase → SQL Editor → New query → pega `step98_data_notice.sql` → Run. Es seguro ejecutarlo más de una vez y no toca ninguna tabla existente. Crea `data_notice_acks` (quién aceptó el aviso, cuándo y de qué versión) y la función `record_data_notice()`; la fecha la pone el servidor y nadie puede escribir ni borrar a mano. Mientras no lo ejecutes, el aviso sale igual y se recuerda solo en ese navegador (sin prueba en la base de datos).

## Qué hace
La primera vez que una persona va a **guardar jugadores reales** sale una ventana (EN/FR/ES): tu club debe tener derecho a guardar esos datos (consentimiento de padres/tutores donde la ley lo pida), PlayPivot no lo comprueba ni responde de ello, y no se escriben datos de salud, teléfonos, direcciones, fotos ni documentos de identidad. Hay que marcar «Lo entiendo y confirmo que mi club tiene derecho…» y pulsar Continuar; Cancelar o Esc no guarda nada.
- Sale en: **Roster** (añadir jugador, importar Excel, copiar de otra temporada), **Asistencia** (añadir jugador, importar Excel) y **Partido** (añadir un invitado).
- No sale en los equipos de ejemplo (son jugadores famosos de ejemplo, no datos de tu club).
- Una vez aceptado no vuelve a salir (se comprueba en la base de datos, así que tampoco al cambiar de móvil/ordenador). Si cambias el texto, sube `PIVOT_DATA_NOTICE_VERSION` en `data-notice.js` y se vuelve a pedir a todos.
- En Roster el botón Guardar se bloquea antes de esperar al aviso: un doble clic no duplica el jugador.
- `sw.js`: añade `data-notice.js` a la caché sin conexión (caché v4).

## Probado
EN/FR/ES: sale la primera vez; sin casilla no avanza; Cancelar/Esc no escribe nada; al aceptar se registra 1 vez (versión correcta) y se guarda 1 jugador; no vuelve a salir; si ya está aceptado en la base de datos no sale; si la función no existe (SQL sin ejecutar) deja seguir. SQL validado en Postgres 16 (idempotente; insert/update/delete directos denegados; anónimo denegado; cada persona solo ve lo suyo y la plataforma ve todo). Todas las páginas en 3 idiomas, página legal, regresión de Roster/Asistencia/Partido, comprobación estática y XSS (`XSSHITS=[]`).

## No hecho / a tener en cuenta
- Es una advertencia y una prueba de que se avisó; **no sustituye** el consentimiento de los padres ni te quita tus obligaciones propias (seguridad, borrado, avisar si hay una brecha).
- No se pide otra vez por jugador ni por club: una vez por persona y versión de aviso.
- No he cambiado el texto de los Términos (para no obligar a todos a aceptar de nuevo). Si quieres mencionar el aviso en la cláusula A3, se hace con la próxima versión.
- Quien tenga una pestaña vieja abierta usa la versión anterior hasta recargar.
