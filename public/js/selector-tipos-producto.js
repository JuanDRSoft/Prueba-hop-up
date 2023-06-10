
// NO DISPONIBLE EN TIPOS DE PRODUCTO
// Obtener todos los elementos con la clase "producto"
const productos = document.querySelectorAll('.tipo-productos .producto');

// Objeto para almacenar el número de clics por producto
const contadorClics = {};

// Iterar sobre cada elemento y agregar un evento de clic
productos.forEach(producto => {
  contadorClics[producto.classList] = 0;
  const h3 = producto.querySelector('h3');
  const textoOriginal = h3.textContent;

  producto.addEventListener('click', () => {
    // Verificar si el producto actual no es el de "replicas"
    if (!producto.classList.contains('replicas')) {
      // Incrementar el contador de clics para el producto actual
      contadorClics[producto.classList]++;

      // Obtener el número de clics para el producto actual
      const clics = contadorClics[producto.classList];

      // Determinar el texto según el número de clics
      let texto;
      if (clics === 1) {
        texto = '¡PRÓXIMAMENTE!';
      } else {
        texto = textoOriginal;
        contadorClics[producto.classList] = 0;
      }

      // Cambiar el texto del h3
      h3.textContent = texto;
    }
  });
});


