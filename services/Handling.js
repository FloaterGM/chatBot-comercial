// Importacion de librerias y funciones para su uso en el aplicativo
const { callSendAPI, callUserAPI } = require('./graphApi')
const jsonInitial = JSON.stringify(require('../locales/initials.json'))
const initials = JSON.parse(jsonInitial)
const jsonResponse = JSON.stringify(require('../locales/responses.json'))
const responses = JSON.parse(jsonResponse)
const { Request, TYPES, Connection } = require('tedious')
const i18n = require('../i18n.config')
const { genQuickReply, genText, genGenericTemplate } = require('./tempGeneration')
const natural = require('natural')
const tokenizer = new natural.WordTokenizer();
const classifier = new natural.BayesClassifier();
const userPSID = {}

//Entrenamiento funcion de lenguaje natural 
function entrenamiento() {
  classifier.addDocument('Eres un idiota', 'insulto');
  classifier.addDocument('No estás entendiendo mi pregunta, esto es frustrante.', 'insulto');
  classifier.addDocument('Tus respuestas son demasiado vagas y no me están ayudando.', 'insulto');
  classifier.addDocument('Me estás dando información equivocada.', 'insulto');
  classifier.addDocument('Me estás haciendo perder el tiempo con respuestas irrelevantes.', 'insulto');
  classifier.addDocument('No me gustó cómo me trataste. No eres amigable ni servicial.', 'insulto');
  classifier.addDocument('No puedo creer que no sepas cómo responder a esta pregunta básica.', 'insulto');
  classifier.addDocument('Me estás dando la misma respuesta una y otra vez.', 'insulto');
  classifier.addDocument('Tu servicio es lento e ineficiente. Esperé demasiado tiempo para obtener una respuesta.', 'insulto');
  classifier.addDocument('No me gusta cómo estás diseñado. Tu interfaz es confusa y difícil de usar.', 'insulto');
  classifier.addDocument('Eres demasiado limitado. No puedes responder preguntas fuera de tu programación preestablecida.', 'insulto');
  classifier.addDocument('Vete al diablo', 'insulto');
  classifier.addDocument('Gracias por nada imbecil', 'insulto');
  classifier.addDocument('Que bot mas inutil', 'insulto');
  classifier.addDocument('Bot mas sapo', 'insulto');
  classifier.addDocument('Mera peye de bot', 'insulto');
  classifier.addDocument('Que bot tan asqueroso', 'insulto');
  classifier.addDocument('Gas este bot', 'insulto');
  classifier.addDocument('Eres genial', 'no insulto');
  classifier.addDocument('Me encanta trabajar contigo', 'no insulto');
  classifier.addDocument('Gracias por la ayuda', 'no insulto');
  classifier.addDocument('Me gustaria comprar', 'no insulto');
  classifier.addDocument('¡Gracias! Me has ayudado mucho con mi consulta.', 'no insulto');
  classifier.addDocument('¡Excelente trabajo! Me has brindado la información que necesitaba.', 'no insulto');
  classifier.addDocument('¡Eres un gran asistente virtual! Siempre respondes de manera rápida y precisa.', 'no insulto');
  classifier.addDocument('¡Impresionante! Me encanta cómo interactúas conmigo y me haces sentir cómodo.', 'no insulto');
  classifier.addDocument('¡Fantástico! Nunca me había sentido tan bien atendido por un chatbot antes.', 'no insulto');
  classifier.addDocument('¡Increíble! Me encanta cómo utilizas el lenguaje natural para entender mis necesidades y brindarme una solución adecuada.', 'no insulto');
  classifier.addDocument('¡Estupendo! Me has ahorrado mucho tiempo y esfuerzo al responder mis preguntas de manera tan eficiente.', 'no insulto');
  classifier.addDocument('¡Brillante! Realmente aprecio la manera en que me has guiado a través del proceso de registro/pedido/consulta.', 'no insulto');
  classifier.addDocument('¡Fantástico trabajo! Me has dado una experiencia de usuario increíblemente agradable.', 'no insulto');
  classifier.addDocument('¡Excelente servicio! Me gusta cómo siempre estás disponible para ayudarme, incluso fuera del horario de atención al cliente.', 'no insulto');
  classifier.addDocument('¡Maravilloso! Me encanta cómo personalizas tus respuestas para adaptarte a mis necesidades específicas.', 'no insulto');
  classifier.addDocument('¡Fantástica herramienta! Gracias por brindarme una solución tan útil y fácil de usar.', 'no insulto');
  classifier.train();
}

