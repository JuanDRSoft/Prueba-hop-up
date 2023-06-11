//scraper.js
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const { ObjectId } = require("mongodb");
const { getCollection } = require("./basedatos");
const nodemailer = require("nodemailer");

require("dotenv").config(); // Esto es para poder sacar datos y contraseñas del archivo .env

async function checkReplicas() {
  const tiendasCollection = await getCollection("tienda");
  const replicasCollection = await getCollection("replica");

  const tiendas = await tiendasCollection.find().toArray();
  let algunaCategoriaVacia = false;
  let tiendasConCategoriasVacias = {};

  const categorias = [
    "Ametralladora",
    "Pistola",
    "Fusil / Subfusil",
    "Rifle",
    "Escopeta",
  ];

  for (let tienda of tiendas) {
    for (let categoria of categorias) {
      const count = await replicasCollection.countDocuments({
        tienda: tienda.nombre,
        categoria: categoria,
      });

      if (count === 0) {
        algunaCategoriaVacia = true;

        if (!tiendasConCategoriasVacias[tienda.nombre]) {
          tiendasConCategoriasVacias[tienda.nombre] = [];
        }
        tiendasConCategoriasVacias[tienda.nombre].push(categoria);
      }
    }
  }

  if (algunaCategoriaVacia) {
    try {
      await sendEmail(tiendasConCategoriasVacias);
    } catch (error) {
      console.error(`Error al enviar correo: ${error}`);
    }
  } else {
    console.log(
      "No se envía Email: Todas las categorías en todas las tiendas tienen réplicas."
    );
  }
}

async function sendEmail(tiendasConCategoriasVacias) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let textoEmail = "";
  for (let tienda in tiendasConCategoriasVacias) {
    textoEmail += `La tienda ${tienda} no tiene réplicas en las siguientes categorías: ${tiendasConCategoriasVacias[
      tienda
    ].join(", ")}. \n`;
  }

  let mailOptions = {
    from: "probandocjcjapp2@gmail.com",
    to: "raulcrivera97@gmail.com",
    subject: `HOP UP - No hay réplicas en algunas categorías de ciertas tiendas`,
    text: textoEmail,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email con categorías vacías enviado: " + info.response);
  } catch (error) {
    console.error(`Error al enviar el correo con categorías vacías: ${error}`);
  }
}

// FALTA EL PAGO DE LA API DE CHATGPT

// const { Configuration, OpenAIApi } = require('openai');

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);

// async function crearCompletado() {
//     const completion = await openai.createCompletion({
//       model: "text-davinci-004",
//       prompt: "Mejora el texto y ponlo entre exclamaciones",
//     });
//     console.log(completion.data.choices[0].text);
// }

// crearCompletado();

// BORRAR TODAS LAS REPLICAS
async function borrarReplicas() {
  const replicasCollection = await getCollection("replica");
  await replicasCollection.deleteMany({});
}

// MAD TACTICAL

// FUSILES Y SUBFUSILES MAD TACTICAL
// async function scrapeMadTacticalFusilesSubfusiles(url, tiendaNombre) {
//     const browser = await puppeteer.launch({headless: false});

//     let newProductIds = [];

//     const page = await browser.newPage();
//     await page.goto(url);

//     const tiendasCollection = await getCollection('tienda');
//     const tienda = await tiendasCollection.findOne({ nombre: tiendaNombre });

//     if (!tienda) {
//         console.log(`Tienda ${tiendaNombre} no encontrada. Asegúrate de que está en la base de datos.`);
//         return;
//     }

//     const replicasCollection = await getCollection('replica');

//     const marcaCheckboxLength = await page.$$eval('#ul_layered_manufacturer_0 li input[type="checkbox"]', elements => elements.length);

//     for (let i = 0; i < marcaCheckboxLength; i++) {
//         await page.evaluate((i) => {
//             const checkbox = document.querySelectorAll('#ul_layered_manufacturer_0 li input[type="checkbox"]')[i];
//             checkbox.click();
//         }, i);

//         await page.waitForNavigation({waitUntil: 'networkidle0'});

