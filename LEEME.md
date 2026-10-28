# Idiomas EN / FR / ES — fase 3: test funcional completo

> **Antes de copiar nada: guarda tu zip actual** (como dijiste). Si algo no
> te convence, vuelves a ese estado y listo. Todo lo nuevo se puede quitar
> borrando la línea `<script src="./i18n.js?v=2">` de cada página.

## Qué cambia respecto a la entrega anterior (piloto)
Ahora **todas** las pantallas están traducidas, no solo Dashboard, Roster,
Attendance y Stats:

| Módulo | Estado |
|---|---|
| Menú lateral, barra superior, selector de club/equipo, mensajes | Todas las páginas |
| Dashboard, Roster, Attendance, Match stats | Completo (como ya viste) |
| **Match day**, **Training builder**, **Exercise creator**, **Exercise library**, **Play design**, **Playbook**, **Player assessment**, **Statistics (Compare)** | Completo: pantalla, ayudas "?", mensajes, avisos, PDF, Excel, importación |
| **Settings** y **Help** | Completo (miembros, organigrama, compartir en bloque, asociaciones, borrar cuenta…) |
| **Portada (index)**, **login/registro**, **página de cada módulo** | Traducidas; el selector EN·FR·ES aparece flotando arriba a la derecha |
| Páginas legales (privacy, legal-architecture) | Siguen en inglés, como pediste |

## Test funcional completo (esta entrega)
Rastreador automático en Chromium real (`tools/crawl/`) con una BD simulada
**con memoria** (lo que se crea/edita/borra cambia los datos como en la real) y
datos de ejemplo ricos (club, 3 equipos, 10 jugadores, partidos con stats,
entrenamientos, ejercicios, jugadas, evaluaciones…). Hace clic en TODO lo
clicable de cada página (3 pasadas: normal, rellenando formularios antes de cada
clic, y orden inverso), acepta los cuadros de confirmación y descarga los
PDF/Excel. 17 páginas × {versión original sin idiomas, EN, FR, ES} y, además,
roles coach, plataforma y "limitado a un equipo" en 12 páginas (~600 recorridos).
Se compara acción por acción: orden de acciones, **datos escritos en la BD**,
errores JS, tipo de cuadros de diálogo, navegaciones, descargas (tipo de
archivo) y filas finales por tabla.
- **Resultado:** EN, FR y ES se comportan **igual que la versión original** en
  todo (mismas escrituras en la BD, mismos errores, mismas descargas).
- **Encontró 3 cosas, ya corregidas:**
  1. Settings → "Compartir en bloque": si el selector tenía un valor raro, la
     traducción lanzaba un error JS (antes mostraba "undefined"). Ahora `_t()`
     tolera valores no-texto.
  2. En el aviso de "Eliminar equipo" (Assessment, Attendance, Play design,
     Roster) el género salía en inglés ("Junior Mixed") en FR/ES.
  3. Textos sin traducir: avisos "El rival/equipo/título es obligatorio…" del
     Dashboard y Attendance, mensajes de lectura de foto (Exercises/Match),
     "Persona concreta" (Training) y "Aún no hay jugadores en este equipo"
     (Assessment).
- El único error JS que aparece (GIF en Play design) es del entorno de prueba
  (la librería externa de GIF no se carga) y ocurre igual en la versión original.
- Los mensajes de error que devuelve la propia base de datos (Supabase)
  seguirán en inglés: vienen del servidor.
- Diccionario: 1.958 entradas, sin conflictos.

## Una sola base de datos (comprobado, no solo prometido)
- No se ha tocado nada de la base de datos ni de sus tablas.
- Todo lo que se **guarda** sigue en inglés y es idéntico en los 3 idiomas:
  estados, categorías, géneros, roles (`admin`/`coach`), visibilidad
  (`private/team/association/community`), idioma de exportación, etc.
  Los desplegables tienen el `value` en inglés; solo cambia el texto visible.
- Lo que creas tú (nombres de jugadores, equipos, clubes, ejercicios, jugadas,
  notas, textos libres) **no se traduce** nunca.
- Nada del código lee el texto de la pantalla para decidir qué guardar.
- Mensajes que el sistema envía a una persona (p. ej. la solicitud de borrado
  de login que le llega al admin de la plataforma) siguen en inglés: son datos.
- Los prompts de IA que copias siguen en inglés (las IA los entienden mejor y
  el formato de respuesta no debe cambiar).

## Cómo lo comprobé
Todo en Chromium real con Supabase simulado, en EN, FR y ES:
1. **El inglés queda idéntico** a las páginas originales (antes de i18n):
   19 páginas/estados (incluida la portada, login, 3 variantes de módulo,
   Settings, Statistics…) comparados texto a texto y atributo a atributo,
   más los flujos de Settings, Login y Compare con datos de prueba.
2. **Lo que se escribe en la BD es idéntico en EN, FR y ES** (mismo JSON) en:
   Roster, Attendance, Match day, Training, Exercises, Library, Play design,
   Playbook, Assessment, Settings (cambio de rol/estado/equipo de un miembro,
   compartir en bloque, asociaciones, idioma de exportación, secciones de PDF,
   validadores, solicitud de borrado). Incluye las acciones destructivas
   (borrar, quitar miembro) con los cuadros de confirmación traducidos.
3. 22 páginas HTML y 9 archivos JS: etiquetas equilibradas, sin IDs
   duplicados, sintaxis correcta, **0 enlaces rotos**.
