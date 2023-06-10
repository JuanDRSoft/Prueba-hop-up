window.addEventListener("DOMContentLoaded", (event) => {
  var escondido = document.querySelector('.escondido');
  var cajaDesplegable = document.querySelector('.cajaDesplegable');
  var bloqueoTransicion = false; // Bloqueo para evitar acciones durante la transición

  // Aseguramos que inicialmente escondido esté oculto
  escondido.style.top = '-100px';
  cajaDesplegable.style.height = '100px'; // Aseguramos que inicialmente .cajaDesplegable tenga altura de 100px

  // Después de 2 segundos desde la carga de la página, bajamos escondido
  setTimeout(function() {
      escondido.style.top = '0px';
      cajaDesplegable.style.height = '200px'; // Ajusta la altura de .cajaDesplegable
  }, 1000);

  // Añadimos un evento de click a escondido
  escondido.addEventListener('click', function() {
      if (bloqueoTransicion) return; // Ignora clics durante la transición

      bloqueoTransicion = true;
      setTimeout(function() { bloqueoTransicion = false; }, 600); // Desbloquea después de la transición completa

      if (escondido.style.top == '0px') {
          // Si escondido está desplegado, lo plegamos
          escondido.style.top = '-100px';
          cajaDesplegable.style.height = '100px'; // Ajusta la altura de .cajaDesplegable
      } else {
          // Si escondido está plegado, lo desplegamos
          escondido.style.top = '0px';
          cajaDesplegable.style.height = '200px'; // Ajusta la altura de .cajaDesplegable
      }
  });
});


  