//         const marca = await page.$eval(`#ul_layered_manufacturer_0 li:nth-of-type(${i + 1}) label a`, a => a.textContent.trim().replace(/\s*\(\d+\)$/, ''));

//         let hasNextPage = true;
//         while(hasNextPage) {
//             let productos = await page.$$eval('.ajax_block_product', productos => productos.map(producto => {
//                 const nombre = producto.querySelector('h5 a').textContent.trim();
//                 const precio = parseFloat(producto.querySelector('.price').textContent.trim().replace('€', '').replace(',', '.'));
//                 const enlace = producto.querySelector('.product_img_link').getAttribute('href');
//                 const descripcion = producto.querySelector('.product-desc').textContent.trim();
//                 const imagen = producto.querySelector('.product_img_link img').getAttribute('src');
//                 const categoria = "Fusil / Subfusil";

//                 const disponibilidad = producto.querySelector('.availability span.out-of-stock') ? 0 : 1;

//                 return {
//                     nombre,
//                     precio,
//                     enlace,
//                     descripcion,
//                     imagen,
//                     categoria,
//                     disponibilidad
//                 }
//             }));

//             for (let producto of productos) {
//                 const existingProducto = await replicasCollection.findOne({ enlace: producto.enlace });

//                 if (producto.disponibilidad === 1 && !existingProducto) {
//                     const result = await replicasCollection.insertOne({
//                         nombre: producto.nombre,
//                         marca: marca,
//                         precio: producto.precio,
//                         enlace: producto.enlace,
//                         categoria: producto.categoria,
//                         tienda: tiendaNombre,
//                         descripcion: producto.descripcion,
//                         imagen: producto.imagen
//                     });
//                     console.log(`Producto añadido: ${producto.nombre}`);
//                     newProductIds.push(result.insertedId);
//                 } else if (existingProducto) {
//                     newProductIds.push(existingProducto._id);
//                 }
//             }

//             try {
//                 await Promise.all([
//                     page.waitForNavigation(),
//                     page.click('#pagination_next_bottom a')
//                 ]);
//             } catch (error) {
//                 hasNextPage = false;
//             }
//         }

//         await page.evaluate((i) => {
//             const checkbox = document.querySelectorAll('#ul_layered_manufacturer_0 li input[type="checkbox"]')[i];
//             checkbox.click();
//         }, i);

//         await page.waitForNavigation({waitUntil: 'networkidle0'});
//     }

//     await replicasCollection.deleteMany({
//         categoria: "Fusil / Subfusil",
//         tienda: tiendaNombre,
//         _id: { $nin: newProductIds }
//     });
//     console.log(`Productos antiguos de la categoría "Fusil / Subfusil" y de la tienda "${tiendaNombre}" eliminados de la base de datos.`);

//     await browser.close();
// }
// ESCOPETAS MAD TACTICAL
// async function scrapeMadTacticalEscopetas(url, tiendaNombre) {
//     const browser = await puppeteer.launch({headless: false});

//     let newProductIds = [];

//     const page = await browser.newPage();
//     await page.goto(url);

//     const tiendasCollection = await getCollection('tienda');
//     const tienda = await tiendasCollection.findOne({ nombre: tiendaNombre });

//     if (!tienda) {
//         console.log(`Tienda ${tiendaNombre} no encontrada. Asegúrate de que está en la base de datos.`);
//         return;
//     }

//     const replicasCollection = await getCollection('replica');

//     const marcaCheckboxLength = await page.$$eval('#ul_layered_manufacturer_0 li input[type="checkbox"]', elements => elements.length);

//     for (let i = 0; i < marcaCheckboxLength; i++) {
//         await page.evaluate((i) => {
//             const checkbox = document.querySelectorAll('#ul_layered_manufacturer_0 li input[type="checkbox"]')[i];
//             checkbox.click();
//         }, i);

//         await page.waitForNavigation({waitUntil: 'networkidle0'});

//         const marca = await page.$eval(`#ul_layered_manufacturer_0 li:nth-of-type(${i + 1}) label a`, a => a.textContent.trim().replace(/\s*\(\d+\)$/, ''));

