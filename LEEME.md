# Entrega 51 — respuestas de Dani (minutos, Excused, idioma de PDF, Coach/OT)

## Primero: qué va a GitHub
**No subas `i18n_src/` ni `tools/`.** Son material de trabajo (fuentes de las
traducciones y scripts de prueba); la web no los usa. Guárdalos en tu copia de
seguridad. A GitHub solo van las páginas `.html`, `i18n.js`, `i18n-fr.js`,
`i18n-es.js`, los demás `.js` y la carpeta `database/` si la tienes ahí.

## Orden de instalación (¡importante!)
1. **Supabase → SQL editor:** correr `database/step92_attendance_coach_ot_status.sql`
   (se puede correr más de una vez). Hace falta ANTES de subir las páginas: la
   tabla `attendance` tenía un CHECK que solo aceptaba present/absent/excused/late.
2. Subir las páginas nuevas: `attendance, match, training, stats, compare,
   exercises, library, settings` + `i18n-fr.js` + `i18n-es.js`.

## 1. Minutos escritos en texto libre (Training builder)
Si en una fila de texto libre escribes "Team talk 10 min", "Calentamiento 10 min +
estiramientos 5 min" o "2'", esos minutos se **suman** y pasan a la casilla de
minutos de la fila (y por tanto al total de la sesión, al guardado y al PDF).
Reconoce `min`, `mins`, `minute(s)`, `minuto(s)`, `mn` y `'`. "25 m" (metros) NO
cuenta. Si tú cambias la casilla de minutos a mano, mandan tus minutos y el
texto ya no la recalcula. Las sesiones ya guardadas no se tocan.

## 2. Excused cuenta como ausente
Ya era así en Stats (% de asistencia: solo Present y Late suman) y en Compare
(solo Present suma). No hay cambio; Excused sí cuenta en el denominador.

## 3. PDF según el idioma de la pantalla
Los PDF de Exercises, Library y Training (hoja de ejercicio) ahora salen en el
idioma elegido arriba a la derecha (EN/FR/ES), igual que los demás. Por eso la
tarjeta de Settings antes llamada "Export language" pasó a llamarse
**"Default exercise language"** y solo decide qué idioma de ejercicios muestran
primero las listas (el texto de ayuda y los mensajes están actualizados).

## 4. Nuevos estados: Coach y OT (oficial de mesa)
Disponibles en **Attendance, Match day y Training builder** (mismo registro en
los tres). El ciclo del botón es ahora:
`— → Present → Absent → Excused → Late → Coach (C) → Table official (OT) → —`
- **Entrenos y eventos:** cuentan como **presente** (Stats % y resumen de
  asistencia de Compare; en el PDF del entreno salen como presentes).
- **Partidos:** **no cuentan**: ni suman asistencia ni bajan el %. En Stats, ese
  partido se quita de la cuenta de esa persona (si estuvo de coach en 1 de 5
  partidos, su % de partidos es sobre 4).
- Importar un Excel de partido ("marcar Present a quien esté en el archivo y
  Absent al resto") **no pisa** a quien esté marcado Coach/OT.
- Colores: azul (Coach) y violeta (OT); leyendas y PDF/Excel de Attendance
  incluyen los estados nuevos; traducidos a FR/ES (Entraîneur / Officiel de table;
  Entrenador / Oficial de mesa).
- Interpretación mía: dos estados separados (Coach y OT) en vez de uno. Si
  prefieres uno solo ("Staff"), es un cambio pequeño.

## Cómo lo comprobé
- Ciclo completo en Attendance en EN/FR/ES: escribe present→absent→excused→late→
  coach→ot→(borra)→present; BD idéntica en los tres idiomas.
- Cálculo de Stats con casos de coach/OT en partido, entreno y evento.
- Import de partido con un coach marcado: no se modifica su fila.
- Minutos del texto libre: 7 casos (suma, "2'", sin minutos, manual manda, "25 m").
- PDF de Exercises (FR) y Library (ES) con etiquetas en el idioma de pantalla.
- Rastreador (clic en todo) en 8 páginas × EN/FR/ES × 2 pasadas: mismas acciones,
  mismas escrituras y 0 errores JS en los tres idiomas; batería de tests por
  módulo sin errores; 22 HTML + JS sin etiquetas desbalanceadas ni IDs duplicados.
- Diccionario: 1.961 entradas, sin conflictos.

## Pendiente
- Denominador del % de asistencia (Stats): hoy = sesiones donde se pasó lista.