4. Barridos de textos sin traducir (estáticos y dinámicos) en cada página, en
   FR y ES: solo quedan nombres propios (PlayPivot, nombres de idiomas,
   datos de ejemplo como "Chicago Bulls") y datos tuyos.
5. Diccionario: 1.947 entradas, sin conflictos.

## Cambios que debes conocer (todos pequeños)
- **GIF de Play design:** el aviso de "se quedó colgado" estaba escrito en
  español dentro del código; ahora es una clave en inglés con traducción FR/ES.
  En EN verás ese aviso (raro) en inglés en vez de en español.
- **Exportaciones:** PDF y Excel de Roster, Attendance, Match, Training,
  Assessment, Play design, Statistics salen en el idioma de la pantalla. Los
  **PDF de Exercises/Library** siguen el "Export language" de Settings (del
  club), porque llevan etiquetas fijas del club y a veces textos de otras
  personas. **Decisión tuya:** ¿quieres que también sigan el idioma de la
  pantalla? (El texto de Settings > Export language dice "PDFs … generados
  en"; no lo cambié para que el inglés quede idéntico.)
- **Nombres guardados por la app** ("Variante A", " (copy)", el texto de la
  evaluación de ejemplo) no se tocan: son datos que se guardan.
- Listas y desplegables con nombres de usuario/club/equipo llevan marca de
  "no traducir" (así un club llamado "Roster" no se convierte en "Effectif").
- Regla técnica nueva: los huecos `{n}`, `{total}`… solo aceptan números
  (evita falsos aciertos como "Nuevo partido" → "New partido").
- Mensajes de error de acceso más comunes de Supabase ("Invalid login
  credentials", "Email not confirmed", etc.) se traducen; los raros salen en
  inglés tal cual los envía el servidor.
- Las **capturas de ejemplo** de la página de cada módulo (imágenes) siguen en
  inglés: son imágenes, no texto.
- Subí `VERSION` de `i18n.js` a 2 y los enlaces a `i18n.js?v=2` (para saltarse
  la caché del navegador).
- El selector de idioma, si la página no tiene barra superior (portada,
  login, módulo), flota arriba a la derecha.

## Terminología (revísala con hablantes nativos)
Roster = Effectif / Plantilla · Attendance = Présences / Asistencia · Match
day = Jour de match / Día de partido · Exercise creator = Création
d'exercices / Creador de ejercicios · Training builder = Préparation des
séances / Constructor de entrenamientos · Play design = Création de systèmes
/ Diseño de jugadas (una *play* = système / jugada) · Playbook = Playbook ·
Notebook = Carnet / Cuaderno · Player assessment = Évaluation des joueurs /
Evaluación de jugadores · Statistics = Statistiques / Estadísticas · Admin =
Administrateur / Administrador · Coach = Entraîneur / Entrenador · Called
up = Convoqué / Convocado · option = option / opción · step = étape / paso.
Estados asistencia: FR P/A/E/R, ES P/A/J/T. Tiros: LF/TL, "2 pts"/T2, "3 pts"/T3.

## Cómo funciona (por si lo tocas)
- El código sigue en inglés. `i18n.js` traduce al vuelo con los diccionarios
  `i18n-fr.js` / `i18n-es.js` (**generados**, no editar a mano).
- Los textos viven en `i18n_src/` (`EN ||| FR ||| ES` por línea o
  diccionarios `.py`). Para añadir o corregir: edita ahí y ejecuta
  `python3 tools/build_i18n.py .` desde la raíz del proyecto (avisa de conflictos o `{huecos}` mal). Si
  cambias diccionarios, sube `VERSION` en `i18n.js` (y el `?v=` de los enlaces).
- Depurar: `?i18n_debug=1` en la URL y mira la consola (textos sin traducir).
- Textos compuestos en código usan `_t("English {x}", {x})`; zonas con datos
  de usuario llevan `data-i18n-skip`.
- `tools/check_static.py <carpeta>` revisa etiquetas, IDs duplicados y sintaxis
  JS de todas las páginas. `tools/tests/` guarda los scripts de prueba que usé
  (necesitan Playwright; son solo para mí/futuras revisiones).

## Limitaciones conocidas
- Al cambiar de idioma la página se recarga (se pierde lo no guardado).
- Nombres de usuario, equipos y textos libres se muestran tal cual.
- Páginas legales solo en inglés (a propósito); el texto del cuadro "He leído
  y acepto…" en el registro sí está traducido, pero enlaza al documento en inglés.

## Preguntas abiertas de antes
- ¿El "10 min" escrito en el texto libre de un entrenamiento debe sumarse al
  total de minutos?
- Porcentaje de asistencia: ¿qué denominador y cómo cuenta "Excused"?

## Entregado
Respecto a la entrega 49 cambian solo: `assessment, attendance, play_design, roster`, `i18n.js`, `i18n-fr.js`, `i18n-es.js`, `i18n_src/` y `tools/crawl/` (nuevo). Si copias todo, tienes todas las páginas (`assessment, attendance, compare, dashboard,
exercises, help, index, library, login, match, module, play_design,
play_library, roster, settings, stats, training`), `i18n.js`, `i18n-fr.js`,
`i18n-es.js`, `org-switcher.js`, `team-tree.js`, y las carpetas `i18n_src/` y
`tools/` (solo fuentes). Copia todo a la raíz del proyecto (menos
`i18n_src/` y `tools/`).