//         let hasNextPage = true;
//         while(hasNextPage) {
//             let productos = await page.$$eval('.ajax_block_product', productos => productos.map(producto => {
//                 const nombre = producto.querySelector('h5 a').textContent.trim();
//                 const precio = parseFloat(producto.querySelector('.price').textContent.trim().replace('€', '').replace(',', '.'));
//                 const enlace = producto.querySelector('.product_img_link').getAttribute('href');
//                 const descripcion = producto.querySelector('.product-desc').textContent.trim();
//                 const imagen = producto.querySelector('.product_img_link img').getAttribute('src');
//                 const categoria = "Escopeta";

//                 const disponibilidad = producto.querySelector('.availability span.out-of-stock') ? 0 : 1;

//                 return {
//                     nombre,
//                     precio,
//                     enlace,
//                     descripcion,
//                     imagen,
//                     categoria,
//                     disponibilidad
//                 }
//             }));

//             for (let producto of productos) {
//                 const existingProducto = await replicasCollection.findOne({ enlace: producto.enlace });

//                 if (producto.disponibilidad === 1 && !existingProducto) {
//                     const result = await replicasCollection.insertOne({
//                         nombre: producto.nombre,
//                         marca: marca,
//                         precio: producto.precio,
//                         enlace: producto.enlace,
//                         categoria: producto.categoria,
//                         tienda: tiendaNombre,
//                         descripcion: producto.descripcion,
//                         imagen: producto.imagen
//                     });
//                     console.log(`Producto añadido: ${producto.nombre}`);
//                     newProductIds.push(result.insertedId);
//                 } else if (existingProducto) {
//                     newProductIds.push(existingProducto._id);
//                 }
//             }

//             try {
//                 await Promise.all([
//                     page.waitForNavigation(),
//                     page.click('#pagination_next_bottom a')
//                 ]);
//             } catch (error) {
//                 hasNextPage = false;
//             }
//         }

//         await page.evaluate((i) => {
//             const checkbox = document.querySelectorAll('#ul_layered_manufacturer_0 li input[type="checkbox"]')[i];
//             checkbox.click();
//         }, i);

//         await page.waitForNavigation({waitUntil: 'networkidle0'});
//     }

//     await replicasCollection.deleteMany({
//         categoria: "Escopeta",
//         tienda: tiendaNombre,
//         _id: { $nin: newProductIds }
//     });
//     console.log(`Productos antiguos de la categoría "Escopeta" y de la tienda "${tiendaNombre}" eliminados de la base de datos.`);

//     await browser.close();
// }
// PISTOLAS MAD TACTICAL
// async function scrapeMadTacticalPistolas(url, tiendaNombre) {
//     const browser = await puppeteer.launch({headless: false});

//     let newProductIds = [];

//     const page = await browser.newPage();
//     await page.goto(url);

//     const tiendasCollection = await getCollection('tienda');
//     const tienda = await tiendasCollection.findOne({ nombre: tiendaNombre });

//     if (!tienda) {
//         console.log(`Tienda ${tiendaNombre} no encontrada. Asegúrate de que está en la base de datos.`);
//         return;
//     }

//     const replicasCollection = await getCollection('replica');

//     const marcaCheckboxLength = await page.$$eval('#ul_layered_manufacturer_0 li input[type="checkbox"]', elements => elements.length);

//     for (let i = 0; i < marcaCheckboxLength; i++) {
//         await page.evaluate((i) => {
//             const checkbox = document.querySelectorAll('#ul_layered_manufacturer_0 li input[type="checkbox"]')[i];
//             checkbox.click();
//         }, i);

//         await page.waitForNavigation({waitUntil: 'networkidle0'});

//         const marca = await page.$eval(`#ul_layered_manufacturer_0 li:nth-of-type(${i + 1}) label a`, a => a.textContent.trim().replace(/\s*\(\d+\)$/, ''));

