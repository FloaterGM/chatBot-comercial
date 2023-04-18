const request = require('request');
const fetch = require("node-fetch")
const { URL, URLSearchParams } = require("url")
require('dotenv').config()

//Llamado al api de envio de mensajes
function callSendAPI(sender_psid, response) {
  const requestBody = {
    'recipient': {
      'id': sender_psid
    },
    'message': response
  };

  request({
    'uri': 'https://graph.facebook.com/v15.0/me/messages',
    'qs': { 'access_token': process.env.PAGE_ACCESS_TOKEN },
    'method': 'POST',
    'json': requestBody
  }, (err, res, body) => {
    if (!err) {
      console.log("Mensaje enviado de manera exitosa")
    } else {
      console.error("Imposible enviar mensaje")
    }
  })
}


//Llamado al api de informacion de usuario
async function callUserAPI(sender_psid) {
  let url = new URL(`https://graph.facebook.com/${sender_psid}`);
  url.search = new URLSearchParams({
    access_token: process.env.PAGE_ACCESS_TOKEN,
    fields: "first_name, last_name"
  })
  try {
    let response = await fetch(url, { method: "GET" });
    let userData = await response.json()
    console.log(userData.firstName)
    return { firstName: userData.first_name, lastName: userData.last_name }
  }
  catch (error) {
    console.log(error)
  }
}

//Se hace el llamado del api para la generacion de la pantalla de inicio
async function getStarted(syntax) {
  const requestBody = {
    'greeting': syntax
  };

  request({
    'uri': 'https://graph.facebook.com/v15.0/me/messenger_profile',
    'qs': { 'access_token': process.env.PAGE_ACCESS_TOKEN },
    'method': 'POST',
    'json': requestBody
  }, (err, res, body) => {
    if (!err) {
      console.log("Mensaje enviado de manera exitosa")
    } else {
      console.error("Imposible enviar mensaje")
    }
  })
}


//Se crea el menu persistente del chat
async function persistent() {
  const requestBody = {
    "persistent_menu": [
      {
          "locale": "default",
          "composer_input_disabled": false,
          "call_to_actions": [
              {
                  "type": "postback",
                  "title": "Compras",
                  "payload": "compras"
              },
              {
                  "type": "postback",
                  "title": "Consultar envio",
                  "payload": "envios"
              },
              {
                  "type": "postback",
                  "title": "Consultar compras",
                  "payload": "consultaCompras"
              },{
                  "type": "postback",
                  "title": "Contactar Asesor",
                  "payload": "asesor"
              }
          ]
      }
  ]
  };

  request({
    'uri': 'https://graph.facebook.com/v15.0/me/messenger_profile',
    'qs': { 'access_token': process.env.PAGE_ACCESS_TOKEN },
    'method': 'POST',
    'json': requestBody
  }, (err, res, body) => {
    if (!err) {
      console.log("Mensaje enviado de manera exitosa")
    } else {
      console.error("Imposible enviar mensaje")
    }
  })
}

//Se realiza el exporte de funciones para su uso en otros servicios
module.exports = { callSendAPI, callUserAPI, getStarted, persistent }