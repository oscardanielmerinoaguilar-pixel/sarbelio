/**
 * ==============================================================================
 * SISTEMA INSTITUCIONAL DE CONTROL DE ASISTENCIA QR — GOOGLE SHEETS CONNECTOR
 * Instituto Nacional Dr. Sarbelio Navarrete (San Vicente, El Salvador)
 * ==============================================================================
 * 
 * INSTRUCCIONES DE INSTALACIÓN (3 PASOS):
 * 1. Abra su Google Sheets (o cree una nueva hoja en https://sheets.new).
 * 2. En el menú superior vaya a: Extensiones > Apps Script.
 * 3. Borre el código que aparezca, pegue TODO este archivo y haga clic en:
 *    "Implementar" (botón azul arriba a la derecha) > "Nueva implementación"
 *    - Tipo: Aplicación web
 *    - Descripción: Conector Asistencias QR Sarbelio
 *    - Ejecutar como: Yo (tu cuenta de Google)
 *    - Quién tiene acceso: Cualquier persona (Anyone)
 *    Haga clic en "Implementar", autorice los permisos y COPIE la URL generada.
 *    Pegue esa URL en el sistema web institucional.
 * ==============================================================================
 */

// Nombre de la hoja maestra donde se guardan todas las asistencias cronológicas
var MASTER_SHEET_NAME = "📊 Todas_Las_Asistencias";
var RESUMEN_SHEET_NAME = "📈 Resumen_Por_Grado_Y_Maestro";

/**
 * Endpoint para solicitudes POST (Fetch desde el escáner QR o servidor)
 */
function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : "";
    var data = {};
    if (contents) {
      try {
        data = JSON.parse(contents);
      } catch (err) {
        data = parseQueryString(contents);
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    return handleRequest(data);
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Error al procesar solicitud POST: " + error.toString()
    });
  }
}

/**
 * Endpoint para solicitudes GET (Pruebas directas de navegador o fallback)
 */
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    return handleRequest(params);
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Error al procesar solicitud GET: " + error.toString()
    });
  }
}

/**
 * Manejador unificado de acciones
 */
function handleRequest(data) {
  var action = data.action || "registrar_asistencia";

  // Acción 1: Ping / Prueba de Conexión
  if (action === "ping" || action === "test") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return createJsonResponse({
      status: "success",
      message: "¡Conexión establecida exitosamente con Google Sheets!",
      sheet_name: ss.getName(),
      sheet_url: ss.getUrl(),
      timestamp: new Date().toISOString()
    });
  }

  // Acción 2: Sincronización Masiva / Batch
  if (action === "sync_batch" && Array.isArray(data.registros)) {
    var results = [];
    for (var i = 0; i < data.registros.length; i++) {
      results.push(guardarFilaAsistencia(data.registros[i]));
    }
    return createJsonResponse({
      status: "success",
      message: "Se sincronizaron " + results.length + " asistencias exitosamente.",
      total: results.length
    });
  }

  // Acción 3: Registrar Asistencia Individual por Escaneo QR (Acción Principal)
  var resultado = guardarFilaAsistencia(data);
  return createJsonResponse(resultado);
}

/**
 * Función que guarda la asistencia tanto en la Hoja Maestra como en la Hoja por Grado/Sección
 */