//         let hasNextPage = true;
//         while(hasNextPage) {
//             let productos = await page.$$eval('.ajax_block_product', productos => productos.map(producto => {
//                 const nombre = producto.querySelector('h5 a').textContent.trim();
//                 const precio = parseFloat(producto.querySelector('.price').textContent.trim().replace('€', '').replace(',', '.'));
//                 const enlace = producto.querySelector('.product_img_link').getAttribute('href');
//                 const descripcion = producto.querySelector('.product-desc').textContent.trim();
//                 const imagen = producto.querySelector('.product_img_link img').getAttribute('src');
//                 const categoria = "Pistola";

//                 const disponibilidad = producto.querySelector('.availability span.out-of-stock') ? 0 : 1;

//                 return {
//                     nombre,
//                     precio,
//                     enlace,
//                     descripcion,
//                     imagen,
//                     categoria,
//                     disponibilidad
//                 }
//             }));

//             for (let producto of productos) {
//                 const existingProducto = await replicasCollection.findOne({ enlace: producto.enlace });

//                 if (producto.disponibilidad === 1 && !existingProducto) {
//                     const result = await replicasCollection.insertOne({
//                         nombre: producto.nombre,
//                         marca: marca,
//                         precio: producto.precio,
//                         enlace: producto.enlace,
//                         categoria: producto.categoria,
//                         tienda: tiendaNombre,
//                         descripcion: producto.descripcion,
//                         imagen: producto.imagen
//                     });
//                     console.log(`Producto añadido: ${producto.nombre}`);
//                     newProductIds.push(result.insertedId);
//                 } else if (existingProducto) {
//                     newProductIds.push(existingProducto._id);
//                 }
//             }

//             try {
//                 await Promise.all([
//                     page.waitForNavigation(),
//                     page.click('#pagination_next_bottom a')
//                 ]);
//             } catch (error) {
//                 hasNextPage = false;
//             }
//         }

//         await page.evaluate((i) => {
//             const checkbox = document.querySelectorAll('#ul_layered_manufacturer_0 li input[type="checkbox"]')[i];
//             checkbox.click();
//         }, i);

//         await page.waitForNavigation({waitUntil: 'networkidle0'});
//     }

//     await replicasCollection.deleteMany({
//         categoria: "Pistola",
//         tienda: tiendaNombre,
//         _id: { $nin: newProductIds }
//     });
//     console.log(`Productos antiguos de la categoría "Pistola" y de la tienda "${tiendaNombre}" eliminados de la base de datos.`);

//     await browser.close();
// }
// TODAS LAS CATEGORÍAS MAD TACTICAL:
const PCR = require("puppeteer-chromium-resolver");

