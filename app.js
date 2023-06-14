//app.js
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const { connectDb, getCollection } = require("./basedatos");
const {
  checkReplicas,
  borrarReplicas,
  scrapeMadTactical,
  scrapeHobbyExpertFusilesSubfusiles,
  scrapeHobbyExpert,
} = require("./scraper");
// const { checkReplicas, borrarReplicas, scrapeMadTactical } = require('./scraper');
// const { scrapeMadTactical } = require('./scraper');
// const { checkReplicas, scrapeMadTactical, scrapeHobbyExpertFusilesSubfusiles, scrapeHobbyExpert } = require('./scraper');
// const { checkReplicas, borrarReplicas, scrapeHobbyExpert } = require('./scraper');

const app = express();

// Motor de visualización ejs
app.set("view engine", "ejs");

// Para manejar los POST
app.use(bodyParser.urlencoded({ extended: true }));

// Localización de la carpeta views
app.set("views", path.join(__dirname, "views"));

// Carpeta public para archivos estáticos
app.use(express.static("public"));

// Ruta para '/index'
app.get("/", function (req, res) {
  res.render("index");
});
// Ruta para '/replicas'
app.get("/replicas", function (req, res) {
  res.render("replicas");
});

app.post("/contacto", async (req, res) => {
  const { nombre, correo, mensaje } = req.body;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let mailOptions = {
    from: "probandocjcjapp2@gmail.com",
    to: "raulcrivera97@gmail.com",
    subject: `HOPUP - Contacto de ${nombre}`,
    text: `
      Nombre: ${nombre}
      Correo: ${correo}
      Mensaje: ${mensaje}
    `,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email enviado: " + info.response);
    res.render("contacto", {
      titulo: "¡MENSAJE ENVIADO CORRECTAMENTE!",
      mensaje:
        "Tu consulta es importante para nosotros y nos aseguraremos de responderla lo antes posible.",
    });
  } catch (error) {
    console.error(`Error al enviar el correo: ${error}`);
    res.render("contacto", {
      titulo: "¡NO SE HA ENVIADO EL MENSAJE!",
      mensaje: `Ha ocurrido un error al enviar tu mensaje. Por favor inténtalo nuevamente. ${error.message}`,
    });
  }
});

// Web solicita estos datos
app.get("/api/replicas", async (req, res) => {
  const replicasCollection = await getCollection("replica");
  let query = {};

  if (req.query.tienda) {
    query.tienda = req.query.tienda;
  }

  if (req.query.categoria) {
    query.categoria = req.query.categoria;
  }

  const replicas = await replicasCollection.find(query).toArray();
  res.json(replicas);
});

app.get("/api/tiendas", async (req, res) => {
  const replicasCollection = await getCollection("replica");
  const tiendas = await replicasCollection.distinct("tienda");
  res.json(tiendas);
});

app.get("/api/categorias", async (req, res) => {
  const replicasCollection = await getCollection("replica");
  const categorias = await replicasCollection.distinct("categoria");
  res.json(categorias);
});

app.get("/api/marcas", async (req, res) => {
  const replicasCollection = await getCollection("replica");
  const marcas = await replicasCollection.distinct("marca");
  res.json(marcas);
});

const port = 80;

