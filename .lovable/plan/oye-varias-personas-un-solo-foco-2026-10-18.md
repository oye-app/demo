# OYE · Varias personas, un solo foco

## Resultado
Implementar el documento adjunto sobre la app actual: primero elegir a la persona y, después, ver únicamente su resumen, llamadas, historial y ficha. Cambiar de persona no cambia la cuenta ni concede permisos.

## 1. Identidad y acceso seguro
- Dar a cada persona un identificador estable y asociar llamadas, memoria, agenda y programación a ese identificador.
- Incorporar relaciones familiares pendientes o aprobadas. Solo una aprobación administrativa concede acceso; añadir un nombre nunca permite ver datos ajenos.
- Conservar registros existentes. Vincular solo coincidencias inequívocas; dejar homónimos y casos dudosos para revisión administrativa.
- Sustituir el acceso comunitario a datos privados por permisos comprobados. Separar oportunidades mínimas para voluntariado de contactos, medicación y detalles de llamadas.
- Mantener administración y coordinación como autorizaciones verificadas, independientes del perfil elegido.

## 2. Inicio: elegir a quién acompañar
- **Familia:** “Mis personas”, filas con nombre, vínculo, estado breve y flecha; “Añadir persona” abre una solicitud pendiente que se revisa en Administración.
- **Voluntariado:** “Avisos para ti” y “Mis visitas”; visita activa primero, oportunidades ordenadas por prioridad y espera.
- Mostrar el selector incluso cuando haya una sola persona. Resolver estados sin personas, solicitudes pendientes y errores.
- Mantener el inicio sin desplazamiento de página; las listas largas se desplazan dentro de su espacio, sin ocultar personas.

## 3. Foco exclusivo
- Encabezado con nombre y “Cambiar persona” en las pantallas personales.
- Conservar la persona mediante enlaces identificables y consultas específicas al pasar por resumen, llamadas, historial y ficha, recargar o volver atrás.
- Evitar mostrar datos anteriores durante un cambio. Si se revoca el acceso, regresar al selector y limpiar los datos privados de esa selección.
- En la ficha, confirmar guardar, descartar o continuar cuando existan cambios sin guardar.

## 4. Flujos por perfil
- **Familia:** resumen compacto, bienestar estimado solo con información suficiente, llamada y ficha; historial exclusivo con fecha, resultado y duración disponible.
- **Llamadas:** activación y programación de la persona seleccionada, sin chat; identificar claramente la simulación y no presentar minutos estimados como telefonía real.
- **Ficha:** agenda y contacto con llave con validación de teléfono, errores y confirmación de guardado; soledad derivada del análisis, no cuestionario ni diagnóstico.
- **Voluntariado:** elegir un aviso no lo acepta. Conservar “Voy yo → He llegado → Visita hecha” y liberación, con una sola visita activa incluso ante solicitudes simultáneas.
- **ONG:** conservar coordinación global y permitir abrir el detalle de una persona con vuelta al panel.
- Ajustar navegación: familia “Llamadas”; voluntariado “Mis visitas”, mostrando visitas realmente propias.

## 5. Actualizaciones y límites reales
- Actualizar familia y coordinación cuando cambie una visita.
- Considerar todas las relaciones familiares autorizadas al notificar, sin cambiar automáticamente la persona seleccionada.
- No afirmar entrega de avisos por un indicador interno ni prometer avisos con la app cerrada mientras no exista ese servicio.

## Validación
- Añadir y ejecutar pruebas de identidad, permisos, solicitudes pendientes, bienestar sin datos y exclusividad de visita.
- Recorrer con sesiones reales selección familiar, llamada/programación, historial y ficha; comprobar cambio entre dos personas y homónimos.
- Recorrer aceptación, llegada y finalización, comprobando su lectura desde familia y coordinación.
- Probar enlaces ajenos, cambio de perfil a ONG, revocación y carga cruzada; no considerar suficiente ocultar datos en pantalla.
- Revisar 440 × 807, 360 × 740, escritorio y texto ampliado; permitir desplazamiento accesible cuando sea necesario.
- Informar qué recorridos y controles quedaron verificados y cualquier limitación pendiente, sin afirmar validaciones no realizadas.

## Detalles técnicos
- Cambios de estructura aditivos mediante Lovable Cloud, con permisos y políticas en la misma migración; mantener compatibilidad con los nombres durante la transición.
- Un único contexto por identificador en las pantallas protegidas, claves de caché específicas y consultas autorizadas paginadas; lectura explícita de la visita activa.
- Reutilizar los componentes, colores y tipografía actuales. Actualizar documentación de arquitectura y lista de tareas junto con las pruebas.