function guardarFilaAsistencia(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date();
  
  // Normalizar datos de entrada
  var fecha = d.fecha || Utilities.formatDate(now, "GMT-6", "yyyy-MM-dd");
  var hora = d.hora || d.hora_marcaje || Utilities.formatDate(now, "GMT-6", "hh:mm:ss a");
  var timestamp = Utilities.formatDate(now, "GMT-6", "yyyy-MM-dd HH:mm:ss");
  
  var nie = String(d.nie || "").trim();
  var estudiante = d.estudiante || d.nombre_completo || (d.nombres ? (d.nombres + " " + (d.apellidos || "")) : "Estudiante");
  var anio = d.anio_bachillerato || d.anio || "Primer Año";
  var bachillerato = d.bachillerato || d.grado || "General";
  var seccion = d.seccion || d.seccion_letra || "A";
  var maestro = d.maestro || d.docente_orientador || d.registrado_por || "Docente Encargado";
  var materia = d.materia || d.especialidad || "Jornada General";
  var estado = d.estado || "Presente";
  var metodo = d.metodo || d.metodo_registro || "Escaneo QR Estudiante";
  var observaciones = d.observaciones || d.motivo || "Marcaje institucional por código QR";

  // 1. Guardar en Hoja Maestra General
  var masterSheet = obtenerOCrearHojaMaestra(ss);
  
  // Verificar duplicados en el mismo día para el mismo estudiante
  var duplicadoIndex = buscarFilaDuplicada(masterSheet, nie, fecha, materia);
  var rowData = [
    timestamp,
    fecha,
    hora,
    nie,
    estudiante,
    anio,
    bachillerato,
    seccion,
    maestro,
    materia,
    estado,
    metodo,
    observaciones
  ];

  if (duplicadoIndex > 0) {
    // Si ya existe hoy, actualizar estado y hora
    masterSheet.getRange(duplicadoIndex, 3).setValue(hora);
    masterSheet.getRange(duplicadoIndex, 11).setValue(estado);
    masterSheet.getRange(duplicadoIndex, 12).setValue(metodo);
    aplicarColorEstado(masterSheet.getRange(duplicadoIndex, 11), estado);
  } else {
    // Insertar nueva fila
    masterSheet.appendRow(rowData);
    var lastRow = masterSheet.getLastRow();
    aplicarEstiloFila(masterSheet, lastRow, estado);
  }

  // 2. Guardar en Hoja Organizada por Grado, Año y Sección (Ejemplo: "1° General - Sec A")
  var nombreHojaGrupo = normalizarNombrePestana(anio, bachillerato, seccion);
  var grupoSheet = obtenerOCrearHojaGrupo(ss, nombreHojaGrupo, anio, bachillerato, seccion, maestro);
  
  var duplicadoGrupo = buscarFilaDuplicada(grupoSheet, nie, fecha, materia);
  if (duplicadoGrupo > 0) {
    grupoSheet.getRange(duplicadoGrupo, 3).setValue(hora);
    grupoSheet.getRange(duplicadoGrupo, 9).setValue(estado);
    aplicarColorEstado(grupoSheet.getRange(duplicadoGrupo, 9), estado);
  } else {
    grupoSheet.appendRow([
      timestamp,
      fecha,
      hora,
      nie,
      estudiante,
      maestro,
      materia,
      metodo,
      estado,
      observaciones
    ]);
    var lastRowGrupo = grupoSheet.getLastRow();
    aplicarColorEstado(grupoSheet.getRange(lastRowGrupo, 9), estado);
  }

  return {
    status: "success",
    message: "Asistencia de " + estudiante + " (NIE: " + nie + ") registrada exitosamente en Google Sheets.",
    datos: {
      nie: nie,
      estudiante: estudiante,
      fecha: fecha,
      hora: hora,
      anio: anio,
      bachillerato: bachillerato,
      seccion: seccion,
      maestro: maestro,
      estado: estado,
      hoja_grupo: nombreHojaGrupo
    }
  };
}

/**
 * Obtener o Inicializar la Hoja Maestra General
 */
function obtenerOCrearHojaMaestra(ss) {
  var sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MASTER_SHEET_NAME, 0);
    var encabezados = [
      "Marca Temporal",
      "Fecha (Día)",
      "Hora Marcaje",
      "NIE Alumno",
      "Nombre del Estudiante",
      "Año de Estudio",
      "Grado / Especialidad",
      "Sección",
      "Docente / Maestro",
      "Materia / Asignatura",
      "Estado de Asistencia",
      "Método de Marcaje",
      "Observaciones"
    ];

    sheet.appendRow(encabezados);
    formatearEncabezado(sheet, encabezados.length, "#1e3a8a");
  }
  return sheet;
}