app.listen(port, async () => {
  console.log(
    `<<<<<<<<<<<<<<<<<<<<App listening at http://3.142.246.62:${port}`
  );
  await connectDb();

  // Borrar BBDD
  await borrarReplicas();
  console.log("---------------¡Todas las replicas reiniciadas!");

  // Categoría "Fusil / Subfusil"
  console.log(
    '<<<<<<<<<<<<<<<Scraping Inicial "Fusil/Subfusil" de la tienda "Mad Tactical"...'
  );
  await scrapeMadTactical(
    "https://madtactical.es/6-fusiles-y-subfusiles",
    "Mad Tactical",
    "Fusil / Subfusil",
    "Nuevo"
  );
  console.log(">>>>>>>>>>>>>>>¡Hecho!");

  console.log(
    '<<<<<<<<<<<<<<<Scraping Inicial "Fusil/Subfusil" de la tienda "Hobby Expert"...'
  );
  await scrapeHobbyExpertFusilesSubfusiles(
    [
      "https://www.hobbyexpert.es/replicas-de-airsoft/fusiles-de-asalto-airsoft",
      "https://www.hobbyexpert.es/replicas-de-airsoft/subfusiles-airsoft",
    ],
    "Hobby Expert",
    "Nuevo"
  );
  console.log(">>>>>>>>>>>>>>>¡Hecho!");

  // Categoría "Escopeta"
  console.log(
    '<<<<<<<<<<<<<<<Scraping Inicial "Escopeta" de la tienda "Mad Tactical"...'
  );
  await scrapeMadTactical(
    "https://madtactical.es/17-escopetas",
    "Mad Tactical",
    "Escopeta",
    "Nuevo"
  );
  console.log(">>>>>>>>>>>>>>>¡Hecho!");

  console.log(
    '<<<<<<<<<<<<<<<Scraping Inicial "Escopeta" from "Hobby Expert"...'
  );
  await scrapeHobbyExpert(
    "https://www.hobbyexpert.es/replicas-de-airsoft/escopetas-airsoft",
    "Hobby Expert",
    "Escopeta",
    "Nuevo"
  );
  console.log(">>>>>>>>>>>>>>>¡Hecho!");

  //Categoría "Pistola"
  console.log(
    '<<<<<<<<<<<<<<<Scraping Inicial "Pistola" from "Mad Tactical"...'
  );
  await scrapeMadTactical(
    "https://madtactical.es/7-pistolas",
    "Mad Tactical",
    "Pistola",
    "Nuevo"
  );
  console.log(">>>>>>>>>>>>>>>¡Hecho!");

  console.log(
    '<<<<<<<<<<<<<<<Scraping Inicial "Pistola" from "Hobby Expert"...'
  );
  await scrapeHobbyExpert(
    "https://www.hobbyexpert.es/replicas-de-airsoft/pistolas-de-airsoft",
    "Hobby Expert",
    "Pistola",
    "Nuevo"
  );
  console.log(">>>>>>>>>>>>>>>¡Hecho!");

  //Categoría "Rifle"
  console.log('<<<<<<<<<<<<<<<Scraping Inicial "Rifle" from "Mad Tactical"...');
  await scrapeMadTactical(
    "https://madtactical.es/83-sniper-rifle-francotirador",
    "Mad Tactical",
    "Rifle",
    "Nuevo"
  );
  console.log(">>>>>>>>>>>>>>>¡Hecho!");

  console.log('<<<<<<<<<<<<<<<Scraping Inicial "Rifle" from "Hobby Expert"...');
  await scrapeHobbyExpert(
    "https://www.hobbyexpert.es/replicas-de-airsoft/rifles-de-francotirador-airsoft",
    "Hobby Expert",
    "Rifle",
    "Nuevo"
  );
  console.log(">>>>>>>>>>>>>>>¡Hecho!");

  //Categoría "Ametralladora"
  console.log(
    '<<<<<<<<<<<<<<<Scraping Inicial "Ametralladora" from "Mad Tactical"...'
  );
  await scrapeMadTactical(
    "https://madtactical.es/85-ametralladoras",
    "Mad Tactical",
    "Ametralladora",
    "Nuevo"
  );
  console.log(">>>>>>>>>>>>>>>¡Hecho!");

  console.log(
    '<<<<<<<<<<<<<<<Scraping Inicial "Ametralladora" from "Hobby Expert"...'
  );
  await scrapeHobbyExpert(
    "https://www.hobbyexpert.es/replicas-de-airsoft/apoyo-airsoft",
    "Hobby Expert",
    "Ametralladora",
    "Nuevo"
  );
  console.log(">>>>>>>>>>>>>>>¡Hecho!");

  try {
    await checkReplicas();
  } catch (error) {
    console.error(`Error al comprobar las réplicas: ${error}`);
  }
});

// SCRAPING PERIODICO

