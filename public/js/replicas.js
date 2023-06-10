

window.onload = function() {
    const replicasList = document.getElementById('replicas');
    const btCargarMas = document.getElementById('bt-cargar-mas');
    const nameFilterContainer = document.getElementById('filtro-nombre');
    const storesFilterContainer = document.getElementById('contenidoTiendas');
    const brandFilterContainer = document.getElementById('contenidoFabricantes');
    const categoryFilterContainer = document.getElementById('contenidoCategorias');
    const statusFilterContainer = document.getElementById('contenidoEstado');
    const priceFilterContainer = document.getElementById('contenidoPrecios');
    const orderFilterContainer = document.getElementById('contenidoOrdenar');
    let replicasArray = [];
    let loadedCount = 0;

    fetch('/api/replicas')
    .then(response => response.json())
    .then(replicas => {
        replicasArray = replicas;
        createFilters(replicasArray);
        loadReplicas(true);
    })
    .catch(error => console.log('Error:', error));

    function createFilters(replicas) {
        const storeSet = new Set(replicas.map(replica => replica.tienda));
        const brandSet = new Set(replicas.map(replica => replica.marca));
        const categorySet = new Set(replicas.map(replica => replica.categoria));
        const statusSet = new Set(replicas.map(replica => replica.estado));
    
        const searchInput = document.createElement('input');
        searchInput.type = "text";
        searchInput.id = "searchInput";
        searchInput.placeholder = "Buscar por Nombre";
        searchInput.addEventListener('input', () => loadReplicas(true));

        nameFilterContainer.appendChild(searchInput);

        let brandArray = Array.from(brandSet);
        brandArray.sort();

        createCheckboxes(storeSet, storesFilterContainer);
        createCheckboxes(brandArray, brandFilterContainer); // Pasamos el Array ordenado
        createCheckboxes(categorySet, categoryFilterContainer);
        createCheckboxes(statusSet, statusFilterContainer);

        createPriceInputs(priceFilterContainer);

        const orderOptions = ["Precio: Más Barato Primero", "Precio: Más Caro Primero", "Nombre: De A a Z", "Nombre: De Z a A"];
        createOrderOptions(orderOptions, orderFilterContainer);
    }

    function createCheckboxes(set, container) {
        set.forEach(value => {
            const checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.id = value;
            checkbox.name = value;

            const label = document.createElement('label');
            label.htmlFor = value;
            label.appendChild(document.createTextNode(value));

            checkbox.addEventListener('change', () => loadReplicas(true));

            container.appendChild(checkbox);
            container.appendChild(label);
        });
    }

    function createPriceInputs(container) {
        const priceArray = replicasArray.map(replica => replica.precio);
        const maxPrice = Math.max(...priceArray);
    
        const minPriceLabel = document.createElement('label');
        const minPriceInput = document.createElement('input');
        minPriceInput.type = "number";
        minPriceInput.id = "minPrice";
        minPriceInput.min = "0";
        minPriceInput.placeholder = "0";
        minPriceInput.addEventListener('change', () => {
            if (minPriceInput.value === '') {
                minPriceInput.value = '';
            }
            minPriceInput.value != "" ? minPriceLabel.classList.add('changed') : minPriceLabel.classList.remove('changed');
            loadReplicas(true);
        });
        minPriceLabel.appendChild(document.createTextNode("Precio mínimo: "));
        minPriceLabel.appendChild(minPriceInput);
        container.appendChild(minPriceLabel);
        container.appendChild(document.createElement('br'));
    
        const maxPriceLabel = document.createElement('label');
        const maxPriceInput = document.createElement('input');
        maxPriceInput.type = "number";
        maxPriceInput.id = "maxPrice";
        maxPriceInput.min = "0";
        maxPriceInput.placeholder = maxPrice.toString();
        maxPriceInput.addEventListener('change', () => {
            if (maxPriceInput.value === '') {
                maxPriceInput.value = '';
            }
            maxPriceInput.value != "" ? maxPriceLabel.classList.add('changed') : maxPriceLabel.classList.remove('changed');
            loadReplicas(true);
        });
        maxPriceLabel.appendChild(document.createTextNode("Precio máximo: "));
        maxPriceLabel.appendChild(maxPriceInput);
        container.appendChild(maxPriceLabel);
    }
    
    function createOrderOptions(options, container) {
        options.forEach((value, index) => {
            const radio = document.createElement('input');
            radio.type = "radio";
            radio.id = `orderOption${index}`;
            radio.name = "orderOption";
            radio.value = value;
            radio.addEventListener('change', () => loadReplicas(true));

            const label = document.createElement('label');
            label.htmlFor = `orderOption${index}`;
            label.appendChild(document.createTextNode(value));

            if (index === 0) radio.checked = true;

            container.appendChild(radio);
            container.appendChild(label);
        });
    }

    function matchesFilters(replica) {
        const searchName = document.getElementById('searchInput').value;
        if (searchName && !replica.nombre.toLowerCase().includes(searchName.toLowerCase())) {
            return false;
        }

        if (!matchesCheckboxFilter(replica.tienda, storesFilterContainer)
            || !matchesCheckboxFilter(replica.marca, brandFilterContainer)
            || !matchesCheckboxFilter(replica.categoria, categoryFilterContainer)
            || !matchesCheckboxFilter(replica.estado, statusFilterContainer)) {
            return false;
        }

        const minPrice = parseFloat(document.getElementById('minPrice').value);
        const maxPrice = parseFloat(document.getElementById('maxPrice').value);
        if (replica.precio < minPrice || replica.precio > maxPrice) {
            return false;
        }

        return true;
    }

    function matchesCheckboxFilter(value, container) {
        const checkbox = document.getElementById(value);
        if (Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).length > 0 && checkbox && !checkbox.checked) {
            return false;
        }
        return true;
    }

    function loadReplicas(reset = false) {
        if (reset) {
            replicasList.innerHTML = '';
            loadedCount = 0;
        }

        let filteredReplicas = replicasArray.filter(replica => matchesFilters(replica));

        const orderOption = document.querySelector('input[name="orderOption"]:checked').value;
        switch (orderOption) {
            case "Precio: Más Barato Primero":
                filteredReplicas.sort((a, b) => a.precio - b.precio);
                break;
            case "Precio: Más Caro Primero":
                filteredReplicas.sort((a, b) => b.precio - a.precio);
                break;
            case "Nombre: De A a Z":
                filteredReplicas.sort((a, b) => a.nombre.localeCompare(b.nombre));
                break;
            case "Nombre: De Z a A":
                filteredReplicas.sort((a, b) => b.nombre.localeCompare(a.nombre));
                break;
        }

        document.getElementById('contador').textContent = `Localizadas ${filteredReplicas.length} Réplicas`;

        const loadCount = 20;
        const startIndex = loadedCount;
        const endIndex = Math.min(startIndex + loadCount, filteredReplicas.length);

        for (let i = startIndex; i < endIndex; i++) {
            const replica = filteredReplicas[i];
            loadReplica(replica);
        }

        loadedCount += loadCount;
        if (loadedCount < filteredReplicas.length) {
            btCargarMas.style.display = 'block';
        } else {
            btCargarMas.style.display = 'none';
        }
    }

    function loadReplica(replica) {
        let listItem = document.createElement('li');
        let card = document.createElement('a');
        card.className = 'tarjeta';
        card.href = replica.enlace;
        card.target = '_blank';

        let name = document.createElement('h4');
        name.textContent = replica.nombre;
        name.className = 'nombre';

        let brand = document.createElement('p');
        brand.textContent = replica.marca;
        brand.className = 'marca';

        let price = document.createElement('p');
        price.textContent = replica.precio.toFixed(2).replace('.', ',') + ' €';
        price.className = 'precio';

        let imageDiv = document.createElement('div');
        imageDiv.className = 'imagen-div';

        let image = document.createElement('img');
        image.src = replica.imagen;
        image.alt = replica.nombre;
        image.className = 'imagen';

        imageDiv.appendChild(image);

        let store = document.createElement('p');
        store.textContent = replica.tienda;
        store.className = 'tienda';

        card.appendChild(name);
        card.appendChild(brand);
        card.appendChild(price);
        card.appendChild(store);
        card.appendChild(imageDiv);

        listItem.appendChild(card);
        replicasList.appendChild(listItem);
    }

    btCargarMas.addEventListener('click', () => loadReplicas());
};
















