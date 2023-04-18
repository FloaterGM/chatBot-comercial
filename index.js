// Importacion de librerias

const express = require('express');
const bodyParser = require('body-parser');
const { handleMessage, handlePostback, handleQuickReply, repetir, entrenamiento} = require('./services/Handling')
const i18n = require('./i18n.config')
const { genStart } = require('./services/tempGeneration')
const { getStarted, persistent } = require('./services/graphApi')

const app = express().use(bodyParser.json());

start()
entrenamiento()

// Creacion de pantalla de inicio
async function start() {
  //Se usa la funcion creada para generar el mensaje de bienvenida
  let syntax = genStart(i18n.__('get_started.mensaje'))
  //Se llama al API para dicho fin
  getStarted(syntax)
  persistent()
}

// Conexion al api de messenger mediante el webhook
app.post('/webhook', (req, res) => {
  console.log('POST: webhook');
  const body = req.body;
  //Se valida que sea una pagina
  if (body.object === 'page') {

    body.entry.forEach(entry => {
      // se reciben y procesan los mensajes
      const webhookEvent = entry.messaging[0];
      console.log(webhookEvent);

      const sender_psid = webhookEvent.sender.id;

      repetir(sender_psid)
      console.log(`Sender PSID: ${sender_psid}`)
      //Validacion de recepcion del mensaje
      setTimeout(() => {
        if (webhookEvent.message) {
          if (webhookEvent.message.quick_reply) {
            //Se llama el manejo de respuestas rapidas
            handleQuickReply(sender_psid, webhookEvent.message)
          } else {
             //Se llama el manejo de mensajes planos
            handleMessage(sender_psid, webhookEvent.message)
          }
        } else if (webhookEvent.postback) {
           //Se llama el manejo de postback (accion de botón)
          handlePostback(sender_psid, webhookEvent.postback, webhookEvent.message)
        }
      }, 2500);
    });

    res.status(200).send('EVENTO RECIBIDO');
  } else {
    res.sendStatus(404);
  }
});

//Endpoint de conexion con messenger
app.get('/webhook', (req, res) => {
  console.log('GET: webhook');

  const VERIFY_TOKEN = 'stringUnicoParaTuAplicacion';


  //Se instancian las variables de validacion
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];


  //Se valida la informacion y se ingresa al webhook
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK VERIFICADO');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(404);
    }
  } else {
    res.sendStatus(404);
  }
});

//Listen del server
app.listen(8080, () => {
  console.log('Servidor iniciado...');
});