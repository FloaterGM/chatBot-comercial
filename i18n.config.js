// Importacion de librerias
const i18n = require("i18n"),
  path = require("path");

// Configuracion del adaptador de idiomas
i18n.configure({
  locales: [
    "es_ES",
  ],
  defaultLocale: "es_ES",
  directory: path.join(__dirname, "locales"),
  objectNotation: true,
  api: {
    __: "translate",
    __n: "translateN"
  }
});

//Se exporta para uso en otros servicios
module.exports = i18n;