// ESCANEO PERIÓDICO
const taskEscaneoPeriodico = cron.schedule(
  "0 * * * *",
  async () => {
    // Categoría "Fusil / Subfusil"
    console.log(
      '<<<<<<<<<<<<<<<Scraping Inicial "Fusil/Subfusil" de la tienda "Mad Tactical"...'
    );
    await scrapeMadTactical(
      "https://madtactical.es/6-fusiles-y-subfusiles",
      "Mad Tactical",
      "Fusil / Subfusil",
      "Nuevo"
    );
    console.log(">>>>>>>>>>>>>>>¡Hecho!");

    console.log(
      '<<<<<<<<<<<<<<<Scraping Inicial "Fusil/Subfusil" de la tienda "Hobby Expert"...'
    );
    await scrapeHobbyExpertFusilesSubfusiles(
      [
        "https://www.hobbyexpert.es/replicas-de-airsoft/fusiles-de-asalto-airsoft",
        "https://www.hobbyexpert.es/replicas-de-airsoft/subfusiles-airsoft",
      ],
      "Hobby Expert",
      "Nuevo"
    );
    console.log(">>>>>>>>>>>>>>>¡Hecho!");

    // Categoría "Escopeta"
    console.log(
      '<<<<<<<<<<<<<<<Scraping Inicial "Escopeta" de la tienda "Mad Tactical"...'
    );
    await scrapeMadTactical(
      "https://madtactical.es/17-escopetas",
      "Mad Tactical",
      "Escopeta",
      "Nuevo"
    );
    console.log(">>>>>>>>>>>>>>>¡Hecho!");

    console.log(
      '<<<<<<<<<<<<<<<Scraping Inicial "Escopeta" from "Hobby Expert"...'
    );
    await scrapeHobbyExpert(
      "https://www.hobbyexpert.es/replicas-de-airsoft/escopetas-airsoft",
      "Hobby Expert",
      "Escopeta",
      "Nuevo"
    );
    console.log(">>>>>>>>>>>>>>>¡Hecho!");

    //Categoría "Pistola"
    console.log(
      '<<<<<<<<<<<<<<<Scraping Inicial "Pistola" from "Mad Tactical"...'
    );
    await scrapeMadTactical(
      "https://madtactical.es/7-pistolas",
      "Mad Tactical",
      "Pistola",
      "Nuevo"
    );
    console.log(">>>>>>>>>>>>>>>¡Hecho!");

    console.log(
      '<<<<<<<<<<<<<<<Scraping Inicial "Pistola" from "Hobby Expert"...'
    );
    await scrapeHobbyExpert(
      "https://www.hobbyexpert.es/replicas-de-airsoft/pistolas-de-airsoft",
      "Hobby Expert",
      "Pistola",
      "Nuevo"
    );
    console.log(">>>>>>>>>>>>>>>¡Hecho!");

    //Categoría "Rifle"
    console.log(
      '<<<<<<<<<<<<<<<Scraping Inicial "Rifle" from "Mad Tactical"...'
    );
    await scrapeMadTactical(
      "https://madtactical.es/83-sniper-rifle-francotirador",
      "Mad Tactical",
      "Rifle",
      "Nuevo"
    );
    console.log(">>>>>>>>>>>>>>>¡Hecho!");

    console.log(
      '<<<<<<<<<<<<<<<Scraping Inicial "Rifle" from "Hobby Expert"...'
    );
    await scrapeHobbyExpert(
      "https://www.hobbyexpert.es/replicas-de-airsoft/rifles-de-francotirador-airsoft",
      "Hobby Expert",
      "Rifle",
      "Nuevo"
    );
    console.log(">>>>>>>>>>>>>>>¡Hecho!");

    //Categoría "Ametralladora"
    console.log(
      '<<<<<<<<<<<<<<<Scraping Inicial "Ametralladora" from "Mad Tactical"...'
    );
    await scrapeMadTactical(
      "https://madtactical.es/85-ametralladoras",
      "Mad Tactical",
      "Ametralladora",
      "Nuevo"
    );
    console.log(">>>>>>>>>>>>>>>¡Hecho!");

    console.log(
      '<<<<<<<<<<<<<<<Scraping Inicial "Ametralladora" from "Hobby Expert"...'
    );
    await scrapeHobbyExpert(
      "https://www.hobbyexpert.es/replicas-de-airsoft/apoyo-airsoft",
      "Hobby Expert",
      "Ametralladora",
      "Nuevo"
    );
    console.log(">>>>>>>>>>>>>>>¡Hecho!");

    try {
      await checkReplicas();
    } catch (error) {
      console.error(`Error al comprobar las réplicas: ${error}`);
    }
    console.log(">>>>>>>>>>>>>>>¡Escaneo Periódico Hecho!");
  },
  {
    scheduled: true,
    timezone: "Europe/Madrid",
  }
);