function detectorDeInsultos(texto) {
  const words = tokenizer.tokenize(texto.toLowerCase())
  const label = classifier.classify(words)

  return label === 'insulto'
}

// Funcion inicial de consulta
function repetir(sender_psid) {
  consulta(sender_psid)
}

// Manejo de respuestas de la aplicacion
async function handlePostback(sender_psid, received_postback) {
  if (userPSID[sender_psid].flag == null || userPSID[sender_psid].flag == undefined) {
    userPSID[sender_psid].flag = 0
  }

  let response;
  //Informacion del usuario
  let userInfo = await callUserAPI(sender_psid)

  const payload = received_postback.payload
  //Envio de menu de compras
  if (payload === 'compras') {
    //Se comprueba que si haya datos de la persona
    if (userPSID[sender_psid].psid != undefined && userPSID[sender_psid].psid != null) {
      setTimeout(() => {
        response = genText(i18n.__('compras.client', { firstName: userInfo.firstName }))
        callSendAPI(sender_psid, response)
      }, 1000);
      setTimeout(() => {
        response = genQuickReply(i18n.__('compras.start', { firstName: userInfo.firstName }), [{
          title: 'Tengo algo en mente',
          payload: 'enMente'
        }, {
          title: 'Ver catalogo',
          payload: 'catalogo'
        }])
        callSendAPI(sender_psid, response)
      }, 2000);
    } else {
      setTimeout(() => {
        response = genText(i18n.__('infoUsuario.sinInfo', { firstName: userInfo.firstName }))
        callSendAPI(sender_psid, response)
      }, 1000)
      setTimeout(() => {
        response = genQuickReply(i18n.__('infoUsuario.peticion'), [{
          title: 'Si claro 😀',
          payload: 'si'
        }, {
          title: 'No',
          payload: 'no'
        }])
        callSendAPI(sender_psid, response)
      }, 2000)
    }
    updateEstado(sender_psid, 'interesCompra')
  }
  // Envio de gestion de inicio
  else if (payload === '<GET_STARTED_PAYLOAD>') {
    setTimeout(() => {
      response = genText(i18n.__('bienvenida.welcome', { firstName: userInfo.firstName }))
      callSendAPI(sender_psid, response)
    }, 1000)
    setTimeout(() => {
      response = genText(i18n.__('bienvenida.remember'))
      callSendAPI(sender_psid, response)
    }, 2000)
    setTimeout(() => {
      response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
        title: 'Compras',
        payload: 'compras'
      }, {
        title: 'Consultar envio',
        payload: 'envios'
      }, {
        title: 'Consultar compras',
        payload: 'consultaCompras'
      }, {
        title: 'Factura',
        payload: 'factura'
      }, {
        title: 'Contactar asesor',
        payload: 'asesor'
      }])
      callSendAPI(sender_psid, response)
    }, 3000)
    response = ""
    updateEstado(sender_psid, 'interaccionInicial')
  }
  // Manejo de gestion de envios
  else if (payload == 'envios') {
    insert()
    userPSID[sender_psid].flag = 5
    response = genText(i18n.__('envios.peticion', { firstName: userInfo.firstName }))
    updateEstado(sender_psid, 'consultaEnvios')
  }
  // Manejo de gestion de compras
  else if (payload == 'consultaCompras') {
    response = genText(i18n.__('consultaCompras.cedula'))
    userPSID[sender_psid].flag = 7
    updateEstado(sender_psid, 'consultaCompras')
  }
  // Manejo de contacto de asesor
  else if (payload == 'asesor') {
    //Se comprueba si ya se tienen los datos del celular
    if (userPSID[sender_psid].cel == undefined || userPSID[sender_psid].cel == null) {
      response = genText(i18n.__('asesor.celular'))
      userPSID[sender_psid].flag = 8
    } else {
      response = genText(i18n.__('asesor.contactar', { firstName: userInfo.firstName, numero: userPSID[sender_psid].cel }))
      setTimeout(() => {
        response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
          title: 'Compras',
          payload: 'compras'
        }, {
          title: 'Consultar envio',
          payload: 'envios'
        }, {
          title: 'Consultar compras',
          payload: 'consultaCompras'
        }, {
          title: 'Factura',
          payload: 'factura'
        }, {
          title: 'Contactar asesor',
          payload: 'asesor'
        }])
        callSendAPI(sender_psid, response)
      }, 1000);
      insertAsesoria({ fbuser: userPSID[sender_psid].fbuser, celular: userPSID[sender_psid].cel })
    }
    setTimeout(() => {
      updateEstado(sender_psid, 'consultaAsesor')
    }, 1000);
  }
  callSendAPI(sender_psid, response)
}