async function scrapeMadTactical(url, tiendaNombre, categoria, estado) {
  const options = {};
  const stats = await PCR(options);

  const browser = await stats.puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
    executablePath: stats.executablePath,
  });

  let newProductIds = [];

  const page = await browser.newPage();
  await page.goto(url, { timeout: 10000 });

  const tiendasCollection = await getCollection("tienda");
  const tienda = await tiendasCollection.findOne({ nombre: tiendaNombre });

  if (!tienda) {
    console.log(
      `Tienda ${tiendaNombre} no encontrada. Asegúrate de que está en la base de datos.`
    );
    return;
  }

  const replicasCollection = await getCollection("replica");
  const marcasCollection = await getCollection("marca");

  const marcaCheckboxLength = await page.$$eval(
    '#ul_layered_manufacturer_0 li input[type="checkbox"]',
    (elements) => elements.length
  );

  for (let i = 0; i < marcaCheckboxLength; i++) {
    await page.evaluate((i) => {
      const checkbox = document.querySelectorAll(
        '#ul_layered_manufacturer_0 li input[type="checkbox"]'
      )[i];
      checkbox.click();
    }, i);

    await page.waitForNavigation({ waitUntil: "networkidle0" });
    await page.waitForSelector(".ajax_block_product"); // Espera a que los productos se carguen

    const marcaTienda = await page.$eval(
      `#ul_layered_manufacturer_0 li:nth-of-type(${i + 1}) label a`,
      (a) => a.textContent.trim().replace(/\s*\(\d+\)$/, "")
    );
    const marcaDoc = await marcasCollection.findOne({
      [`tienda_nombres.${tiendaNombre}`]: marcaTienda,
    });
    const marca = marcaDoc ? marcaDoc.nombre : marcaTienda;

    let hasNextPage = true;
    while (hasNextPage) {
      let productos = await page.$$eval(
        ".ajax_block_product",
        (productos, categoria) =>
          productos.map((producto) => {
            const nombre = producto.querySelector("h5 a").textContent.trim();
            const precio = parseFloat(
              producto
                .querySelector(".price")
                .textContent.trim()
                .replace("€", "")
                .replace(",", ".")
            );
            const enlace = producto
              .querySelector(".product_img_link")
              .getAttribute("href");
            const descripcion = producto
              .querySelector(".product-desc")
              .textContent.trim();
            const imagen = producto
              .querySelector(".product_img_link img")
              .getAttribute("src");

            const disponibilidad = producto.querySelector(
              ".availability span.out-of-stock"
            )
              ? 0
              : 1;

            return {
              nombre,
              precio,
              enlace,
              descripcion,
              imagen,
              categoria,
              disponibilidad,
            };
          }),
        categoria
      );
      for (let producto of productos) {
        const existingProducto = await replicasCollection.findOne({
          enlace: producto.enlace,
        });

        if (producto.disponibilidad === 1 && !existingProducto) {
          const result = await replicasCollection.insertOne({
            nombre: producto.nombre,
            marca: marca,
            precio: producto.precio,
            enlace: producto.enlace,
            categoria: producto.categoria,
            tienda: tiendaNombre,
            descripcion: producto.descripcion,
            imagen: producto.imagen,
            estado: estado,
          });
          console.log(`Producto añadido: ${producto.nombre}`);
          newProductIds.push(result.insertedId);
        } else if (existingProducto) {
          newProductIds.push(existingProducto._id);
        }
      }

      let nextPageLink;
      try {
        nextPageLink = await page.$("#pagination_next_bottom a");
      } catch (error) {
        hasNextPage = false;
      }
      if (hasNextPage && nextPageLink) {
        try {
          await Promise.all([
            page.waitForNavigation({ timeout: 5000 }),
            nextPageLink.click(),
          ]);
          await page.waitForSelector(".ajax_block_product"); // Espera a que los productos se carguen
        } catch (error) {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }
    }

    await page.evaluate((i) => {
      const checkbox = document.querySelectorAll(
        '#ul_layered_manufacturer_0 li input[type="checkbox"]'
      )[i];
      checkbox.click();
    }, i);

    await page.waitForNavigation({ waitUntil: "networkidle0" });
    await page.waitForSelector(".ajax_block_product"); // Espera a que los productos se carguen
  }

  // Recupera los documentos que serán eliminados
  const replicasToDelete = await replicasCollection
    .find({
      categoria: categoria,
      tienda: tiendaNombre,
      _id: { $nin: newProductIds },
    })
    .toArray();

  // Extrae los nombres de las réplicas que serán eliminadas
  const replicaNamesToDelete = replicasToDelete.map(
    (replica) => replica.nombre
  );
  console.log(
    `----------Réplicas eliminadas: ${replicaNamesToDelete.join(", ")}`
  );

  await replicasCollection.deleteMany({
    categoria: categoria,
    tienda: tiendaNombre,
    _id: { $nin: newProductIds },
  });
  console.log(
    `----------Los productos antiguos de la categoría "${categoria}" y de la tienda "${tiendaNombre}" se han limpiado.`
  );

  await browser.close();
}