/**
 * Obtener o Inicializar la Hoja organizada por Grado y Sección
 */
function obtenerOCrearHojaGrupo(ss, nombreHoja, anio, bach, sec, maestro) {
  var sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) {
    sheet = ss.insertSheet(nombreHoja);
    var encabezados = [
      "Marca Temporal",
      "Fecha (Día)",
      "Hora Marcaje",
      "NIE",
      "Estudiante",
      "Docente Encargado",
      "Materia",
      "Método",
      "Estado de Asistencia",
      "Observación"
    ];

    sheet.appendRow(encabezados);
    formatearEncabezado(sheet, encabezados.length, "#065f46"); // Verde elegante para grado
  }
  return sheet;
}

/**
 * Limpia y normaliza el nombre de la pestaña (máx 100 caracteres permitidos por Google)
 */
function normalizarNombrePestana(anio, bachillerato, seccion) {
  var anioCorto = "1°";
  if (anio.indexOf("Segundo") !== -1 || anio.indexOf("2") !== -1) anioCorto = "2°";
  if (anio.indexOf("Tercer") !== -1 || anio.indexOf("3") !== -1) anioCorto = "3°";

  var bachCorto = bachillerato;
  if (bachillerato.indexOf("Software") !== -1 || bachillerato.indexOf("ITSI") !== -1) bachCorto = "ITSI";
  else if (bachillerato.indexOf("Contable") !== -1) bachCorto = "Contable";
  else if (bachillerato.indexOf("Salud") !== -1) bachCorto = "Salud";
  else if (bachillerato.indexOf("General") !== -1) bachCorto = "General";

  var secLimpia = String(seccion).replace("Sección", "").trim();
  return (anioCorto + " " + bachCorto + " - Sec " + secLimpia).substring(0, 50);
}

/**
 * Da formato profesional al encabezado de la hoja
 */
function formatearEncabezado(sheet, numColumnas, bgColor) {
  var headerRange = sheet.getRange(1, 1, 1, numColumnas);
  headerRange.setBackground(bgColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);

  // Auto ajustar anchos
  for (var c = 1; c <= numColumnas; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * Formatea una fila recién agregada
 */
function aplicarEstiloFila(sheet, rowIndex, estado) {
  sheet.setRowHeight(rowIndex, 24);
  var celdaEstado = sheet.getRange(rowIndex, 11);
  aplicarColorEstado(celdaEstado, estado);
}

/**
 * Aplica colores semáforo institucionales al estado
 */
function aplicarColorEstado(celda, estado) {
  var est = String(estado).toLowerCase();
  celda.setFontWeight("bold");
  celda.setHorizontalAlignment("center");

  if (est.indexOf("presente") !== -1) {
    celda.setBackground("#dcfce7"); // Verde suave
    celda.setFontColor("#15803d");
  } else if (est.indexOf("tardanza") !== -1) {
    celda.setBackground("#fef3c7"); // Amarillo / Ámbar suave
    celda.setFontColor("#b45309");
  } else if (est.indexOf("justificada") !== -1) {
    celda.setBackground("#e0f2fe"); // Celeste suave
    celda.setFontColor("#0369a1");
  } else {
    celda.setBackground("#fee2e2"); // Rojo suave
    celda.setFontColor("#b91c1c");
  }
}

/**
 * Busca si ya existe un registro previo de este alumno hoy
 */
function buscarFilaDuplicada(sheet, nie, fecha, materia) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  for (var i = 0; i < data.length; i++) {
    var rowFecha = String(data[i][1]).trim();
    var rowNie = String(data[i][3]).trim();
    if (rowNie === String(nie).trim() && rowFecha === String(fecha).trim()) {
      return i + 2; // Índice 1-based de la fila en Google Sheets
    }
  }
  return -1;
}

/**
 * Parsea query strings en caso de recibir datos urlencoded
 */
function parseQueryString(qs) {
  var params = {};
  var pairs = qs.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return params;
}

/**
 * Genera salida JSON compatible con CORS
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