// Manejo de respuestas rapidas
async function handleQuickReply(sender_psid, received_message, pay) {
  // Se crea el atributo Flag al usuario
  if (userPSID[sender_psid].flag == null || userPSID[sender_psid].flag == undefined) {
    userPSID[sender_psid].flag = 0
  }
  let response
  let payload = pay || received_message.quick_reply.payload
  let userInfo = await callUserAPI(sender_psid)

  //Se comprueba el payload
  if (payload == "si") {
    if (userPSID[sender_psid].flag == 0) {
      userPSID[sender_psid].flag = 1
      response = {
        text: "Genial, ingresa porfa tu cedula: "
      }
    } else if (userPSID[sender_psid].flag == 4) {
      userPSID[sender_psid].flag = 0
      response = genQuickReply(i18n.__('compras.start', { firstName: userInfo.firstName }), [{
        title: 'Ya tengo algo en mente',
        payload: 'enMente'
      }, {
        title: 'Ver catalogo',
        payload: 'catalogo'
      }])
      insert(userPSID[sender_psid])
    }
  } else if (payload == 'no') {
    if (userPSID[sender_psid].flag == 0) {
      setTimeout(() => {
        response = genText(i18n.__('infoUsuario.noAcepta', { firstName: userInfo.firstName }))
        callSendAPI(sender_psid, response)
      }, 1000)
      setTimeout(() => {
        response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
          title: 'Compras',
          payload: 'compras'
        }, {
          title: 'Consultar envio',
          payload: 'envios'
        }, {
          title: 'Consultar compras',
          payload: 'consultaCompras'
        }, {
          title: 'Factura',
          payload: 'factura'
        }, {
          title: 'Contactar asesor',
          payload: 'asesor'
        }])
        callSendAPI(sender_psid, response)
      }, 2000);
    } else if (userPSID[sender_psid].flag == 4) {
      response = {
        text: "Ingresa nuevamente los datos, recuerda (Cedula, Nombre completo, Celular, Correo)"
      }
      userPSID[sender_psid].flag = 0
      handleQuickReply(sender_psid, received_message, 'si')
    }
  } else if (payload == 'compras') {
    if (userPSID[sender_psid].psid != undefined && userPSID[sender_psid].psid != null) {
      setTimeout(() => {
        response = genText(i18n.__('compras.client', { firstName: userInfo.firstName }))
        callSendAPI(sender_psid, response)
      }, 1000);
      setTimeout(() => {
        response = genQuickReply(i18n.__('compras.start', { firstName: userInfo.firstName }), [{
          title: 'Tengo algo en mente',
          payload: 'enMente'
        }, {
          title: 'Ver catalogo',
          payload: 'catalogo'
        }])
        callSendAPI(sender_psid, response)
      }, 2000);
    } else {
      setTimeout(() => {
        response = genText(i18n.__('infoUsuario.sinInfo', { firstName: userInfo.firstName }))
        callSendAPI(sender_psid, response)
      }, 1000)
      setTimeout(() => {
        response = genQuickReply(i18n.__('infoUsuario.peticion'), [{
          title: 'Si claro 😀',
          payload: 'si'
        }, {
          title: 'No',
          payload: 'no'
        }])
        callSendAPI(sender_psid, response)
      }, 2000)
    }
    updateEstado(sender_psid, 'interesCompras')
  } else if (payload == 'catalogo') {
    setTimeout(() => {
      response = genText(i18n.__('catalogo.mensaje', { firstName: userInfo.firstName }))
      callSendAPI(sender_psid, response)
    }, 1000)
    setTimeout(() => {
      response = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "button",
            "text": "Catalogo 🎫",
            "buttons": [{
              "type": "web_url",
              "url": "https://datatemptech.blob.core.windows.net/temp/Catalogo%20-%20Electronicos",
              "title": "Catalogo",
            }
            ]
          }
        }
      }
      callSendAPI(sender_psid, response)
    }, 2000);
    setTimeout(() => {
      response = genQuickReply(i18n.__('catalogo.leido'), [{
        title: 'Acabé',
        payload: 'leido'
      }])
      callSendAPI(sender_psid, response)
    }, 3000);
    updateEstado(sender_psid, 'visualizacionCatalogo')
  } else if (payload == 'envios') {
    userPSID[sender_psid].flag = 5
    response = genText(i18n.__('envios.peticion', { firstName: userInfo.firstName }))
    updateEstado(sender_psid, 'consultaEnvios')
  } else if (payload == 'enMente') {
    userPSID[sender_psid].flag = 6
    response = genText(i18n.__('envioProducto.mensaje', { firstName: userInfo.firstName }))
  } else if (payload == 'reintentar') {
    handleQuickReply(sender_psid, received_message, 'enMente')
  } else if (payload == 'continuar') {
    response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
      title: 'Compras',
      payload: 'compras'
    }, {
      title: 'Consultar envio',
      payload: 'envios'
    }, {
      title: 'Consultar compras',
      payload: 'consultaCompras'
    }, {
      title: 'Factura',
      payload: 'factura'
    }, {
      title: 'Contactar asesor',
      payload: 'asesor'
    }])
  } else if (payload == 'leido') {
    handleQuickReply(sender_psid, received_message, 'enMente')
  } else if (payload == 'consultaCompras') {
    response = genText(i18n.__('consultaCompras.cedula'))
    userPSID[sender_psid].flag = 7
  } else if (payload == 'asesor') {
    if (userPSID[sender_psid].cel == undefined || userPSID[sender_psid].cel == null) {
      response = genText(i18n.__('asesor.celular'))
      userPSID[sender_psid].flag = 8
    } else {
      response = genText(i18n.__('asesor.contactar', { firstName: userInfo.firstName, numero: userPSID[sender_psid].cel }))
      setTimeout(() => {
        response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
          title: 'Compras',
          payload: 'compras'
        }, {
          title: 'Consultar envio',
          payload: 'envios'
        }, {
          title: 'Consultar compras',
          payload: 'consultaCompras'
        }, {
          title: 'Factura',
          payload: 'factura'
        }, {
          title: 'Contactar asesor',
          payload: 'asesor'
        }])
        callSendAPI(sender_psid, response)
      }, 1000);
      insertAsesoria({ fbuser: userPSID[sender_psid].fbuser, celular: userPSID[sender_psid].cel })
    }
    setTimeout(() => {
      updateEstado(sender_psid, 'consultaAsesor')
    }, 1000);
  } else if (payload == 'factura') {
    response = genText('Claro, ingresa porfa el numero de pedido: ')
    userPSID[sender_psid].flag = 9
  }
  callSendAPI(sender_psid, response)
}

