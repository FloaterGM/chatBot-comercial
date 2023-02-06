
//Generacion de plantillas usado para la generacion de mensajes


//Se genera un mensaje meramente de texto
function genText(text) {
  let response = {
    text: text
  }

  return response
}

function genStart(text) {
  let response = [
    {
      locale: 'default',
      text: text
    }
  ]

  return response
}

//Se genera una plantilla de tipo generica (Imagen, titulo, subtitulo y maximo de 2 botones para realizacion de acciones)
function genGenericTemplate(image_url, title, subtitle, buttons) {
  let response = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: [
          {
            title: title,
            subtitle: subtitle,
            image_url: image_url,
            buttons: buttons
          }
        ]
      }
    }
  };
  return response;
}

//Se genera el menu de interacciones rapidas para el chat
function genQuickReply(text, quickReplies) {
  let response = {
    text: text,
    quick_replies: []
  }

  for (let quickReply of quickReplies) {
    response['quick_replies'].push({
      content_type: "text",
      title: quickReply['title'],
      payload: quickReply['payload']
    })
  }
  return response;
}

//Se generan botones para interacciones del usuario
function genButtons(text, buttons){
  let response = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": text,
        "buttons": []
      }
    }
  }

  for (let button of buttons){
    response['attachment'].payload.buttons.push({
      type: button['type'],
      url: button['url'],
      title: button['title']
    })
  }
}

//Se realiza el exporte de todas las funciones para su uso en otros servicios
module.exports = { genText, genQuickReply, genStart, genButtons, genGenericTemplate }