// HOBBY EXPERT
// FUSILES Y SUBFUSILES HOBBY EXPERT (Lo hago junto porque sino se borraria la lista de modificados en esa tanda, borrando los fusiles al final...)
async function scrapeHobbyExpertFusilesSubfusiles(urls, tiendaNombre, estado) {
  const options = {};
  const stats = await PCR(options);

  const browser = await stats.puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
    executablePath: stats.executablePath,
  });

  let newProductIds = [];

  const replicasCollection = await getCollection("replica");
  const tiendasCollection = await getCollection("tienda");
  const marcasCollection = await getCollection("marca");
  const tienda = await tiendasCollection.findOne({ nombre: tiendaNombre });

  if (!tienda) {
    console.log(
      `Tienda ${tiendaNombre} no encontrada. Asegúrate de que está en la base de datos.`
    );
    return;
  }

  const page = await browser.newPage();

  for (let url of urls) {
    await page.goto(url);
    let tipos = await page.$$eval("div.lvl3-category-banner", (divs) =>
      divs.map((div) => ({
        url: div.querySelector("a").href,
        tipo: div.querySelector("h2").textContent.trim(),
      }))
    );

    for (let tipo of tipos) {
      await page.goto(tipo.url);

      let hasNextPage = true;
      let visitedUrls = new Set();
      while (hasNextPage) {
        await page.waitForSelector("a.product.photo.product-item-photo");

        let productCards = await page.$$eval(".product-item-info", (cards) =>
          cards.map((card) => ({
            url: card.querySelector("a.product.photo.product-item-photo").href,
            outOfStock:
              card.querySelector(".stock span")?.textContent.trim() ===
              "No está disponible",
          }))
        );

        for (let productCard of productCards) {
          if (productCard.outOfStock) {
            console.log("Producto agotado, pasando al siguiente");
            continue;
          }

          if (visitedUrls.has(productCard.url)) {
            continue;
          }
          visitedUrls.add(productCard.url);

          const currentPage = await browser.newPage();
          await currentPage.goto(productCard.url);

          const nombre = await currentPage.$eval(
            "h1.page-title .base",
            (node) => node.textContent.trim()
          );
          const precio = parseFloat(
            await currentPage.$eval(".product-info-price .price", (node) =>
              node.textContent.trim().replace("€", "").replace(",", ".")
            )
          );
          let marcaTienda;
          try {
            marcaTienda = await currentPage.$eval(
              ".amshopby-option-link a",
              (node) => node.getAttribute("title")
            );
          } catch (error) {
            console.error(`Error obteniendo la marca de la tienda: ${error}`);
            marcaTienda = null;
          }
          const marcaDoc = await marcasCollection.findOne({
            [`tienda_nombres.${tiendaNombre}`]: marcaTienda,
          });
          const marca = marcaDoc ? marcaDoc.nombre : marcaTienda;
          const categoria = "Fusil / Subfusil";

          let descripcionElements = await currentPage.$$(
            ".data .description .value p"
          );
          let descripcion = "";
          for (let el of descripcionElements) {
            try {
              descripcion += await currentPage.evaluate(
                (el) => el.textContent,
                el
              );
            } catch (error) {
              console.error(`Error obteniendo la descripción: ${error}`);
            }
          }

          let imagen;
          for (let i = 0; i < 2; i++) {
            try {
              await currentPage.waitForSelector(
                ".fotorama__stage .fotorama__stage__shaft .fotorama__active img.fotorama__img",
                { timeout: 5000 }
              );
              imagen = await currentPage.$eval(
                ".fotorama__stage .fotorama__stage__shaft .fotorama__active img.fotorama__img",
                (node) => node.getAttribute("src")
              );
              if (imagen) {
                break;
              }
            } catch (error) {
              console.log(
                `Intento ${
                  i + 1
                } para obtener la imagen falló, reintentando... Error: ${error}`
              );
              if (i === 1) {
                try {
                  imagen = await currentPage.$eval(
                    "img.fotorama__img",
                    (node) => node.getAttribute("src")
                  );
                } catch (altError) {
                  console.error(
                    `También falló al obtener la imagen alternativa. Error: ${altError}`
                  );
                }
              }
            }
          }

          const existingProducto = await replicasCollection.findOne({
            nombre: nombre,
            marca: marca,
            enlace: productCard.url,
          });

          if (!existingProducto) {
            const result = await replicasCollection.insertOne({
              nombre: nombre,
              marca: marca,
              precio: precio,
              enlace: productCard.url,
              categoria: categoria,
              tienda: tiendaNombre,
              descripcion: descripcion,
              imagen: imagen,
              estado: estado,
              tipo: tipo.tipo,
            });
            console.log(`Producto añadido: ${nombre}`);
            newProductIds.push(result.insertedId.toString());
          } else {
            await replicasCollection.updateOne(
              { _id: existingProducto._id },
              {
                $set: {
                  precio: precio,
                  descripcion: descripcion,
                  imagen: imagen,
                  estado: estado,
                },
              }
            );
            console.log(`Producto actualizado: ${nombre}`);
            if (!newProductIds.includes(existingProducto._id.toString())) {
              newProductIds.push(existingProducto._id.toString());
            }
          }
          await currentPage.close();
        }

        try {
          const loadMoreButton = await page.waitForSelector(
            "button.primary.amscroll-load-button",
            { timeout: 3000, visible: true }
          );
          await page.evaluate((button) => button.click(), loadMoreButton);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          console.log(`No se puede hacer clic en el botón: ${error}`);
          hasNextPage = false;
        }
      }
    }
  }

  const productsToDelete = await replicasCollection
    .find({
      categoria: "Fusil / Subfusil",
      tienda: tiendaNombre,
      _id: { $nin: newProductIds.map((id) => new ObjectId(id)) }, // sólo borramos aquellos que no están en newProductIds
    })
    .toArray();

  productsToDelete.forEach((product) => {
    console.log(`Producto eliminado: ${product.nombre}`);
  });

  await replicasCollection.deleteMany({
    categoria: "Fusil / Subfusil",
    tienda: tiendaNombre,
    _id: { $nin: newProductIds.map((id) => new ObjectId(id)) }, // sólo borramos aquellos que no están en newProductIds
  });

  console.log(
    `----------Los productos antiguos de la categoría "Fusil / Subfusil" y de la tienda "${tiendaNombre}" se han limpiado.`
  );

  await browser.close();
}
// TODAS LAS CATEGORÍAS HOBBY EXPERT:
async function scrapeHobbyExpert(url, tiendaNombre, categoria, estado) {
  const options = {};
  const stats = await PCR(options);

  const browser = await stats.puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
    executablePath: stats.executablePath,
  });

  let newProductIds = [];

  const replicasCollection = await getCollection("replica");
  const tiendasCollection = await getCollection("tienda");
  const marcasCollection = await getCollection("marca");
  const tienda = await tiendasCollection.findOne({ nombre: tiendaNombre });

  if (!tienda) {
    console.log(
      `Tienda ${tiendaNombre} no encontrada. Asegúrate de que está en la base de datos.`
    );
    return;
  }

  const page = await browser.newPage();
  await page.goto(url);

  let tipos = await page.$$eval("div.lvl3-category-banner", (divs) =>
    divs.map((div) => ({
      url: div.querySelector("a").href,
      tipo: div.querySelector("h2").textContent.trim(),
    }))
  );

  for (let tipo of tipos) {
    await page.goto(tipo.url);

    let hasNextPage = true;
    let visitedUrls = new Set();
    while (hasNextPage) {
      await page.waitForSelector("a.product.photo.product-item-photo");

      let productCards = await page.$$eval(".product-item-info", (cards) =>
        cards.map((card) => ({
          url: card.querySelector("a.product.photo.product-item-photo").href,
          outOfStock:
            card.querySelector(".stock span")?.textContent.trim() ===
            "No está disponible",
        }))
      );

      for (let productCard of productCards) {
        if (productCard.outOfStock) {
          console.log("Producto agotado, pasando al siguiente");
          continue;
        }

        if (visitedUrls.has(productCard.url)) {
          continue;
        }
        visitedUrls.add(productCard.url);

        const currentPage = await browser.newPage();
        await currentPage.goto(productCard.url);

        const nombre = await currentPage.$eval("h1.page-title .base", (node) =>
          node.textContent.trim()
        );
        const precio = parseFloat(
          await currentPage.$eval(".product-info-price .price", (node) =>
            node.textContent.trim().replace("€", "").replace(",", ".")
          )
        );
        let marcaTienda;
        try {
          marcaTienda = await currentPage.$eval(
            ".amshopby-option-link a",
            (node) => node.getAttribute("title")
          );
        } catch (error) {
          console.error(`Error obteniendo la marca de la tienda: ${error}`);
          marcaTienda = null;
        }
        const marcaDoc = await marcasCollection.findOne({
          [`tienda_nombres.${tiendaNombre}`]: marcaTienda,
        });
        const marca = marcaDoc ? marcaDoc.nombre : marcaTienda;

        let descripcionElements = await currentPage.$$(
          ".data .description .value p"
        );
        let descripcion = "";
        for (let el of descripcionElements) {
          try {
            descripcion += await currentPage.evaluate(
              (el) => el.textContent,
              el
            );
          } catch (error) {
            console.error(`Error obteniendo la descripción: ${error}`);
          }
        }

        let imagen;
        for (let i = 0; i < 2; i++) {
          try {
            await currentPage.waitForSelector(
              ".fotorama__stage .fotorama__stage__shaft .fotorama__active img.fotorama__img",
              { timeout: 5000 }
            );
            imagen = await currentPage.$eval(
              ".fotorama__stage .fotorama__stage__shaft .fotorama__active img.fotorama__img",
              (node) => node.getAttribute("src")
            );
            if (imagen) {
              break;
            }
          } catch (error) {
            console.log(
              `Intento ${
                i + 1
              } para obtener la imagen falló, reintentando... Error: ${error}`
            );
            if (i === 1) {
              try {
                imagen = await currentPage.$eval("img.fotorama__img", (node) =>
                  node.getAttribute("src")
                );
              } catch (altError) {
                console.error(
                  `También falló al obtener la imagen alternativa. Error: ${altError}`
                );
              }
            }
          }
        }

        const existingProducto = await replicasCollection.findOne({
          nombre: nombre,
          marca: marca,
          enlace: productCard.url,
        });

        if (!existingProducto) {
          const result = await replicasCollection.insertOne({
            nombre: nombre,
            marca: marca,
            precio: precio,
            enlace: productCard.url,
            categoria: categoria,
            tienda: tiendaNombre,
            descripcion: descripcion,
            imagen: imagen,
            estado: estado,
            tipo: tipo.tipo,
          });
          console.log(`Producto añadido: ${nombre}`);
          newProductIds.push(result.insertedId.toString());
        } else {
          await replicasCollection.updateOne(
            { _id: existingProducto._id },
            {
              $set: {
                precio: precio,
                descripcion: descripcion,
                imagen: imagen,
                estado: estado,
              },
            }
          );
          console.log(`Producto actualizado: ${nombre}`);
          if (!newProductIds.includes(existingProducto._id.toString())) {
            newProductIds.push(existingProducto._id.toString());
          }
        }
        await currentPage.close();
      }

      try {
        const loadMoreButton = await page.waitForSelector(
          "button.primary.amscroll-load-button",
          { timeout: 3000, visible: true }
        );
        await page.evaluate((button) => button.click(), loadMoreButton);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.log(`No se puede hacer clic en el botón: ${error}`);
        hasNextPage = false;
      }
    }
  }

  const productsToDelete = await replicasCollection
    .find({
      categoria: categoria,
      tienda: tiendaNombre,
      _id: { $nin: newProductIds.map((id) => new ObjectId(id)) },
    })
    .toArray();

  productsToDelete.forEach((product) => {
    console.log(`Producto eliminado: ${product.nombre}`);
  });

  await replicasCollection.deleteMany({
    categoria: categoria,
    tienda: tiendaNombre,
    _id: { $nin: newProductIds.map((id) => new ObjectId(id)) },
  });

  console.log(
    `----------Los productos antiguos de la categoría "${categoria}" y de la tienda "${tiendaNombre}" se han limpiado.`
  );

  await browser.close();
}

module.exports = {
  checkReplicas,
  borrarReplicas,
  scrapeMadTactical,
  scrapeHobbyExpertFusilesSubfusiles,
  scrapeHobbyExpert,
};
