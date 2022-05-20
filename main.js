// ==UserScript==
// @name     Mostrar UTF-8 en Foros
// @version  1
// @match    https://campusvirtual.isiic.edu.ar/foros.cgi*
// @grant    GM_xmlhttpRequest
// @run-at   document-start
// ==/UserScript==

/*
   Script para poder ver UTF-8 en el sitio de un instituto educativo para el que trabajo que enseña chino mandarín.
   Las paginas del foro vienen en iso8859-1 (Latin1), y eso impide leer textos en chino.

   Este script es un simple parche y no una solución completa. La solución real sería pasar la base de datos del sistema de foros a UTF-8.

   Usar complementos como Set Character Encoding de Chrome no funciona porque el software del foro escapea los caracteres
   Unicode multi-byte con HTML entities antes de enviarlos, con lo cual ya llegan rotos.

   Este script aprovecha que el servidor del foro envía las intervenciones de los foros escapeadas y la original sin escapear.
   Entonces lo que hace el script es pisar la versión escapeada con la original (funcion changeItem).

   Ventajas:
   - Se puede leer chino tradicional y simplificado
   
   Desventajas:
   - Los acentos y eñes del texto original en Latin1 se rompen.
     Resolver eso en el script implica meterse de lleno en los pormenores de Unicode, y no tengo mucho interés en eso por ahora.
     Además es mucho más fácil un texto en español sin letras con tilde, que leer un texto en chino sin ningún caracter chino. 
   - Sólo funciona en Firefox, porque usa el evento beforescriptexecute, que no existe en otros navegadores. Esto es necesario para modificar
     el Javascript de la página antes de que ejecute.

   Lo que no probé aún:
   - Participar de los foros con este script activo. Al cambiar el contenido de las intervenciones, el servidor podría contar con que se cumplan
     ciertas condiciones que este script modifica, y eso podría traer problemas.

   Modo de uso
   1. En Firefox, instalar los complementos "Override Text Encoding" y "Greasemonkey"
   2. En GreaseMonkey pulsar "New user script", copiar este archivo completo, y pegarlo en el editor de texto que va a aparecer. 
   3. Salvar con el ícono de diskette que figura arriba a la izquierda, y cerrar la ventana de Greasemonkey. 
   4. Cargar una página de discusión del foro que contenga chino (no listas de discusiones por el momento).
   5. En el complemento Override Text Encoding, seleccionar "Override for page", y en el menú elegir UTF-8.
      Se recarga la página automáticamente, con el texto en chino legible y todos los caracteres latinos extendidos rotos.
*/

(function() {
    function changeSubject(subject) {
        subject.tema.descripcion = subject.tema.descripcion_editable;
        return subject
    }
  
    function changeItem(item) {
        item.descripcion = item.descripcion_editable;
        item.contenido = item.contenido_editable;
        item.childs = item.childs.map((child) => changeItem(child))
        return item
    }

  	window.addEventListener('beforescriptexecute', function(e) {
      // Buscamos <scripts> locales a la pagina, no pueden tener atributo src.
      // Tampoco procesamos scripts que no tengan la linea de los items
      if (e.target.src || !e.target.innerHTML.match(/\s*items\s*:\s*\[/)) {
        return;
  	  }

      var originalSourceCode = e.target.innerHTML;

      // Cambiamos las intervenciones
      var itemsRegex = /\n\s*items\s*:\s*(\[.+),[\n$]/
      var originalItemsLine = itemsRegex.exec(originalSourceCode)[1]
      var originalItems = JSON.parse(originalItemsLine)

      var newItems = originalItems.map((item) => changeItem(item))
      var newItemsLine = JSON.stringify(newItems)

      // Cambiamos el tema propiamente dicho
      var subjectRegex = /var tema_render[^(]+\((.+)\);[\n$]/
      var originalSubjectLine = subjectRegex.exec(originalSourceCode)[1]
      var originalSubject = JSON.parse(originalSubjectLine)
      
      var newSubject = changeSubject(originalSubject)
      var newSubjectLine = JSON.stringify(newSubject)
      
      // Reemplazamos los viejos items con los nuevos
      e.target.innerHTML = originalSourceCode.replace(originalItemsLine, newItemsLine)
                                             .replace(originalSubjectLine, newSubjectLine)

    });
  
})();


