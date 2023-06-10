
// QUITAR PLACEHOLDERS DE LOS INPUTS CUANDO FOCUS
window.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input, textarea');
  
    inputs.forEach((input) => {
      input.addEventListener('focus', function() {
        this.setAttribute('data-placeholder', this.getAttribute('placeholder'));
        this.setAttribute('placeholder', '');
      });
  
      input.addEventListener('blur', function() {
        this.setAttribute('placeholder', this.getAttribute('data-placeholder'));
        this.removeAttribute('data-placeholder');
      });
    });
  
    const checkAndAddEventListeners = function() {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('focus', function() {
          this.setAttribute('data-placeholder', this.getAttribute('placeholder'));
          this.setAttribute('placeholder', '');
        });
  
        searchInput.addEventListener('blur', function() {
          this.setAttribute('placeholder', this.getAttribute('data-placeholder'));
          this.removeAttribute('data-placeholder');
        });
      } else {
        setTimeout(checkAndAddEventListeners, 100); // Verificar de nuevo en 100 ms
      }
    };
  
    checkAndAddEventListeners();
  });
  

  