taskEscaneoPeriodico.start();

// Categoría "Fusil / Subfusil" Periodico
// const taskFusilesSubfusiles = cron.schedule('0 * * * *', async () => {
//   console.log('<<<<<<<<<<<<<<<Scraping Periodico "Fusil/Subfusil" de la tienda "Mad Tactical"...');
//   await scrapeMadTactical('https://madtactical.es/6-fusiles-y-subfusiles', "Mad Tactical", "Fusil / Subfusil", "Nuevo");
//   console.log('>>>>>>>>>>>>>>>¡Hecho!');

//   console.log('<<<<<<<<<<<<<<<Scraping Periodico "Fusil/Subfusil" de la tienda "Hobby Expert"...');
//   await scrapeHobbyExpertFusilesSubfusiles([
//     'https://www.hobbyexpert.es/replicas-de-airsoft/fusiles-de-asalto-airsoft',
//     'https://www.hobbyexpert.es/replicas-de-airsoft/subfusiles-airsoft'
//   ], "Hobby Expert", "Nuevo");
//   console.log('>>>>>>>>>>>>>>>¡Hecho!');
// }, {
//   scheduled: true,
//   timezone: "Europe/Madrid"
// });
// Categoría "Escopeta" Periodico
// const taskEscopetas = cron.schedule('10 * * * *', async () => {
//   console.log('<<<<<<<<<<<<<<<Scraping Periodico "Escopeta" de la tienda "Mad Tactical"...');
//   await scrapeMadTactical('https://madtactical.es/17-escopetas', "Mad Tactical", "Escopeta", "Nuevo");
//   console.log('>>>>>>>>>>>>>>>¡Hecho!');

//   console.log('<<<<<<<<<<<<<<<Scraping Periodico "Escopeta" from "Hobby Expert"...');
//   await scrapeHobbyExpert('https://www.hobbyexpert.es/replicas-de-airsoft/escopetas-airsoft', "Hobby Expert", "Escopeta", "Nuevo");
//   console.log('>>>>>>>>>>>>>>>¡Hecho!');
// }, {
//   scheduled: true,
//   timezone: "Europe/Madrid"
// });
// Categoría "Pistola" Periodico
// const taskPistolas = cron.schedule('10 * * * *', async () => {
//   console.log('<<<<<<<<<<<<<<<Scraping Periodico "Pistola" de la tienda "Mad Tactical"...');
//   await scrapeMadTactical('https://madtactical.es/7-pistolas', "Mad Tactical", "Pistola", "Nuevo");
//   console.log('>>>>>>>>>>>>>>>¡Hecho!');

//   console.log('<<<<<<<<<<<<<<<Scraping Periodico "Pistola" from "Hobby Expert"...');
//   await scrapeHobbyExpert('https://www.hobbyexpert.es/replicas-de-airsoft/pistolas-de-airsoft', "Hobby Expert", "Pistola", "Nuevo");
//   console.log('>>>>>>>>>>>>>>>¡Hecho!');
// }, {
//   scheduled: true,
//   timezone: "Europe/Madrid"
// });

// NO OLVIDAR ACTIVAR ESTOOOOOOOOOOOOOOOOOO
// taskFusilesSubfusiles.start();
// taskEscopetas.start();
// taskPistolas.start();