//----------BARRA DESPLEGABLE FILTROS

// Seleccionamos los botones y los contenidos
var botones = document.querySelectorAll('.barra button');
var contenidos = document.querySelectorAll('.contenido-escondido');

// Mantenemos un registro del botón presionado por última vez y si .escondido está desplegado o no
var ultimoBotonPresionado = null;
var escondidoDesplegado = false;
var bloqueoTransicion = false;  // Bloqueo para evitar acciones durante la transición

// Añadimos un evento de click a cada botón
botones.forEach(function(boton) {
    boton.addEventListener('click', function() {
        if (bloqueoTransicion) return; // Ignora clics durante la transición

        // Obtenemos la sección
        var seccion = document.querySelector('section.cajaDesplegable');

        bloqueoTransicion = true;
        setTimeout(function() { bloqueoTransicion = false; }, 600); // Desbloquea después de la transición completa (arriba y abajo)

        // Si .escondido está desplegado y se presiona un botón diferente, cambiamos el contenido
        if (escondidoDesplegado && boton !== ultimoBotonPresionado) {
            contenidos.forEach(function(contenido) {
                contenido.style.top = '-100px';  // Mueve el contenido hacia arriba
            });

            setTimeout(function() {
                contenidos.forEach(function(contenido) {
                    contenido.style.display = 'none';  // Después de mover el contenido hacia arriba, lo escondemos
                });
                var contenidoSeleccionado = document.querySelector('#contenido' + boton.id.replace('boton', ''));
                contenidoSeleccionado.style.display = 'flex';
                // Esperamos un poco antes de bajar .escondido con el nuevo contenido
                setTimeout(function() {
                    contenidoSeleccionado.style.top = '0px';  // Mueve el nuevo contenido hacia abajo
                }, 300);
            }, 300);
            ultimoBotonPresionado.classList.remove("seleccionado"); // Quita la clase "seleccionado" del último botón presionado
            boton.classList.add("seleccionado");  // Agrega la clase "seleccionado" al nuevo botón presionado
        } else if (!escondidoDesplegado || boton !== ultimoBotonPresionado) {
            // Muestra el contenido y expande si .escondido está plegado o se presionó un botón diferente
            var contenidoSeleccionado = document.querySelector('#contenido' + boton.id.replace('boton', ''));
            contenidoSeleccionado.style.display = 'flex';
            setTimeout(function() { // Necesitamos un pequeño retraso aquí para que la transición funcione correctamente
                contenidoSeleccionado.style.top = '0px';
            }, 20);
            seccion.style.height = '200px';
            escondidoDesplegado = true;
            boton.classList.add("seleccionado");  // Agrega la clase "seleccionado" al botón
        } else {
            // Pliega si .escondido está desplegado y se presionó el mismo botón
            var contenidoSeleccionado = document.querySelector('#contenido' + boton.id.replace('boton', ''));
            contenidoSeleccionado.style.top = '-100px';
            seccion.style.height = '100px';
            escondidoDesplegado = false;
            setTimeout(function() {
                contenidoSeleccionado.style.display = 'none';
                boton.classList.remove("seleccionado");  // Quita la clase "seleccionado" del botón
            }, 300);
        }

        // Actualizamos el último botón presionado
        ultimoBotonPresionado = boton;
    });
});