// Funcion de manejo de mensajes
async function handleMessage(sender_psid, received_message) {


  let response
  //Se llama el api para usar los datos de usuario
  let userInfo = await callUserAPI(sender_psid)
  if (userPSID[sender_psid].flag == 1) {
    userPSID[sender_psid] = { psid: sender_psid, fbuser: userInfo.firstName }
    userPSID[sender_psid].cedula = received_message.text
    response = {
      "text": "Perfecto, ingresa por favor tu nombre completo: "
    }
    userPSID[sender_psid].flag = 2
  } else if (userPSID[sender_psid].flag == 2) {
    userPSID[sender_psid].nombre = received_message.text
    response = {
      "text": "Ahora, ingresa por favor un numero de contacto: "
    }
    userPSID[sender_psid].flag = 3
  } else if (userPSID[sender_psid].flag == 3) {
    userPSID[sender_psid].cel = received_message.text
    response = {
      "text": "Por ultimo, ingresa por favor un correo al que podamos contarnos: "
    }
    userPSID[sender_psid].flag = 4
  } else if (userPSID[sender_psid].flag == 4) {
    userPSID[sender_psid].correo = received_message.text
    response = {
      "text": `¿Es esta informacion correcta? cedula: ${userPSID[sender_psid].cedula}, Nombre: ${userPSID[sender_psid].nombre}, Cel: ${userPSID[sender_psid].cel}, Correo: ${userPSID[sender_psid].correo}`,
      "quick_replies": responses.quickReplyInfo
    }
  } else if (userPSID[sender_psid].flag == 5) {
    if (userPSID[sender_psid].compras.find(compra => compra.nOrden == received_message.text)) {
      pedido = userPSID[sender_psid].compras.find(compra => compra.nOrden == received_message.text)
      console.log(pedido)
      if (pedido.guia == null) {
        response = genText(i18n.__('envios.noGuia', { firstName: userInfo.firstName }))
        userPSID[sender_psid].flag = 0
        setTimeout(() => {
          response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
            title: 'Compras',
            payload: 'compras'
          }, {
            title: 'Consultar envio',
            payload: 'envios'
          }, {
            title: 'Consultar compras',
            payload: 'consultaCompras'
          }, {
            title: 'Factura',
            payload: 'factura'
          }, {
            title: 'Contactar asesor',
            payload: 'asesor'
          }])
          callSendAPI(sender_psid, response)
        }, 1000);
      } else {
        response = genText(i18n.__('envios.guia', { firstName: userInfo.firstName, guia: pedido.guia }))
        userPSID[sender_psid].flag = 0
        setTimeout(() => {
          response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
            title: 'Compras',
            payload: 'compras'
          }, {
            title: 'Consultar envio',
            payload: 'envios'
          }, {
            title: 'Consultar compras',
            payload: 'consultaCompras'
          }, {
            title: 'Factura',
            payload: 'factura'
          }, {
            title: 'Contactar asesor',
            payload: 'asesor'
          }])
          callSendAPI(sender_psid, response)
        }, 1000);
      }
    } else {
      response = genText(i18n.__('envios.noPedido', { firstName: userInfo.firstName }))
      userPSID[sender_psid].flag = 0
      setTimeout(() => {
        response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
          title: 'Compras',
          payload: 'compras'
        }, {
          title: 'Consultar envio',
          payload: 'envios'
        }, {
          title: 'Consultar compras',
          payload: 'consultaCompras'
        }, {
          title: 'Factura',
          payload: 'factura'
        }, {
          title: 'Contactar asesor',
          payload: 'asesor'
        }])
        callSendAPI(sender_psid, response)
      }, 1000);
    }
  } else if (userPSID[sender_psid].flag == 6) {
    if (i18n.__('inventario.articulos').find(articulo => articulo.nombre.toLowerCase() == received_message.text.toLowerCase()) || i18n.__('inventario.articulos').find(articulo => articulo.id == received_message.text)) {
      articulo = i18n.__('inventario.articulos').find(articulo => articulo.nombre.toLowerCase() == received_message.text.toLowerCase()) || i18n.__('inventario.articulos').find(articulo => articulo.id == received_message.text)
      response = genGenericTemplate(articulo.url, articulo.nombre, articulo.precio, [{
        type: 'web_url',
        title: 'Comprar',
        url: articulo.urlWeb
      }])
      setTimeout(() => {
        response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
          title: 'Compras',
          payload: 'compras'
        }, {
          title: 'Consultar envio',
          payload: 'envios'
        }, {
          title: 'Consultar compras',
          payload: 'consultaCompras'
        }, {
          title: 'Factura',
          payload: 'factura'
        }, {
          title: 'Contactar asesor',
          payload: 'asesor'
        }])
        callSendAPI(sender_psid, response)
      }, 1200);
    } else {
      response = genQuickReply(i18n.__('envioProducto.noEncontrado', { firstName: userInfo.firstName }), [{
        title: 'Reintentar',
        payload: 'reintentar'
      }, {
        title: 'Continuar',
        payload: 'continuar'
      }])
    }
    userPSID[sender_psid].flag = 0
  } else if (userPSID[sender_psid].flag == 7) {
    if (userPSID[sender_psid].cedula == received_message.text) {
      if (userPSID[sender_psid].compras.length != 0) {
        response = genText(i18n.__('consultaCompras.mensaje', { firstName: userInfo.firstName }))
        setTimeout(() => {
          userPSID[sender_psid].compras.forEach(compra => {
            console.log(compra)
            response = genGenericTemplate(compra.urlFoto, compra.articulo, compra.precio, [{
              type: 'web_url',
              title: compra.fecha,
              url: compra.urlFoto
            }])
            callSendAPI(sender_psid, response)
          });
        }, 1000);
        setTimeout(() => {
          response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
            title: 'Compras',
            payload: 'compras'
          }, {
            title: 'Consultar envio',
            payload: 'envios'
          }, {
            title: 'Consultar compras',
            payload: 'consultaCompras'
          }, {
            title: 'Factura',
            payload: 'factura'
          }, {
            title: 'Contactar asesor',
            payload: 'asesor'
          }])
          callSendAPI(sender_psid, response)
        }, 2500);
      } else {
        response = genText(i18n.__('consultaCompras.noCompras', { firstName: userInfo.firstName }))
        setTimeout(() => {
          response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
            title: 'Compras',
            payload: 'compras'
          }, {
            title: 'Consultar envio',
            payload: 'envios'
          }, {
            title: 'Consultar compras',
            payload: 'consultaCompras'
          }, {
            title: 'Factura',
            payload: 'factura'
          }, {
            title: 'Contactar asesor',
            payload: 'asesor'
          }])
          callSendAPI(sender_psid, response)
        }, 1000)
      }
    } else {
      response = genText(i18n.__('consultaCompras.cedulaDesconocida', { firstName: userInfo.firstName }))
      setTimeout(() => {
        response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
          title: 'Compras',
          payload: 'compras'
        }, {
          title: 'Consultar envio',
          payload: 'envios'
        }, {
          title: 'Consultar compras',
          payload: 'consultaCompras'
        }, {
          title: 'Factura',
          payload: 'factura'
        }, {
          title: 'Contactar asesor',
          payload: 'asesor'
        }])
        callSendAPI(sender_psid, response)
      }, 1000)
    }
    userPSID[sender_psid].flag = 0
  } else if (userPSID[sender_psid].flag == 8) {
    let userAsesoria = { celular: received_message.text, fbuser: userInfo.firstName }
    response = genText(i18n.__('asesor.contactar', { firstName: userInfo.firstName, numero: userAsesoria.celular }))
    setTimeout(() => {
      response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
        title: 'Compras',
        payload: 'compras'
      }, {
        title: 'Consultar envio',
        payload: 'envios'
      }, {
        title: 'Consultar compras',
        payload: 'consultaCompras'
      }, {
        title: 'Factura',
        payload: 'factura'
      }, {
        title: 'Contactar asesor',
        payload: 'asesor'
      }])
      callSendAPI(sender_psid, response)
      insertAsesoria(userAsesoria)
    }, 2000);
  } else if (userPSID[sender_psid].flag == 9) {
    if (userPSID[sender_psid].compras.find(compra => compra.nOrden == received_message.text)) {
      response = genText('Claro, dentro de las proximas horas te llegara la factura al correo, muchas gracias por comunicarte')
      const nodemailer = require('nodemailer');

      const transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: {
          user: 'cvalenciah@cesde.edu.co',
          pass: 'Cesde2022*'
        }
      });

      let mailOptions = {
        from: 'cvalenciah@cesde.edu.co',
        to: 'vcristobal3@gmail.com',
        subject: 'Parcero, alguien necesita la factura',
        text: `El usuario ${userPSID[sender_psid].nombre} requiere que se le envie la factura del pedido ${received_message.text} al correo ${userPSID[sender_psid].correo}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error.message);
        } else {
          console.log('Email enviado');
        }
      });

      setTimeout(() => {
        response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
          title: 'Compras',
          payload: 'compras'
        }, {
          title: 'Consultar envio',
          payload: 'envios'
        }, {
          title: 'Consultar compras',
          payload: 'consultaCompras'
        }, {
          title: 'Factura',
          payload: 'factura'
        }, {
          title: 'Contactar asesor',
          payload: 'asesor'
        }])
        callSendAPI(sender_psid, response)
      }, 1500);
    } else {
      response = genText('Lo sentimos pero este numero de pedido no existe en nuestra base de datos, o no es un pedido de tu lista de compras.')
      setTimeout(() => {
        response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
          title: 'Compras',
          payload: 'compras'
        }, {
          title: 'Consultar envio',
          payload: 'envios'
        }, {
          title: 'Consultar compras',
          payload: 'consultaCompras'
        }, {
          title: 'Factura',
          payload: 'factura'
        }, {
          title: 'Contactar asesor',
          payload: 'asesor'
        }])
        callSendAPI(sender_psid, response)
      }, 1500);
    }
    userPSID[sender_psid].flag = 0
  } else {
    if (initials.saludos.find(saludo => saludo === received_message.text.toLowerCase())) {
      setTimeout(() => {
        response = genText(i18n.__('bienvenida.welcome', { firstName: userInfo.firstName }))
        callSendAPI(sender_psid, response)
      }, 1000)
      setTimeout(() => {
        response = genText(i18n.__('bienvenida.remember'))
        callSendAPI(sender_psid, response)
      }, 2000)
      setTimeout(() => {
        response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
          title: 'Compras',
          payload: 'compras'
        }, {
          title: 'Consultar envio',
          payload: 'envios'
        }, {
          title: 'Consultar compras',
          payload: 'consultaCompras'
        }, {
          title: 'Factura',
          payload: 'factura'
        }, {
          title: 'Contactar asesor',
          payload: 'asesor'
        }])
        callSendAPI(sender_psid, response)
      }, 3000)
      response = ""
    } else if (initials.peticionesCompra.find(compra => compra === received_message.text.toLowerCase())) {
      setTimeout(() => {
        if (userPSID[sender_psid].psid != undefined && userPSID[sender_psid].psid != null) {
          setTimeout(() => {
            response = genText(i18n.__('compras.client', { firstName: userInfo.firstName }))
            callSendAPI(sender_psid, response)
          }, 1000);
          setTimeout(() => {
            response = genQuickReply(i18n.__('compras.start', { firstName: userInfo.firstName }), [{
              title: 'Tengo algo en mente',
              payload: 'enMente'
            }, {
              title: 'Ver catalogo',
              payload: 'catalogo'
            }])
            callSendAPI(sender_psid, response)
          }, 2000);
        } else {
          response = genText(i18n.__('infoUsuario.sinInfo', { firstName: userInfo.firstName }))
          setTimeout(() => {
            response = genQuickReply(i18n.__('infoUsuario.peticion'), [{
              title: 'Si claro 😀',
              payload: 'si'
            }, {
              title: 'No',
              payload: 'no'
            }])
            callSendAPI(sender_psid, response)
          }, 2000)
        }
      }, 1500)
    } else if (received_message.text.toLowerCase() == 'tengo una pregunta.') {
      response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
        title: 'Compras',
        payload: 'compras'
      }, {
        title: 'Consultar envio',
        payload: 'envios'
      }, {
        title: 'Consultar compras',
        payload: 'consultaCompras'
      }, {
        title: 'Factura',
        payload: 'factura'
      }, {
        title: 'Contactar asesor',
        payload: 'asesor'
      }])
    } else {
      if (detectorDeInsultos(received_message.text)) {
        response = genText(i18n.__('respuestaNegativa'))
        setTimeout(() => {
          response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
            title: 'Compras',
            payload: 'compras'
          }, {
            title: 'Consultar envio',
            payload: 'envios'
          }, {
            title: 'Consultar compras',
            payload: 'consultaCompras'
          }, {
            title: 'Factura',
            payload: 'factura'
          }, {
            title: 'Contactar asesor',
            payload: 'asesor'
          }])
          callSendAPI(sender_psid, response)
        }, 700);
      } else {
        setTimeout(() => {
          response = genText(i18n.__('desconocido.warning', { userMessage: received_message.text }))
          callSendAPI(sender_psid, response)
        }, 1000)
        setTimeout(() => {
          response = genQuickReply(i18n.__('bienvenida.end', { firstName: userInfo.firstName }), [{
            title: 'Compras',
            payload: 'compras'
          }, {
            title: 'Consultar envio',
            payload: 'envios'
          }, {
            title: 'Consultar compras',
            payload: 'consultaCompras'
          }, {
            title: 'Factura',
            payload: 'factura'
          }, {
            title: 'Contactar asesor',
            payload: 'asesor'
          }])
          callSendAPI(sender_psid, response)
        }, 2000)
      }
    }
  }
  callSendAPI(sender_psid, response)
}

// Consultar datos del usuario
function consulta(psid) {
  if (userPSID[psid] == undefined || userPSID[psid] == null) {
    userPSID[psid] = {}
  }
  if (userPSID[psid].compras == undefined || userPSID[psid].compras == null) {
    userPSID[psid].compras = []
  }
  let cedula
  let conexion = new Connection({
    server: 'localhost',
    authentication: {
      type: 'default',
      options: {
        userName: 'cvalenciah',
        password: 'cris123.'
      }
    },
    options: {
      database: 'chatbotTempTech',
      trustServerCertificate: true
    }
  })

  conexion.connect((err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('conectado')
    }
  })

  setTimeout(() => {
    const request = new Request(`select * from usuarios where psid = ${psid}`, function (err) {
      if (err) {
        console.log(err);
      }
    });
    var result = "";


    request.on('row', function (columns) {
      let user = {}
      columns.forEach(column => {
        user[column.metadata.colName] = column.value
      });
      cedula = user.cedula
      if (userPSID[psid].psid == undefined || userPSID[psid].psid == null) {
        userPSID[psid] = user
      }
    });

    request.on("requestCompleted", function (rowCount, more) {
      setTimeout(() => {
        const request2 = new Request(`select top 5 * from compras where cedula = '${cedula}'`, function (err) {
          if (err) {
            console.log(err);
          }
        });
        var result = "";
        userPSID[psid].compras = []
        request2.on('row', function (columns) {
          let compra = {}
          columns.forEach(column => {
            compra[column.metadata.colName] = column.value
          });
          userPSID[psid].compras.push(compra)
        });

        request2.on('requestCompleted', (rowCount, more) => {
          setTimeout(() => {
            const request2 = new Request(`select * from estados where psid = '${psid}'`, function (err) {
              if (err) {
                console.log(err);
              }
            });
            var result = "";
            request2.on('row', function (columns) {
              let estado = {}
              columns.forEach(column => {
                estado[column.metadata.colName] = column.value
              });
              userPSID[psid].estado = estado
            });

            request2.on('requestCompleted', (rowCount, more) => {
              conexion.close()
            })
            conexion.execSql(request2)
          }, 1000)
        })
        conexion.execSql(request2)
      }, 1500)
    });
    conexion.execSql(request)
  }, 2000);
}

// Insercion de datos de usuario
function insert(userData) {
  let conexion = new Connection({
    server: 'localhost',
    authentication: {
      type: 'default',
      options: {
        userName: 'cvalenciah',
        password: 'cris123.'
      }
    },
    options: {
      database: 'chatbotTempTech',
      trustServerCertificate: true
    }
  })

  conexion.connect((err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('conectado')
    }
  })
  setTimeout(() => {
    const request = new Request("insert into usuarios (psid, cedula, nombre, cel, correo, fbuser) values (@psid, @cedula, @nombre, @cel, @correo, @fbuser)", function (err) {
      if (err) {
        console.log(err);
      }
    });
    request.addParameter('psid', TYPES.VarChar, userData.psid);
    request.addParameter('cedula', TYPES.VarChar, userData.cedula);
    request.addParameter('nombre', TYPES.VarChar, userData.nombre);
    request.addParameter('cel', TYPES.VarChar, userData.cel);
    request.addParameter('correo', TYPES.VarChar, userData.correo);
    request.addParameter('fbuser', TYPES.VarChar, userData.fbuser);
    request.on('row', function (columns) {
      columns.forEach(function (column) {
        if (column.value === null) {
          console.log('NULL');
        } else {
          console.log("Product id of inserted item is " + column.value);
        }
      });
    });

    // Close the connection after the final event emitted by the request, after the callback passes
    request.on("requestCompleted", function (rowCount, more) {
      conexion.close
    });
    conexion.execSql(request);
  }, 2500);
}

// Insercion para el contacto de asesor
function insertAsesoria(userData) {
  let conexion = new Connection({
    server: 'localhost',
    authentication: {
      type: 'default',
      options: {
        userName: 'cvalenciah',
        password: 'cris123.'
      }
    },
    options: {
      database: 'chatbotTempTech',
      trustServerCertificate: true
    }
  })

  conexion.connect((err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('conectado')
    }
  })

  setTimeout(() => {
    console.log(userData)
    const request = new Request("INSERT INTO asesoria VALUES (@fbuser, @celular);", function (err) {
      if (err) {
        console.log(err);
      }
    });
    request.addParameter('celular', TYPES.VarChar, userData.celular);
    request.addParameter('fbuser', TYPES.VarChar, userData.fbuser);
    request.on('row', function (columns) {
      columns.forEach(function (column) {
        if (column.value === null) {
          console.log('NULL');
        } else {
          console.log("Product id of inserted item is " + column.value);
        }
      });
    });

    // Close the connection after the final event emitted by the request, after the callback passes
    request.on("requestCompleted", function (rowCount, more) {
      conexion.close
    });
    conexion.execSql(request);
  }, 3500);
}

// Actualizacion de estados
function updateEstado(psid, estado) {
  let conexion = new Connection({
    server: 'localhost',
    authentication: {
      type: 'default',
      options: {
        userName: 'cvalenciah',
        password: 'cris123.'
      }
    },
    options: {
      database: 'chatbotTempTech',
      trustServerCertificate: true
    }
  })

  conexion.connect((err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('conectado')
    }
  })

  setTimeout(() => {
    const request = new Request("insert into estados values (@psid, @estado, @fecha)", function (err) {
      if (err) {
        console.log(err);
      }
    });
    request.addParameter('psid', TYPES.VarChar, psid);
    request.addParameter('estado', TYPES.VarChar, estado);
    request.addParameter('fecha', TYPES.Date, new Date());
    request.on('row', function (columns) {
      columns.forEach(function (column) {
        if (column.value === null) {
          console.log('NULL');
        } else {
          console.log("Product id of inserted item is " + column.value);
        }
      });
    });

    // Close the connection after the final event emitted by the request, after the callback passes
    request.on("requestCompleted", function (rowCount, more) {
      conexion.close
    });
    conexion.execSql(request);
  }, 3500);
}


//Se realiza el exporte de las funciones para el correcto funcionamiento del bot
module.exports = { handleMessage, handlePostback, handleQuickReply, repetir, updateEstado, entrenamiento }