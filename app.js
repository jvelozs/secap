const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.set('view engine', 'ejs'); // Usar EJS como el motor de vistas
app.use(express.urlencoded({ extended: true })); // Para manejar datos del formulario

// Ruta principal - Interfaz para ingresar el número de cédula
app.get('/', (req, res) => {
  res.render('index');
});

// Función para hacer una pausa de X milisegundos
function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

// Ruta para procesar la solicitud del formulario
app.post('/buscar_cedula', async (req, res) => {
  const cedula = req.body.cedula;

  // Lógica de Puppeteer para automatizar la búsqueda
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navegar a la página
    await page.goto('https://si.secap.gob.ec/sisecap/logeo_web/usuario_nuevo.php');

    // Seleccionar "Cédula" en el menú desplegable
    await page.select('#tidentificacion', '1');

    // Ingresar el número de cédula
    await page.type('#documento', cedula);

    // Simular "onblur" para activar la búsqueda
    await page.evaluate(() => {
      document.querySelector('#documento').dispatchEvent(new Event('blur'));
    });

    // Esperar un poco para que se carguen los datos (3 segundos)
    await delay(3000);

    // Extraer los datos
    const result = await page.evaluate(() => {
      const apellidos = document.querySelector('#apellidos').value;
      const nombres = document.querySelector('#nombres').value;
      const fecha_nacimiento = document.querySelector('#fecha_nacimiento').value;
      const estado_civil = document.querySelector('#estado_civil').options[document.querySelector('#estado_civil').selectedIndex].text;

      return { apellidos, nombres, fecha_nacimiento, estado_civil };
    });

    await browser.close();

    // Renderizar los resultados en la página web
    res.render('index', { result });
  } catch (error) {
    console.error('Error:', error);
    res.render('index', { result: { error: 'Ocurrió un error al buscar la cédula.' } });
  }
});

// Escuchar en el puerto 3000
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
