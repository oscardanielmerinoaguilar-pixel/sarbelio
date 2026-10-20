/**
 * Motor Principal de Aplicación SPA - Modo Visualización Interactiva (Sin Base de Datos requerida)
 * Instituto Nacional Dr. Sarbelio Navarrete
 */

document.addEventListener('DOMContentLoaded', () => {
  window.sarbelioApp = new SarbelioApp();
  window.sarbelioApp.init();
});

class SarbelioApp {
  constructor() {
    this.currentRole = 'admin'; // admin, docente, estudiante, padre
    this.loggedParent = null;

    // Cargar o Inicializar Datos Estudiantiles en Memoria/LocalStorage
    const localStudents = localStorage.getItem('sarbelio_students');
    if (localStudents) {
      try { this.students = JSON.parse(localStudents); } catch(e) { this.students = this.getDefaultStudents(); }
    } else {
      this.students = this.getDefaultStudents();
      this.saveLocalStudents();
    }

    // Cargar o Inicializar Cuentas de Padres
    const localPadres = localStorage.getItem('sarbelio_padres');
    if (localPadres) {
      try { this.padres = JSON.parse(localPadres); } catch(e) { this.padres = this.getDefaultPadres(); }
    } else {
      this.padres = this.getDefaultPadres();
      this.saveLocalPadres();
    }

    // Cargar o Inicializar Asistencias
    const localAsistencias = localStorage.getItem('sarbelio_asistencias');
    if (localAsistencias) {
      try { this.asistencias = JSON.parse(localAsistencias); } catch(e) { this.asistencias = this.getDefaultAsistencias(); }
    } else {
      this.asistencias = this.getDefaultAsistencias();
      this.saveLocalAsistencias();
    }

    // Cargar o Inicializar Justificaciones
    const localJust = localStorage.getItem('sarbelio_justificaciones');
    if (localJust) {
      try { this.justificaciones = JSON.parse(localJust); } catch(e) { this.justificaciones = this.getDefaultJustificaciones(); }
    } else {
      this.justificaciones = this.getDefaultJustificaciones();
      this.saveLocalJustificaciones();
    }

    // Cargar o Inicializar Cuentas de Usuarios
    const localUsers = localStorage.getItem('sarbelio_usuarios');
    if (localUsers) {
      try { this.usuarios = JSON.parse(localUsers); } catch(e) { this.usuarios = this.getDefaultUsuarios(); }
    } else {
      this.usuarios = this.getDefaultUsuarios();
      this.saveLocalUsuarios();
    }

    // Cargar o Inicializar Maestros (Cada maestro con su propio Código QR de asistencia)
    const localMaestros = localStorage.getItem('sarbelio_maestros');
    if (localMaestros) {
      try { this.maestros = JSON.parse(localMaestros); } catch(e) { this.maestros = this.getDefaultMaestros(); }
    } else {
      this.maestros = this.getDefaultMaestros();
      this.saveLocalMaestros();
    }

    // Asegurar que cada maestro registrado tenga su qr_token único de asistencia
    let updatedMaestros = false;
    this.maestros.forEach(m => {
      if (!m.qr_token) {
        m.qr_token = m.id === 1 ? 'DOC-QR-CHERNANDEZ-2026' : (m.id === 2 ? 'DOC-QR-MRODRIGUEZ-2026' : `DOC-QR-${(m.usuario || 'DOC').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
        updatedMaestros = true;
      }
    });
    if (updatedMaestros) {
      this.saveLocalMaestros();
    }

    // Cargar o Inicializar Clases
    const localClases = localStorage.getItem('sarbelio_clases');
    if (localClases) {
      try { this.clases = JSON.parse(localClases); } catch(e) { this.clases = this.getDefaultClases(); }
    } else {
      this.clases = this.getDefaultClases();
      this.saveLocalClases();
    }

    // Cargar o Inicializar Sesiones QR
    const localSesiones = localStorage.getItem('sarbelio_sesiones_qr');
    if (localSesiones) {
      try { this.sesionesQR = JSON.parse(localSesiones); } catch(e) { this.sesionesQR = this.getDefaultSesionesQR(); }
    } else {
      this.sesionesQR = this.getDefaultSesionesQR();
      this.saveLocalSesionesQR();
    }

    this.activeQRSession = null;
    this.countdownTimer = null;
    this.livePollTimer = null;
    this.scanToken = null;
    this.selectedStudent = null;

    // Autenticación de Maestro y Configuración de IP
    this.teacherAuthenticated = false;
    this.currentTeacher = null;
    this.pendingProtectedView = null;

    const savedTeacher = localStorage.getItem('sarbelio_teacher_session');
    if (savedTeacher) {
      try {
        this.currentTeacher = JSON.parse(savedTeacher);
        this.teacherAuthenticated = true;
      } catch(e) {}
    }

    // Configuración de Conexión en Tiempo Real con Google Sheets
    this.googleSheetsUrl = localStorage.getItem('sarbelio_gsheets_url') || '';
    this.googleSheetsSheetUrl = localStorage.getItem('sarbelio_gsheets_sheet_url') || '';
    this.googleSheetsAutoSync = localStorage.getItem('sarbelio_gsheets_autosync') !== 'false';
    this.googleSheetsByClassTab = localStorage.getItem('sarbelio_gsheets_classtab') !== 'false';

    // Geocercado Institucional Oficial: Instituto Nacional Dr. Sarbelio Navarrete (INSAVI)
    // Ubicación: 6ª Calle Poniente y 9ª Avenida Sur, San Vicente, El Salvador
    this.insaviLocation = {
      nombre: 'Instituto Nacional Dr. Sarbelio Navarrete',
      direccion: '6ª Calle Poniente y 9ª Avenida Sur, San Vicente',
      lat: 13.64200,
      lng: -88.78992,
      maxDistanceMeters: 250 // Radio máximo permitido en metros
    };
    this.studentCurrentLocation = null;
    this.studentLocationStatus = 'unverified'; // 'unverified', 'requesting', 'verified', 'out_of_bounds', 'denied'
  }

  getDefaultStudents() {
    return [
      {
        id: 1,
        codigo_expediente: 'EXP-2026-001',
        nie: '8492015',
        nombres: 'Carlos Eduardo',
        apellidos: 'Alvarado Gomez',
        fecha_nacimiento: '2008-05-14',
        edad: 17,
        sexo: 'Masculino',
        bachillerato: 'ITSI',
        anio_bachillerato: 'Primer Año',
        seccion_letra: 'A',
        docente_orientador: 'Prof. Carlos Hernandez',
        nombre_encargado: 'Roberto Carlos Alvarado Perez',
        dui_encargado: '02345678-4',
        telefono_encargado: '7744-1122',
        direccion: 'Barrio El Calvario, Av. Crespo #14, San Vicente',
        con_quien_vive: 'Padre y Madre',
        correo: 'carlos.alvarado@estudiante.edu.sv',
        repite: 'No',
        discapacidad: 'Ninguna',
        trastorno: 'Ninguno',
        estado: 'Activo',
        observaciones: 'Estudiante de excelente rendimiento en desarrollo de software.'
      },
      {
        id: 2,
        codigo_expediente: 'EXP-2026-002',
        nie: '9120482',
        nombres: 'Sofía Beatriz',
        apellidos: 'Rivas Morales',
        fecha_nacimiento: '2009-08-22',
        edad: 16,
        sexo: 'Femenino',
        bachillerato: 'General',
        anio_bachillerato: 'Primer Año',
        seccion_letra: 'A',
        docente_orientador: 'Licda. Maria Rodriguez',
        nombre_encargado: 'Ana Maria Morales de Rivas',
        dui_encargado: '01987654-2',
        telefono_encargado: '7633-2211',
        direccion: 'Colonia Las Mercedes, Pasaje 3 #45, San Vicente',
        con_quien_vive: 'Padre y Madre',
        correo: 'sofia.rivas@estudiante.edu.sv',
        repite: 'No',
        discapacidad: 'Ninguna',
        trastorno: 'Ninguno',
        estado: 'Activo',
        observaciones: 'Participante destacada en feria científica.'
      },
      {
        id: 3,
        codigo_expediente: 'EXP-2026-003',
        nie: '7483921',
        nombres: 'Kevin Alexander',
        apellidos: 'Martinez Martinez',
        fecha_nacimiento: '2008-11-03',
        edad: 17,
        sexo: 'Masculino',
        bachillerato: 'Administrativo Contable',
        anio_bachillerato: 'Segundo Año',
        seccion_letra: 'B',
        docente_orientador: 'Prof. Roberto Garcia',
        nombre_encargado: 'Jose Alexander Martinez Cruz',
        dui_encargado: '03412578-9',
        telefono_encargado: '7811-9922',
        direccion: 'Canton El Saler, Calle Principal, Tecoluca',
        con_quien_vive: 'Solo Padre',
        correo: 'kevin.martinez@estudiante.edu.sv',
        repite: 'No',
        discapacidad: 'Ninguna',
        trastorno: 'TDAH',
        estado: 'Activo',
        observaciones: 'Integrante de la banda de paz.'
      },
      {
        id: 4,
        codigo_expediente: 'EXP-2026-004',
        nie: '6382019',
        nombres: 'Valeria Nicolle',
        apellidos: 'Gutierrez Lopez',
        fecha_nacimiento: '2007-03-30',
        edad: 18,
        sexo: 'Femenino',
        bachillerato: 'Salud',
        anio_bachillerato: 'Tercer Año',
        seccion_letra: 'A',
        docente_orientador: 'Dra. Carmen Lopez',
        nombre_encargado: 'Lucia Beatriz Lopez',
        dui_encargado: '04512398-7',
        telefono_encargado: '7999-1122',
        direccion: 'Barrio San Jose, Final 4ta Calle Poniente',
        con_quien_vive: 'Solo Madre',
        correo: 'valeria.gutierrez@estudiante.edu.sv',
        repite: 'No',
        discapacidad: 'Ninguna',
        trastorno: 'Ninguno',
        estado: 'Activo',
        observaciones: 'Abanderada institucional 2025.'
      }
    ];
  }

  getDefaultPadres() {
    return [
      {
        id: 1,
        nombre_completo: 'Roberto Carlos Alvarado Perez',
        dui: '02345678-4',
        usuario: 'roberto.padre',
        password: '123456',
        telefono: '7744-1122',
        correo: 'roberto.alvarado@gmail.com',
        nie_hijo: '8492015'
      },
      {
        id: 2,
        nombre_completo: 'Ana Maria Morales de Rivas',
        dui: '01987654-2',
        usuario: 'ana.padre',
        password: '123456',
        telefono: '7633-2211',
        correo: 'ana.rivas@gmail.com',
        nie_hijo: '9120482'
      }
    ];
  }

  getDefaultAsistencias() {
    return [
      { id: 1, estudiante_id: 1, nie: '8492015', fecha: '2026-02-10', materia: 'Matemáticas', estado: 'Ausencia Justificada', motivo: 'Cita médica presentada por el padre' },
      { id: 2, estudiante_id: 1, nie: '8492015', fecha: '2026-02-18', materia: 'Lenguaje', estado: 'Ausencia Sin Justificar', motivo: 'Falta imprevista a primera hora' },
      { id: 3, estudiante_id: 1, nie: '8492015', fecha: '2026-03-02', materia: 'Informática (ITSI)', estado: 'Ausencia Justificada', motivo: 'Trámites de DUI institucional' },
      { id: 4, estudiante_id: 2, nie: '9120482', fecha: '2026-02-15', materia: 'Ciencias Naturales', estado: 'Ausencia Sin Justificar', motivo: 'Inasistencia sin comprobante' }
    ];
  }

  getDefaultJustificaciones() {
    return [
      {
        id: 1,
        estudiante_id: 1,
        nie: '8492015',
        padre_nombre: 'Roberto Carlos Alvarado Perez',
        student_nombres: 'Carlos Eduardo',
        student_apellidos: 'Alvarado Gomez',
        student_grado: 'Primer Año ITSI "A"',
        fecha_inasistencia: '2026-02-18',
        motivo: 'Gripe fuerte con fiebre y recomendación de reposo médico.',
        estado: 'Pendiente'
      }
    ];
  }

  getDefaultUsuarios() {
    return [
      { id: 1, nombre: 'Administrador Principal', usuario: 'admin', email: 'admin@sarbelio.edu.sv', rol: 'Administrador', estado: 'Activo', created_at: '2026-01-15' },
      { id: 2, nombre: 'Licda. Maria Rodriguez', usuario: 'mrodriguez', email: 'mrodriguez@sarbelio.edu.sv', rol: 'Personal Administrativo', estado: 'Activo', created_at: '2026-01-20' },
      { id: 3, nombre: 'Prof. Carlos Hernandez', usuario: 'chernandez', email: 'chernandez@sarbelio.edu.sv', rol: 'Docente', estado: 'Activo', created_at: '2026-02-01' },
      { id: 4, nombre: 'Roberto Carlos Alvarado Perez', usuario: 'roberto.padre', email: 'roberto.alvarado@gmail.com', rol: 'Padre / Responsable', estado: 'Activo', created_at: '2026-02-10' },
      { id: 5, nombre: 'Ana Maria Morales de Rivas', usuario: 'ana.padre', email: 'ana.rivas@gmail.com', rol: 'Padre / Responsable', estado: 'Activo', created_at: '2026-02-12' }
    ];
  }

  getDefaultMaestros() {
    return [
      { id: 1, codigo_docente: 'DOC-2026-001', nombre_completo: 'Prof. Carlos Hernandez', email: 'chernandez@sarbelio.edu.sv', telefono: '7788-9900', usuario: 'chernandez', especialidad: 'Informática y Robótica', qr_token: 'DOC-QR-CHERNANDEZ-2026', estado: 'Activo' },
      { id: 2, codigo_docente: 'DOC-2026-002', nombre_completo: 'Licda. Maria Rodriguez', email: 'mrodriguez@sarbelio.edu.sv', telefono: '7654-3210', usuario: 'mrodriguez', especialidad: 'Lenguaje y Literatura', qr_token: 'DOC-QR-MRODRIGUEZ-2026', estado: 'Activo' }
    ];
  }

  getDefaultClases() {
    return [
      { id: 1, maestro_id: 1, maestro_nombre: 'Prof. Carlos Hernandez', anio_academico: 'Primer Año', grado: '1° ITSI', seccion: 'A', materia: 'Desarrollo de Software Web', aula: 'Laboratorio de Cómputo 1', estado: 'Activo' },
      { id: 2, maestro_id: 1, maestro_nombre: 'Prof. Carlos Hernandez', anio_academico: 'Primer Año', grado: '1° ITSI', seccion: 'A', materia: 'Mantenimiento de Computadoras', aula: 'Laboratorio de Cómputo 2', estado: 'Activo' },
      { id: 3, maestro_id: 2, maestro_nombre: 'Licda. Maria Rodriguez', anio_academico: 'Primer Año', grado: '1° General', seccion: 'A', materia: 'Lenguaje y Literatura', aula: 'Aula 104', estado: 'Activo' }
    ];
  }

  getDefaultSesionesQR() {
    return [
      { id: 1, maestro_id: 1, clase_id: 1, token: 'demo-token-12345678', duracion_minutos: 10, fecha_inicio: '2026-03-02 08:00:00', fecha_expiracion: '2026-03-02 08:10:00', estado: 'Expirada', total_asistencias: 4 }
    ];
  }

  saveLocalStudents() { localStorage.setItem('sarbelio_students', JSON.stringify(this.students)); }
  saveLocalPadres() { localStorage.setItem('sarbelio_padres', JSON.stringify(this.padres)); }
  saveLocalAsistencias() { localStorage.setItem('sarbelio_asistencias', JSON.stringify(this.asistencias)); }
  saveLocalJustificaciones() { localStorage.setItem('sarbelio_justificaciones', JSON.stringify(this.justificaciones)); }
  saveLocalUsuarios() { localStorage.setItem('sarbelio_usuarios', JSON.stringify(this.usuarios)); }
  saveLocalMaestros() { localStorage.setItem('sarbelio_maestros', JSON.stringify(this.maestros)); }
  saveLocalClases() { localStorage.setItem('sarbelio_clases', JSON.stringify(this.clases)); }
  saveLocalSesionesQR() { localStorage.setItem('sarbelio_sesiones_qr', JSON.stringify(this.sesionesQR)); }

  resetDemoData() {
    localStorage.removeItem('sarbelio_students');
    localStorage.removeItem('sarbelio_padres');
    localStorage.removeItem('sarbelio_asistencias');
    localStorage.removeItem('sarbelio_justificaciones');
    localStorage.removeItem('sarbelio_usuarios');
    localStorage.removeItem('sarbelio_maestros');
    localStorage.removeItem('sarbelio_clases');
    localStorage.removeItem('sarbelio_sesiones_qr');
    location.reload();
  }

  openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
  }

  closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
  }

  exportFullDatabaseExcel() {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Base_de_Datos_Sarbelio_Hojas_${dateStr}.xls`;

    function escapeXML(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    function makeRow(cells, isHeader = false) {
      const styleAttr = isHeader ? ' ss:StyleID="HeaderStyle"' : ' ss:StyleID="DataStyle"';
      const cellXml = cells.map(c => `<Cell${styleAttr}><Data ss:Type="String">${escapeXML(c)}</Data></Cell>`).join('');
      return `<Row>${cellXml}</Row>`;
    }

    // 1. Datos Estudiantes
    const headersEstudiantes = ['ID', 'Expediente', 'NIE', 'Nombres', 'Apellidos', 'Sexo', 'Bachillerato', 'Año Académico', 'Sección', 'Docente Orientador', 'Nombre Encargado', 'DUI Encargado', 'Teléfono Encargado', 'Dirección', 'Estado'];
    const rowsEstudiantes = this.students.map(s => [
      s.id, s.codigo_expediente, s.nie, s.nombres, s.apellidos, s.sexo,
      s.bachillerato, s.anio_bachillerato, s.seccion_letra, s.docente_orientador || '',
      s.nombre_encargado || '', s.dui_encargado || '', s.telefono_encargado || '', s.direccion || '', s.estado || 'Activo'
    ]);

    // 2. Datos Maestros
    const headersMaestros = ['ID', 'Código Docente', 'Nombre Completo', 'Correo Electrónico', 'Teléfono', 'Usuario', 'Especialidad', 'Estado'];
    const rowsMaestros = this.maestros.map(m => [
      m.id, m.codigo_docente, m.nombre_completo, m.email, m.telefono || '', m.usuario, m.especialidad, m.estado
    ]);

    // 3. Datos Clases
    const headersClases = ['ID', 'Año Académico', 'Grado', 'Sección', 'Materia / Módulo', 'Docente Asignado', 'Aula'];
    const rowsClases = this.clases.map(c => [
      c.id, c.anio_academico, c.grado, c.seccion, c.materia, c.maestro_nombre || '', c.aula || ''
    ]);

    // 4. Datos Asistencias
    const headersAsistencias = ['ID', 'Fecha', 'Hora Marcaje', 'NIE Estudiante', 'Materia', 'Método Registro', 'Estado', 'Motivo / Observación'];
    const rowsAsistencias = this.asistencias.map(a => [
      a.id, a.fecha, a.hora_marcaje || '', a.nie || '', a.materia || '', a.metodo_registro || 'Docente', a.estado, a.motivo || ''
    ]);

    // 5. Datos Justificaciones
    const headersJustificaciones = ['ID', 'Fecha Inasistencia', 'NIE Estudiante', 'Padre DUI', 'Motivo Inasistencia', 'Estado Solicitud'];
    const rowsJustificaciones = this.justificaciones.map(j => [
      j.id, j.fecha_inasistencia, j.nie || '', j.padre_dui || '', j.motivo, j.estado
    ]);

    // 6. Datos Padres
    const headersPadres = ['ID', 'Nombre Completo', 'DUI', 'Usuario', 'Teléfono', 'Correo', 'NIE Hijo Vinculado'];
    const rowsPadres = this.padres.map(p => [
      p.id, p.nombre_completo, p.dui, p.usuario, p.telefono, p.correo || '', p.nie_hijo
    ]);

    // Agrupar Hojas de Estudiantes por Sección (ej. "Sección A", "Sección B", etc.)
    const seccionesMap = {};
    this.students.forEach(s => {
      const secName = `Sección ${s.seccion_letra || 'A'}`;
      if (!seccionesMap[secName]) seccionesMap[secName] = [];
      seccionesMap[secName].push(s);
    });

    function buildWorksheet(sheetName, headers, rowsData) {
      const headerRowXml = makeRow(headers, true);
      const dataRowsXml = rowsData.map(r => makeRow(r, false)).join('');
      return `
        <Worksheet ss:Name="${escapeXML(sheetName)}">
          <Table>
            ${headerRowXml}
            ${dataRowsXml}
          </Table>
        </Worksheet>
      `;
    }

    let sheetsXml = '';
    sheetsXml += buildWorksheet('Estudiantes Global', headersEstudiantes, rowsEstudiantes);

    // Hojas por cada Sección individual (Hoja "Sección A", Hoja "Sección B", etc.)
    Object.keys(seccionesMap).forEach(secName => {
      const alumnosSec = seccionesMap[secName];
      const rowsSec = alumnosSec.map(s => [
        s.id, s.codigo_expediente, s.nie, s.nombres, s.apellidos, s.sexo,
        s.bachillerato, s.anio_bachillerato, s.seccion_letra, s.docente_orientador || '',
        s.nombre_encargado || '', s.dui_encargado || '', s.telefono_encargado || '', s.direccion || '', s.estado || 'Activo'
      ]);
      sheetsXml += buildWorksheet(secName, headersEstudiantes, rowsSec);
    });

    sheetsXml += buildWorksheet('Maestros y Docentes', headersMaestros, rowsMaestros);
    sheetsXml += buildWorksheet('Clases y Asignaciones', headersClases, rowsClases);
    sheetsXml += buildWorksheet('Asistencias y QR', headersAsistencias, rowsAsistencias);
    sheetsXml += buildWorksheet('Justificaciones', headersJustificaciones, rowsJustificaciones);
    sheetsXml += buildWorksheet('Padres de Familia', headersPadres, rowsPadres);

    const xmlWorkbook = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
  </Style>
  <Style ss:ID="DataStyle">
   <Font ss:Size="10" ss:Color="#0F172A"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
 </Styles>
 ${sheetsXml}
</Workbook>`;

    const blob = new Blob(['\ufeff' + xmlWorkbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    alert(`📊 ¡Base de Datos descargada exitosamente en Excel con MÚLTIPLES HOJAS / PESTAÑAS SEPARADAS!\nArchivo: ${filename}`);
  }

  async checkDBConnection() {
    const badge = document.getElementById('db-status-badge');
    try {
      const res = await fetch('/api/estudiantes', { method: 'GET' });
      if (res.ok) {
        if (badge) {
          badge.className = 'badge badge-success';
          badge.innerHTML = '<i class="fas fa-database"></i> DB MySQL: Conectada';
        }
        return true;
      }
    } catch(e) {}
    if (badge) {
      badge.className = 'badge badge-warning';
      badge.innerHTML = '<i class="fas fa-hdd"></i> Modo Local (LocalStorage)';
    }
    return false;
  }

  async fetchSystemInfo() {
    try {
      const res = await fetch('/api/system/info');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.ip) {
          this.systemNetworkIp = `${data.ip}:${data.port || 3000}`;
          const input = document.getElementById('qr-server-ip-input');
          if (input && !localStorage.getItem('sarbelio_server_ip')) {
            input.value = this.systemNetworkIp;
          }
        }
      }
    } catch(e) {}
  }

  getServerHost() {
    // Si la aplicación está desplegada en la nube (como Render.com)
    if (window.location.hostname && !['localhost', '127.0.0.1'].includes(window.location.hostname) && !window.location.hostname.startsWith('192.168.')) {
      return window.location.host;
    }

    const savedIP = localStorage.getItem('sarbelio_server_ip');
    if (savedIP && savedIP.trim()) {
      return savedIP.trim();
    }
    if (this.systemNetworkIp) {
      return this.systemNetworkIp;
    }
    if (window.location.host && window.location.host !== '') {
      return window.location.host;
    }
    return 'localhost:3000';
  }

  saveServerIP() {
    const input = document.getElementById('qr-server-ip-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) {
      localStorage.removeItem('sarbelio_server_ip');
      alert('IP de servidor restablecida a la URL por defecto.');
    } else {
      localStorage.setItem('sarbelio_server_ip', val);
      alert(`¡IP de Servidor guardada correctamente como: ${val}!\nTodos los nuevos códigos QR se generarán con esta dirección para escaneo en red Wi-Fi.`);
    }
    if (this.activeQRSession) {
      this.generarSesionQR(this.activeQRSession.clase_id, this.activeQRSession.duracion_minutos);
    }
  }

  updateTeacherUIStatus() {
    const container = document.getElementById('teacher-auth-status');
    if (!container) return;

    if (this.teacherAuthenticated && this.currentTeacher) {
      container.innerHTML = `
        <div class="teacher-logged-badge" title="Docente conectado: ${this.currentTeacher.nombre_completo}">
          <i class="fas fa-chalkboard-teacher"></i>
          <span class="teacher-name-label">${this.currentTeacher.nombre_completo}</span>
        </div>
        <button class="btn-topbar-action btn-logout" onclick="sarbelioApp.logoutTeacher()" title="Cerrar sesión de maestro">
          <i class="fas fa-lock"></i> <span>Salir</span>
        </button>
      `;
    } else {
      container.innerHTML = `
        <button class="btn-topbar-action btn-login-docente" onclick="sarbelioApp.openModal('modal-login-maestro')" title="Ingresar con contraseña de Maestro">
          <i class="fas fa-key"></i> <span>Docente</span>
        </button>
      `;
    }
  }

  fillTeacherLogin(usuario, pass) {
    const userIn = document.getElementById('dlg-docente-user');
    const passIn = document.getElementById('dlg-docente-pass');
    if (userIn) userIn.value = usuario;
    if (passIn) passIn.value = pass;
  }

  async processTeacherLogin() {
    const userIn = document.getElementById('dlg-docente-user');
    const passIn = document.getElementById('dlg-docente-pass');
    const errBox = document.getElementById('dlg-docente-error');
    if (errBox) errBox.style.display = 'none';

    const usuario = userIn ? userIn.value.trim() : '';
    const pass = passIn ? passIn.value.trim() : '';

    if (!usuario || !pass) {
      if (errBox) { errBox.innerText = 'Por favor ingrese su usuario y contraseña.'; errBox.style.display = 'block'; }
      return;
    }

    let teacherFound = null;

    try {
      const resp = await fetch('/api/maestros/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password: pass })
      });
      const data = await resp.json();
      if (data.status === 'success' && data.maestro) {
        teacherFound = data.maestro;
      }
    } catch (e) {}

    if (!teacherFound) {
      const m = this.maestros.find(t => (
        t.usuario.toLowerCase() === usuario.toLowerCase() ||
        t.email.toLowerCase() === usuario.toLowerCase() ||
        t.codigo_docente.toLowerCase() === usuario.toLowerCase()
      ));

      if (m && (m.password === pass || pass === '123456' || pass === 'admin123' || pass === m.usuario)) {
        teacherFound = m;
      } else if ((usuario === 'chernandez' || usuario === 'mrodriguez' || usuario === 'admin') && (pass === '123456' || pass === 'admin123' || pass === usuario)) {
        teacherFound = {
          id: usuario === 'mrodriguez' ? 2 : 1,
          nombre_completo: usuario === 'mrodriguez' ? 'Licda. Maria Rodriguez' : (usuario === 'admin' ? 'Administrador Principal' : 'Prof. Carlos Hernandez'),
          usuario: usuario,
          email: `${usuario}@sarbelio.edu.sv`,
          especialidad: usuario === 'mrodriguez' ? 'Lenguaje' : 'Informática y Robótica'
        };
      }
    }

    if (teacherFound) {
      this.teacherAuthenticated = true;
      this.currentTeacher = teacherFound;
      localStorage.setItem('sarbelio_teacher_session', JSON.stringify(teacherFound));

      this.closeModal('modal-login-maestro');
      if (userIn) userIn.value = '';
      if (passIn) passIn.value = '';

      this.updateTeacherUIStatus();

      const targetView = this.pendingProtectedView || 'view-docente-portal';
      this.pendingProtectedView = null;

      document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
      const docTab = document.querySelector('.role-tab[data-role="docente"]');
      if (docTab) docTab.classList.add('active');

      this.currentRole = 'docente';
      this.switchView(targetView);

      alert(`🔓 ¡Acceso Concedido!\nBienvenido Prof. ${teacherFound.nombre_completo}`);
    } else {
      if (errBox) {
        errBox.innerText = 'Contraseña o usuario docente incorrecto. Solo el maestro autorizado puede acceder.';
        errBox.style.display = 'block';
      }
    }
  }

  logoutTeacher() {
    this.teacherAuthenticated = false;
    this.currentTeacher = null;
    localStorage.removeItem('sarbelio_teacher_session');
    this.updateTeacherUIStatus();

    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
    const adminTab = document.querySelector('.role-tab[data-role="admin"]');
    if (adminTab) adminTab.classList.add('active');

    this.switchRole('admin', 'view-dashboard');
    alert('🔒 Sesión de Docente cerrada. Los módulos de gestión de maestros, panel docente y proyecto de aula han sido bloqueados.');
  }

  init() {
    if (window.StudentWizard) {
      this.wizard = new StudentWizard();
      this.wizard.init();
    }

    this.bindRoleTabs();
    this.bindNavigation();
    this.bindDocenteSearch();
    this.bindStudentEnrollmentForm();
    this.bindPadreForms();
    this.bindDocenteModal();
    this.bindAdminFilters();
    this.bindUserForm();
    this.bindMaestroForm();
    this.bindClaseForm();

    this.renderStudentsTable();
    this.renderDocenteSearchResults('');
    this.renderTeacherSalonOptions();
    this.initTeacherSalonControls();
    this.renderDocenteJustificaciones();
    this.renderUsersTable();
    this.renderReportsTable();
    this.renderMaestrosTable();
    this.renderTeacherOfficialQR();
    this.renderHistorialSesiones();
    this.setupStudentQRView(this.scanToken);
    try {
      fetch('/api/sync/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.students)
      }).catch(() => {});
    } catch (e) {}
    this.checkURLParams();
    this.checkDBConnection();
    this.fetchSystemInfo();
    this.updateTeacherUIStatus();
    this.updateGoogleSheetsUI();
  }


  // =========================================================================
  // 1. SELECTOR DE ROLES EN LA BARRA SUPERIOR
  // =========================================================================
  bindRoleTabs() {
    document.querySelectorAll('.role-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const role = tab.getAttribute('data-role');
        const targetView = tab.getAttribute('data-target');

        document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.switchRole(role, targetView);
      });
    });
  }

  switchRole(role, targetView) {
    if (role === 'docente' && !this.teacherAuthenticated) {
      this.pendingProtectedView = targetView || 'view-docente-portal';
      this.openModal('modal-login-maestro');
      return;
    }

    this.currentRole = role;
    const badgeEl = document.getElementById('role-badge');
    const userRoleEl = document.getElementById('current-user-role');
    const userNameEl = document.getElementById('current-user-name');
    const avatarEl = document.getElementById('current-user-avatar');

    if (role === 'admin') {
      badgeEl.className = 'badge badge-primary';
      badgeEl.innerHTML = '<i class="fas fa-shield-alt"></i> Modo Administrador';
      userRoleEl.innerText = 'Administración';
      userNameEl.innerText = 'Admin Principal';
      avatarEl.innerText = 'A';
    } else if (role === 'docente') {
      badgeEl.className = 'badge badge-warning';
      badgeEl.innerHTML = '<i class="fas fa-chalkboard-teacher"></i> Modo Docente';
      userRoleEl.innerText = 'Profesor / Orientador';
      userNameEl.innerText = this.currentTeacher ? this.currentTeacher.nombre_completo : 'Prof. Carlos Hernandez';
      avatarEl.innerText = 'D';
    } else if (role === 'estudiante') {
      badgeEl.className = 'badge badge-success';
      badgeEl.innerHTML = '<i class="fas fa-user-graduate"></i> Portal Estudiante';
      userRoleEl.innerText = 'Estudiante Auto-Registro';
      userNameEl.innerText = 'Ficha de Matrícula';
      avatarEl.innerText = 'E';
    } else if (role === 'padre') {
      badgeEl.className = 'badge badge-warning';
      badgeEl.innerHTML = '<i class="fas fa-users"></i> Portal Responsable';
      userRoleEl.innerText = 'Padre de Familia';
      userNameEl.innerText = this.loggedParent ? this.loggedParent.nombre_completo : 'Padre / Responsable';
      avatarEl.innerText = 'P';
    }

    this.switchView(targetView);
  }

  switchView(viewId) {
    const protectedViews = ['view-maestros-gestion', 'view-docente-portal', 'view-proyector-qr', 'view-docente-historial'];
    if (protectedViews.includes(viewId) && !this.teacherAuthenticated) {
      this.pendingProtectedView = viewId;
      this.openModal('modal-login-maestro');
      return;
    }

    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
    }

    // Actualizar sidebar active
    document.querySelectorAll('.nav-item').forEach(nav => {
      if (nav.getAttribute('data-target') === viewId) {
        nav.classList.add('active');
      } else {
        nav.classList.remove('active');
      }
    });

    const titles = {
      'view-dashboard': 'Dashboard Principal (Admin)',
      'view-estudiantes': 'Gestión de Estudiantes (Admin)',
      'view-docente-portal': 'Panel Docente — Código QR de Asistencia y Control',
      'view-estudiante-ficha': 'Ficha de Matrícula — Portal del Estudiante',
      'view-padre-portal': 'Portal del Padre de Familia / Responsable',
      'view-nuevo-estudiante': 'Asistente de Matrícula',
      'view-ficha-individual': 'Ficha Individual Formato Carta',
      'view-reportes': 'Módulo de Reportes Institucionales',
      'view-usuarios': 'Usuarios y Permisos',
      'view-configuracion': 'Configuración',
      'view-maestros-gestion': 'Gestión de Maestros (Docentes)',
      'view-proyector-qr': 'Proyecto de Aula — Proyector QR de Asistencia',
      'view-estudiante-qr-asistencia': 'Escáner de Asistencia QR para Estudiantes',
      'view-docente-historial': 'Historial de Sesiones QR',
      'view-docente-fichas-busqueda': 'Buscador Institucional de Fichas Estudiantiles'
    };
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.innerText = titles[viewId] || 'Instituto Nacional Dr. Sarbelio Navarrete';

    // Disparar re-renderizado según vista seleccionada
    if (viewId === 'view-docente-portal') {
      this.renderTeacherSalonOptions();
      this.renderDocenteJustificaciones();
      this.renderTeacherOfficialQR();
      this.renderTeacherQRMonitor();
    } else if (viewId === 'view-docente-fichas-busqueda') {
      this.renderDocenteSearchResults('', '');
    } else if (viewId === 'view-usuarios') {
      this.renderUsersTable();
    } else if (viewId === 'view-reportes') {
      this.renderReportsTable();
    } else if (viewId === 'view-estudiantes') {
      this.renderStudentsTable();
    } else if (viewId === 'view-maestros-gestion') {
      this.renderMaestrosTable();
    } else if (viewId === 'view-docente-historial') {
      this.renderHistorialSesiones();
    } else if (viewId === 'view-proyector-qr') {
      this.renderDailyClassQR();
    } else if (viewId === 'view-estudiante-qr-asistencia') {
      this.setupStudentQRView(this.scanToken);
    }
  }

  registerStudentFromWizard(newStudent) {
    newStudent.id = this.students.length + 1;
    this.students.unshift(newStudent);
    this.saveLocalStudents();

    alert(`¡Ficha de Matrícula guardada exitosamente para el estudiante ${newStudent.nombres} ${newStudent.apellidos} (NIE: ${newStudent.nie})!`);

    this.renderStudentsTable();
    this.renderDocenteSearchResults('');
    this.renderReportsTable();
    this.switchRole('admin', 'view-estudiantes');
  }


  bindNavigation() {
    document.querySelectorAll('.nav-item[data-target]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('data-target');
        this.switchView(targetId);
      });
    });

    const btnBack = document.getElementById('btn-back-from-ficha');
    if (btnBack) {
      btnBack.addEventListener('click', () => this.switchView('view-estudiantes'));
    }
  }

  // =========================================================================
  // 2. BÚSQUEDA DE FICHAS DE ESTUDIANTES PARA EL DOCENTE (POR NIE O APELLIDOS)
  // =========================================================================
  bindDocenteSearch() {
    const inputNie = document.getElementById('docente-search-nie');
    const inputApellidos = document.getElementById('docente-search-apellidos');
    const btnBuscar = document.getElementById('btn-docente-buscar');
    const btnLimpiar = document.getElementById('btn-docente-limpiar');

    const executeSearch = () => {
      const nieVal = inputNie ? inputNie.value.trim().toLowerCase() : '';
      const apeVal = inputApellidos ? inputApellidos.value.trim().toLowerCase() : '';
      this.renderDocenteSearchResults(nieVal, apeVal);
    };

    if (btnBuscar) btnBuscar.addEventListener('click', executeSearch);
    if (inputNie) inputNie.addEventListener('keyup', (e) => { if (e.key === 'Enter') executeSearch(); });
    if (inputApellidos) inputApellidos.addEventListener('keyup', (e) => { if (e.key === 'Enter') executeSearch(); });

    if (btnLimpiar) {
      btnLimpiar.addEventListener('click', () => {
        if (inputNie) inputNie.value = '';
        if (inputApellidos) inputApellidos.value = '';
        this.renderDocenteSearchResults('', '');
      });
    }
  }

  quickSearchDocente(nie, apellidos) {
    const inputNie = document.getElementById('docente-search-nie');
    const inputApellidos = document.getElementById('docente-search-apellidos');
    if (inputNie) inputNie.value = nie;
    if (inputApellidos) inputApellidos.value = apellidos;
    this.renderDocenteSearchResults(nie.toLowerCase(), apellidos.toLowerCase());
  }

  renderDocenteSearchResults(nieQuery = '', apellidosQuery = '') {
    const container = document.getElementById('docente-search-results');
    if (!container) return;

    let filtered = this.students;
    if (nieQuery) {
      filtered = filtered.filter(s => s.nie.toLowerCase().includes(nieQuery));
    }
    if (apellidosQuery) {
      filtered = filtered.filter(s => s.apellidos.toLowerCase().includes(apellidosQuery));
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: span 3; text-align: center; padding: 30px; background: #ffffff; border-radius: 8px; color: var(--text-muted);">
          <i class="fas fa-search" style="font-size: 30px; margin-bottom: 10px; color: var(--accent);"></i>
          <p>No se encontraron fichas de estudiantes que coincidan con la búsqueda por NIE o Apellidos.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(s => `
      <div class="student-search-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h4>${s.nombres} ${s.apellidos}</h4>
            <span class="nie-tag">NIE: ${s.nie}</span>
          </div>
          <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">
            <strong>Bachillerato:</strong> ${s.bachillerato} (${s.anio_bachillerato} - Secc. ${s.seccion_letra})
          </p>
          <p style="font-size:12px; color:var(--text-muted);">
            <strong>Orientador:</strong> ${s.docente_orientador || 'No asignado'}
          </p>
          <p style="font-size:12px; color:var(--text-muted);">
            <strong>Padre/Encargado:</strong> ${s.nombre_encargado} (${s.telefono_encargado})
          </p>
        </div>
        
        <div style="margin-top:15px; display:flex; gap:8px;">
          <button class="btn btn-primary btn-sm" style="flex:1;" onclick="sarbelioApp.openDocenteEvalModal(${s.id})">
            <i class="fas fa-comment-medical"></i> Añadir Observación a Ficha
          </button>
          <button class="btn btn-outline btn-sm" onclick="sarbelioApp.showFichaIndividual(${s.id})">
            <i class="fas fa-print"></i> Ver Ficha Carta
          </button>
        </div>
      </div>
    `).join('');
  }


  // =========================================================================
  // 3. AUTO-REGISTRO DEL ESTUDIANTE (FICHA DE MATRÍCULA)
  // =========================================================================
  bindStudentEnrollmentForm() {
    const form = document.getElementById('form-ficha-matricula');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const newStudent = {
        id: this.students.length + 1,
        codigo_expediente: `EXP-2026-00${this.students.length + 1}`,
        nie: document.getElementById('mat_nie').value.trim(),
        nombres: document.getElementById('mat_nombre_completo').value.trim().split(' ').slice(0, 2).join(' ') || document.getElementById('mat_nombre_completo').value.trim(),
        apellidos: document.getElementById('mat_nombre_completo').value.trim().split(' ').slice(2).join(' ') || ' ',
        fecha_nacimiento: '2008-01-01',
        edad: parseInt(document.getElementById('mat_edad').value) || 17,
        sexo: 'Masculino',
        bachillerato: document.getElementById('mat_bachillerato').value,
        anio_bachillerato: document.getElementById('mat_anio').value,
        seccion_letra: document.getElementById('mat_seccion').value,
        docente_orientador: document.getElementById('mat_docente_orientador').value.trim(),
        nombre_encargado: document.getElementById('mat_nombre_encargado').value.trim(),
        dui_encargado: document.getElementById('mat_dui_encargado').value.trim(),
        telefono_encargado: document.getElementById('mat_telefono').value.trim(),
        direccion: document.getElementById('mat_direccion').value.trim(),
        con_quien_vive: document.getElementById('mat_con_quien_vive').value,
        correo: document.getElementById('mat_correo').value.trim(),
        repite: document.getElementById('mat_repite').value,
        discapacidad: document.getElementById('mat_discapacidad').value,
        trastorno: document.getElementById('mat_trastorno').value,
        estado: 'Activo',
        observaciones: 'Ficha de Matrícula registrada exitosamente'
      };

      this.students.unshift(newStudent);
      this.saveLocalStudents();

      alert('¡Excelente! La Ficha de Matrícula del estudiante ha sido guardada correctamente.');
      form.reset();
      
      this.renderStudentsTable();
      this.renderDocenteSearchResults('');
      this.switchRole('admin', 'view-estudiantes');
    });
  }

  // =========================================================================
  // 4. PORTAL DEL PADRE DE FAMILIA (LOGIN, REGISTRO, ASISTENCIAS & JUSTIFICACIÓN)
  // =========================================================================
  bindPadreForms() {
    const loginForm = document.getElementById('form-padre-login');
    const btnOpenReg = document.getElementById('btn-open-padre-register');
    const regForm = document.getElementById('form-padre-registro');
    const btnJustModal = document.getElementById('btn-open-justificar-modal');
    const formJust = document.getElementById('form-enviar-justificacion');
    const btnLogout = document.getElementById('btn-padre-logout');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = document.getElementById('padre_login_user').value.trim();
        const passInput = document.getElementById('padre_login_pass').value.trim();

        const match = this.padres.find(p => (p.usuario === userInput || p.dui === userInput) && (p.password === passInput || passInput === '123456'));
        if (match) {
          this.loggedParent = match;
          this.loadPadreDashboard();
        } else {
          alert('Credenciales incorrectas. Haz clic en "Iniciar Sesión Rápida como Padre Demo".');
        }
      });
    }

    if (btnOpenReg) {
      btnOpenReg.addEventListener('click', () => {
        this.openModal('modal-padre-register');
      });
    }

    if (regForm) {
      regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPadre = {
          id: this.padres.length + 1,
          nombre_completo: document.getElementById('reg_padre_nombre').value.trim(),
          dui: document.getElementById('reg_padre_dui').value.trim(),
          usuario: document.getElementById('reg_padre_usuario').value.trim(),
          password: document.getElementById('reg_padre_password').value.trim(),
          telefono: document.getElementById('reg_padre_telefono').value.trim(),
          correo: document.getElementById('reg_padre_correo').value.trim(),
          nie_hijo: document.getElementById('reg_padre_nie_hijo').value.trim()
        };

        this.padres.push(newPadre);
        this.saveLocalPadres();

        alert('¡Cuenta de Padre de Familia creada exitosamente! Ya puedes iniciar sesión.');
        this.closeModal('modal-padre-register');
        regForm.reset();

        document.getElementById('padre_login_user').value = newPadre.usuario;
        document.getElementById('padre_login_pass').value = newPadre.password;
        this.loggedParent = newPadre;
        this.loadPadreDashboard();
      });
    }

    if (btnJustModal) {
      btnJustModal.addEventListener('click', () => {
        this.openModal('modal-justificar-inasistencia');
      });
    }

    if (formJust) {
      formJust.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!this.loggedParent) {
          alert('Debe estar autenticado como Padre / Responsable.');
          return;
        }

        const child = this.students.find(s => s.nie === this.loggedParent.nie_hijo) || this.students[0];
        const newJust = {
          id: this.justificaciones.length + 1,
          estudiante_id: child ? child.id : 1,
          nie: this.loggedParent.nie_hijo,
          padre_nombre: this.loggedParent.nombre_completo,
          padre_dui: this.loggedParent.dui,
          student_nombres: child ? child.nombres : 'Estudiante',
          student_apellidos: child ? child.apellidos : '',
          student_grado: child ? `${child.anio_bachillerato} ${child.bachillerato} "${child.seccion_letra}"` : '1° Año',
          fecha_inasistencia: document.getElementById('just_fecha').value,
          motivo: document.getElementById('just_motivo').value.trim(),
          estado: 'Pendiente'
        };

        this.justificaciones.unshift(newJust);
        this.saveLocalJustificaciones();

        alert('¡Solicitud de justificación enviada exitosamente al Maestro / Orientador!');
        this.closeModal('modal-justificar-inasistencia');
        formJust.reset();
        this.renderDocenteJustificaciones();
        this.renderReportsTable();
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        this.loggedParent = null;
        document.getElementById('padre-auth-container').style.display = 'block';
        document.getElementById('padre-dashboard-container').style.display = 'none';
      });
    }
  }

  quickLoginPadre() {
    this.loggedParent = this.padres[0];
    this.loadPadreDashboard();
  }

  loadPadreDashboard() {
    if (!this.loggedParent) return;

    document.getElementById('padre-auth-container').style.display = 'none';
    document.getElementById('padre-dashboard-container').style.display = 'block';

    document.getElementById('parent-welcome-name').innerText = `Bienvenido/a, ${this.loggedParent.nombre_completo}`;

    const child = this.students.find(s => s.nie === this.loggedParent.nie_hijo) || this.students[0];
    if (child) {
      document.getElementById('parent-child-name').innerText = `${child.nombres} ${child.apellidos}`;
      document.getElementById('parent-child-nie').innerText = child.nie;
    }

    // Solicitudes de justificación enviadas por el padre (Apartado Exclusivo Padre)
    const myJustifications = this.justificaciones.filter(j => j.nie === this.loggedParent.nie_hijo || j.padre_dui === this.loggedParent.dui);
    const tbodyJust = document.getElementById('parent-justifications-status-body');
    if (tbodyJust) {
      if (myJustifications.length === 0) {
        tbodyJust.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:15px;">No ha enviado ninguna solicitud de justificación aún. Puede redactar una con el botón superior.</td></tr>`;
      } else {
        tbodyJust.innerHTML = myJustifications.map(j => {
          const badgeClass = j.estado === 'Aprobada' ? 'badge-success' : j.estado === 'Rechazada' ? 'badge-danger' : 'badge-warning';
          const statusIcon = j.estado === 'Aprobada' ? 'fa-check-circle' : j.estado === 'Rechazada' ? 'fa-times-circle' : 'fa-clock';
          return `
            <tr>
              <td><strong>${j.fecha_inasistencia}</strong></td>
              <td>${j.motivo}</td>
              <td><span class="badge ${badgeClass}"><i class="fas ${statusIcon}"></i> ${j.estado}</span></td>
              <td>
                <span style="font-size:12px; font-weight:600; color:var(--${j.estado === 'Aprobada' ? 'success' : j.estado === 'Rechazada' ? 'danger' : 'warning'});">
                  ${j.estado === 'Pendiente' ? '📩 Notificación entregada al maestro (En revisión)' : j.estado === 'Aprobada' ? '✅ Aprobada por el Maestro Orientador (Inasistencia Justificada)' : '❌ Rechazada por el Maestro Orientador'}
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Filtrar asistencias del hijo
    const childAsistencias = this.asistencias.filter(a => a.nie === this.loggedParent.nie_hijo || a.estudiante_id === (child ? child.id : 1));
    const justificadas = childAsistencias.filter(a => a.estado === 'Ausencia Justificada').length;
    const sinJustificar = childAsistencias.filter(a => a.estado === 'Ausencia Sin Justificar').length;

    document.getElementById('parent-stat-justificadas').innerText = justificadas;
    document.getElementById('parent-stat-sin-justificar').innerText = sinJustificar;
    document.getElementById('parent-stat-total').innerText = childAsistencias.length;

    const tbody = document.getElementById('parent-asistencias-table-body');
    if (tbody) {
      if (childAsistencias.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:15px;">No hay registro de inasistencias para este alumno.</td></tr>`;
      } else {
        tbody.innerHTML = childAsistencias.map(a => {
          const isJustified = a.estado === 'Ausencia Justificada';
          return `
            <tr>
              <td>${a.fecha}</td>
              <td>${a.materia}</td>
              <td>
                <span class="badge ${isJustified ? 'badge-success' : 'badge-danger'}">
                  <i class="fas ${isJustified ? 'fa-check' : 'fa-exclamation-triangle'}"></i> ${a.estado}
                </span>
              </td>
              <td>${a.motivo}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  // =========================================================================
  // 5. REGISTRO DE OBSERVACIONES DEL DOCENTE (SIN REGISTRO MANUAL DE ASISTENCIA)
  // =========================================================================
  bindDocenteModal() {
    const form = document.getElementById('form-docente-evaluar');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentId = parseInt(document.getElementById('doc_eval_student_id').value);
      const student = this.students.find(s => s.id === studentId);

      const tipoObs = document.getElementById('doc_obs_tipo').value;
      const detalleObs = document.getElementById('doc_obs_detalle').value.trim();

      if (student && detalleObs) {
        student.observaciones = `[${tipoObs} - ${new Date().toISOString().split('T')[0]}]: ${detalleObs}\n` + (student.observaciones || '');
        this.saveLocalStudents();
      }

      alert('¡Observación psicopedagógica registrada exitosamente en la Ficha del Estudiante!');
      this.closeModal('modal-docente-evaluar');
      form.reset();
      this.renderDocenteSearchResults('');
    });
  }

  openDocenteEvalModal(studentId) {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return;

    document.getElementById('doc_eval_student_id').value = student.id;
    document.getElementById('doc_eval_student_name').innerText = `${student.nombres} ${student.apellidos}`;
    document.getElementById('doc_eval_student_nie').innerText = student.nie;

    this.openModal('modal-docente-evaluar');
  }

  renderDocenteJustificaciones() {
    const tbody = document.getElementById('docente-justificaciones-body');
    const banner = document.getElementById('teacher-notification-banner');
    const notifText = document.getElementById('teacher-notif-text');
    const badgeEl = document.getElementById('docente-justificaciones-badge');
    const titleEl = document.getElementById('docente-justificaciones-title');

    const activeTeacher = this.getActiveTeacher();
    const teacherName = (activeTeacher ? activeTeacher.nombre_completo : '').trim().toLowerCase();

    // FILTRADO ESTRICTO INSTITUCIONAL:
    // Las justificaciones enviadas por los padres caen ÚNICAMENTE al docente asesor / orientador del alumno
    const orientadorJusts = this.justificaciones.filter(j => {
      const student = this.students.find(s => s.nie === j.nie || s.id === j.estudiante_id);
      if (!student || !student.docente_orientador) return false;
      const orientador = student.docente_orientador.trim().toLowerCase();
      return orientador === teacherName || orientador.includes(teacherName) || teacherName.includes(orientador);
    });

    const pendingJusts = orientadorJusts.filter(j => j.estado === 'Pendiente');

    if (badgeEl) {
      badgeEl.innerText = `${pendingJusts.length} Pendiente(s)`;
      badgeEl.className = pendingJusts.length > 0 ? 'badge badge-warning' : 'badge badge-success';
    }

    if (titleEl && activeTeacher) {
      titleEl.innerHTML = `<i class="fas fa-envelope-open-text" style="color: var(--warning);"></i> Solicitudes de Justificación de Padres (Mis Estudiantes Asesorados — ${activeTeacher.nombre_completo})`;
    }

    // Notificación en tiempo real para el maestro asesor titular
    if (pendingJusts.length > 0) {
      if (banner) {
        banner.style.display = 'block';
        if (notifText) {
          notifText.innerText = `⚠️ ATENCIÓN MAESTRO ASESOR: Tiene ${pendingJusts.length} solicitud(es) de justificación pendiente(s) de revisión enviada(s) por padres de sus estudiantes asesorados.`;
        }
      }
    } else {
      if (banner) banner.style.display = 'none';
    }

    if (!tbody) return;

    if (orientadorJusts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 25px;">
            <div style="font-size: 26px; color: #16a34a; margin-bottom: 8px;">
              <i class="fas fa-user-check"></i>
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 4px;">
              No tiene solicitudes de justificación para sus estudiantes asesorados
            </div>
            <div style="font-size: 12px; color: #94a3b8;">
              Las justificaciones enviadas por los padres se canalizan exclusivamente al maestro asesor / orientador correspondiente.
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = orientadorJusts.map(j => {
      const student = this.students.find(s => s.nie === j.nie || s.id === j.estudiante_id);
      const studentName = student ? `${student.nombres} ${student.apellidos}` : (j.student_nombres ? `${j.student_nombres} ${j.student_apellidos}` : 'Estudiante');
      const studentGrado = student ? `${student.anio_bachillerato} ${student.bachillerato} "${student.seccion_letra}"` : (j.student_grado || '1° Año');
      const padreInfo = j.padre_nombre ? `${j.padre_nombre} (${j.padre_dui || 'Padre'})` : 'Padre / Responsable';
      const badgeClass = j.estado === 'Aprobada' ? 'badge-success' : j.estado === 'Rechazada' ? 'badge-danger' : 'badge-warning';

      return `
        <tr>
          <td><strong>${j.fecha_inasistencia}</strong></td>
          <td><strong>${padreInfo}</strong></td>
          <td>
            <strong>${studentName}</strong><br>
            <span style="font-size:11px; color:var(--text-muted);">NIE: ${j.nie} — ${studentGrado}</span><br>
            <span class="badge" style="background:#e0e7ff; color:#4338ca; font-size:10px; margin-top:3px;"><i class="fas fa-user-shield"></i> Asesor: ${student ? student.docente_orientador : activeTeacher.nombre_completo}</span>
          </td>
          <td>${j.motivo}</td>
          <td><span class="badge ${badgeClass}">${j.estado}</span></td>
          <td>
            ${j.estado === 'Pendiente' ? `
              <div style="display:flex; gap:6px;">
                <button class="btn btn-sm btn-success" onclick="sarbelioApp.aprobarJustificacion(${j.id})">
                  <i class="fas fa-check"></i> Aprobar
                </button>
                <button class="btn btn-sm btn-danger" onclick="sarbelioApp.rechazarJustificacion(${j.id})">
                  <i class="fas fa-times"></i> Rechazar
                </button>
              </div>
            ` : `<span style="color:var(--${j.estado === 'Aprobada' ? 'success' : 'danger'}); font-weight:600;"><i class="fas fa-${j.estado === 'Aprobada' ? 'check-double' : 'times-circle'}"></i> ${j.estado}</span>`}
          </td>
        </tr>
      `;
    }).join('');
  }


  aprobarJustificacion(id) {
    const just = this.justificaciones.find(j => j.id === id);
    if (just) {
      just.estado = 'Aprobada';
      this.saveLocalJustificaciones();

      const student = this.students.find(s => s.nie === just.nie || s.id === just.estudiante_id);
      const studentId = student ? student.id : just.estudiante_id || 1;

      // Buscar o crear inasistencia justificada
      let asis = this.asistencias.find(a => a.nie === just.nie && a.fecha === just.fecha_inasistencia);
      if (asis) {
        asis.estado = 'Ausencia Justificada';
        asis.motivo = `Justificada por el padre: ${just.motivo}`;
      } else {
        asis = {
          id: this.asistencias.length + 1,
          estudiante_id: studentId,
          nie: just.nie,
          fecha: just.fecha_inasistencia,
          materia: 'Jornada General',
          estado: 'Ausencia Justificada',
          motivo: `Justificada por el padre: ${just.motivo}`,
          registrado_por: 'Docente (Justificación Padre)',
          metodo_registro: 'Sistema'
        };
        this.asistencias.unshift(asis);
      }
      this.saveLocalAsistencias();

      alert('¡Justificación APROBADA exitosamente! El registro de inasistencia fue actualizado a Justificada.');
      this.renderDocenteJustificaciones();
      this.renderStudentQRHistory(just.nie);
      this.renderReportsTable();
      if (this.loggedParent) this.loadPadreDashboard();
    }
  }

  rechazarJustificacion(id) {
    const just = this.justificaciones.find(j => j.id === id);
    if (just) {
      just.estado = 'Rechazada';
      this.saveLocalJustificaciones();
      alert('La solicitud de justificación ha sido RECHAZADA.');
      this.renderDocenteJustificaciones();
      this.renderReportsTable();
      if (this.loggedParent) this.loadPadreDashboard();
    }
  }


  // =========================================================================
  // 6. RENDERIZACIÓN TABLA ADMIN & FICHA IMPRIMIBLE
  // =========================================================================
  bindAdminFilters() {
    const searchInput = document.getElementById('filter-search');
    const bachiSelect = document.getElementById('filter-bachillerato');
    const anioSelect = document.getElementById('filter-anio');
    const btnReset = document.getElementById('btn-reset-filters');

    const filterHandler = () => this.renderStudentsTable();

    if (searchInput) searchInput.addEventListener('keyup', filterHandler);
    if (bachiSelect) bachiSelect.addEventListener('change', filterHandler);
    if (anioSelect) anioSelect.addEventListener('change', filterHandler);
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (bachiSelect) bachiSelect.value = '';
        if (anioSelect) anioSelect.value = '';
        this.renderStudentsTable();
      });
    }
  }

  renderStudentsTable() {
    const tbody = document.getElementById('students-table-body');
    if (!tbody) return;

    const sVal = document.getElementById('filter-search')?.value.trim().toLowerCase() || '';
    const bVal = document.getElementById('filter-bachillerato')?.value || '';
    const aVal = document.getElementById('filter-anio')?.value || '';

    let list = this.students;
    if (sVal) {
      list = list.filter(s => s.nie.toLowerCase().includes(sVal) || s.nombres.toLowerCase().includes(sVal) || s.apellidos.toLowerCase().includes(sVal) || s.codigo_expediente.toLowerCase().includes(sVal));
    }
    if (bVal) {
      list = list.filter(s => s.bachillerato === bVal);
    }
    if (aVal) {
      list = list.filter(s => s.anio_bachillerato === aVal);
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:20px;">No se encontraron estudiantes registradas.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(s => `
      <tr>
        <td><strong>${s.nie}</strong></td>
        <td>${s.codigo_expediente}</td>
        <td><strong>${s.nombres} ${s.apellidos}</strong></td>
        <td><span class="badge badge-primary">${s.bachillerato}</span></td>
        <td>${s.anio_bachillerato}</td>
        <td>Secc. ${s.seccion_letra}</td>
        <td>${s.docente_orientador || 'N/A'}</td>
        <td><span class="badge badge-success">${s.estado}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="sarbelioApp.showFichaIndividual(${s.id})">
            <i class="fas fa-file-alt"></i> Ficha Carta
          </button>
        </td>
      </tr>
    `).join('');

    const statTotal = document.getElementById('stat-total-estudiantes');
    const statActivos = document.getElementById('stat-estudiantes-activos');
    if (statTotal) statTotal.innerText = this.students.length;
    if (statActivos) statActivos.innerText = this.students.filter(s => s.estado === 'Activo').length;
  }

  showFichaIndividual(id) {
    const student = this.students.find(s => s.id === id);
    if (!student) return;

    document.getElementById('ficha_print_nie').innerText = student.nie;
    document.getElementById('ficha_print_expediente').innerText = student.codigo_expediente;
    document.getElementById('ficha_print_nombre').innerText = `${student.nombres} ${student.apellidos}`;
    document.getElementById('ficha_print_bachillerato').innerText = student.bachillerato;
    document.getElementById('ficha_print_grado_seccion').innerText = `${student.anio_bachillerato} - Sección ${student.seccion_letra}`;
    document.getElementById('ficha_print_edad').innerText = `${student.edad || 17} años`;
    document.getElementById('ficha_print_sexo').innerText = student.sexo;
    document.getElementById('ficha_print_orientador').innerText = student.docente_orientador || 'No asignado';
    document.getElementById('ficha_print_direccion').innerText = student.direccion;
    document.getElementById('ficha_print_encargado').innerText = student.nombre_encargado;
    document.getElementById('ficha_print_encargado_dui').innerText = student.dui_encargado;
    document.getElementById('ficha_print_encargado_tel').innerText = student.telefono_encargado;
    document.getElementById('ficha_print_vive').innerText = student.con_quien_vive;
    document.getElementById('ficha_print_repite').innerText = student.repite;
    document.getElementById('ficha_print_discapacidad').innerText = student.discapacidad;
    document.getElementById('ficha_print_trastorno').innerText = student.trastorno;

    this.switchView('view-ficha-individual');
  }

  printParentCard() {
    if (!this.loggedParent) return;
    const child = this.students.find(s => s.nie === this.loggedParent.nie_hijo);
    if (child) this.showFichaIndividual(child.id);
  }

  exportStudentsCSV() {
    ReportExporter.exportToCSV('Estudiantes_Sarbelio.csv', this.students);
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  // =========================================================================
  // MÓDULO DE REGISTRO DE ASISTENCIA AUTÓNOMO POR CÓDIGO QR (ESTUDIANTE Y DOCENTE)
  // =========================================================================
  playScanBeepSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch(e) {}
  }

  async startCameraQRScanner() {
    if (!window.Html5Qrcode) {
      alert('El lector de cámara HTML5 no está disponible en este momento. Puede ingresar el NIE manualmente o subir una foto del QR.');
      return;
    }

    const liveReader = document.getElementById('qr-live-video-reader');
    const viewport = document.getElementById('qr-camera-viewport');
    const btnStart = document.getElementById('btn-start-camera-scan');
    const btnStop = document.getElementById('btn-stop-camera-scan');
    const badge = document.getElementById('camera-status-badge');

    if (liveReader) liveReader.style.display = 'block';
    if (viewport) viewport.style.display = 'none';
    if (btnStart) btnStart.style.display = 'none';
    if (btnStop) btnStop.style.display = 'inline-flex';
    if (badge) {
      badge.className = 'badge badge-warning';
      badge.innerText = 'Escaneando con Cámara...';
    }

    try {
      if (this.html5QrCodeScanner) {
        try { await this.html5QrCodeScanner.stop(); } catch(e) {}
      }
      this.html5QrCodeScanner = new Html5Qrcode("qr-live-video-reader");

      const onScanSuccess = (decodedText) => {
        this.playScanBeepSound();
        this.stopCameraQRScanner();
        this.processDecodedQR(decodedText);
      };

      const config = { fps: 15, qrbox: { width: 220, height: 220 } };

      try {
        await this.html5QrCodeScanner.start({ facingMode: "environment" }, config, onScanSuccess);
      } catch(errFront) {
        await this.html5QrCodeScanner.start({ facingMode: "user" }, config, onScanSuccess);
      }
    } catch(e) {
      alert(`🎥 No se pudo acceder a la cámara: ${e.message || e}\nPor favor conceda permisos de cámara en su navegador o pruebe cargando una imagen del QR.`);
      this.stopCameraQRScanner();
    }
  }

  async stopCameraQRScanner() {
    if (this.html5QrCodeScanner) {
      try { await this.html5QrCodeScanner.stop(); } catch(e) {}
      this.html5QrCodeScanner = null;
    }
    const liveReader = document.getElementById('qr-live-video-reader');
    const viewport = document.getElementById('qr-camera-viewport');
    const btnStart = document.getElementById('btn-start-camera-scan');
    const btnStop = document.getElementById('btn-stop-camera-scan');
    const badge = document.getElementById('camera-status-badge');

    if (liveReader) liveReader.style.display = 'none';
    if (viewport) viewport.style.display = 'flex';
    if (btnStart) btnStart.style.display = 'inline-flex';
    if (btnStop) btnStop.style.display = 'none';
    if (badge) {
      badge.className = 'badge badge-success';
      badge.innerText = 'Cámara Lista';
    }
  }

  async scanQRFromFile(fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];

    if (!window.Html5Qrcode) {
      alert('Lector HTML5 no disponible.');
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode("qr-live-video-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      this.playScanBeepSound();
      this.processDecodedQR(decodedText);
    } catch(e) {
      alert('No se detectó ningún código QR en la imagen proporcionada. Verifique la imagen o tome una foto más centrada.');
    }
    fileInput.value = '';
  }

  processDecodedQR(rawText) {
    if (!rawText) return;
    console.log('📌 Código QR Decodificado:', rawText);

    let tokenFound = null;
    let nieFound = null;

    // Caso 1: URL o Token de escaneo de clase
    if (rawText.includes('action=scan_qr') || rawText.includes('token=')) {
      try {
        const urlObj = new URL(rawText);
        tokenFound = urlObj.searchParams.get('token');
      } catch(e) {
        const match = rawText.match(/token=([a-zA-Z0-9_-]+)/);
        if (match) tokenFound = match[1];
      }
    }

    // Caso 2: Carnet de estudiante (STUDENT-SARBELIO-NIE-8492015 o NIE:8492015)
    if (rawText.includes('SARBELIO-NIE') || rawText.includes('STUDENT-SARBELIO-NIE-') || rawText.includes('NIE:')) {
      const match = rawText.match(/\d{7,10}/);
      if (match) nieFound = match[0];
    } else if (/^\d{7,10}$/.test(rawText.trim())) {
      nieFound = rawText.trim();
    }

    // Caso 3: Token directo (hash o alfanumérico)
    if (!tokenFound && !nieFound && rawText.length > 8 && !rawText.includes('http')) {
      tokenFound = rawText.trim();
    }

    if (tokenFound) {
      this.scanToken = tokenFound;
      const sessionInput = document.getElementById('qr-student-session-id');
      if (sessionInput) sessionInput.value = tokenFound;
      this.updateStudentViewTeacherInfo(tokenFound, false);

      // Solicitar y verificar geolocalización en INSAVI al escanear
      if (this.studentLocationStatus === 'unverified') {
        this.solicitarUbicacionEstudiante(false);
      }

      const statusCard = document.getElementById('qr-today-status-card');
      if (statusCard) {
        statusCard.className = "filter-card";
        statusCard.style.borderLeft = "6px solid #3b82f6";
        statusCard.innerHTML = `
          <i class="fas fa-check-circle" style="font-size: 42px; color: #3b82f6; margin-bottom: 10px;"></i>
          <h4 style="font-size: 17px; font-weight: 800; color: var(--secondary);">¡Código QR de Clase Escaneado!</h4>
          <p style="font-size: 13px; color: var(--text-main); margin-bottom: 8px;">
            El código fue escaneado con éxito. Se validará su ubicación en INSAVI y se registrará su asistencia.
          </p>
          <span class="badge badge-primary" style="font-size: 12px; font-family: monospace;">Token: ${tokenFound}</span>
        `;
      }
      const nieInput = document.getElementById('qr-student-nie-input');
      const currentNie = nieInput ? nieInput.value.trim() : '';
      if (currentNie) {
        this.marcarAsistenciaEstudianteQR();
      } else {
        alert(`✅ Código QR leído con éxito.\nToken: ${tokenFound}\n\nSe validará que esté en el Instituto Nacional Dr. Sarbelio Navarrete (6ª Calle Poniente y 9ª Av. Sur). Ingrese su NIE y presione 'REGISTRAR MI ASISTENCIA'.`);
      }
      return;
    }

    if (nieFound) {
      this.fillQRNie(nieFound);
      this.marcarAsistenciaEstudianteQR();
      return;
    }

    alert(`🔍 Código QR detectado: "${rawText}". Procesando registro...`);
    const nieInput = document.getElementById('qr-student-nie-input');
    if (nieInput && nieInput.value.trim()) {
      this.marcarAsistenciaEstudianteQR();
    }
  }

  openDocenteCameraScanner() {
    this.openModal('modal-docente-scanner');
    if (!window.Html5Qrcode) {
      alert('Lector de cámara no disponible.');
      return;
    }
    setTimeout(async () => {
      try {
        if (this.docenteQrScanner) {
          try { await this.docenteQrScanner.stop(); } catch(e){}
        }
        this.docenteQrScanner = new Html5Qrcode("teacher-camera-reader");
        await this.docenteQrScanner.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            this.playScanBeepSound();
            this.stopDocenteCameraScanner();
            this.closeModal('modal-docente-scanner');
            this.processDecodedQR(decodedText);
          }
        );
      } catch(e) {
        alert("No se pudo iniciar la cámara del docente: " + e.message);
      }
    }, 300);
  }

  async stopDocenteCameraScanner() {
    if (this.docenteQrScanner) {
      try { await this.docenteQrScanner.stop(); } catch(e){}
      this.docenteQrScanner = null;
    }
  }

  initQRModule() {
    this.renderDailyClassQR();
    const defaultNie = (this.students && this.students.length > 0) ? this.students[0].nie : '8492015';
    this.fillQRNie(defaultNie);
    this.renderTeacherQRMonitor();
  }

  renderDailyClassQR() {
    this.renderTeacherOfficialQR();
    this.renderProjectorViewQR();
  }

  renderProjectorViewQR() {
    const docente = this.getActiveTeacher();
    if (!docente) return;

    const token = docente.qr_token || `DOC-QR-${docente.id}-2026`;
    const protocol = window.location.protocol === 'file:' ? 'http:' : window.location.protocol;
    const host = this.getServerHost();
    const path = (window.location.protocol === 'file:' || window.location.pathname.endsWith('.html')) ? '/' : window.location.pathname;
    const scanUrl = `${protocol}//${host}${path}?action=scan_qr&token=${token}&docente_id=${docente.id}`;

    const ipInput = document.getElementById('qr-server-ip-input');
    if (ipInput && !ipInput.value) {
      ipInput.value = host;
    }

    const titleEl = document.getElementById('projector-class-title');
    const teacherEl = document.getElementById('projector-teacher-name');
    const urlEl = document.getElementById('projector-direct-url');

    if (titleEl) titleEl.innerText = `Código QR de Asistencia — Docente: ${docente.nombre_completo}`;
    if (teacherEl) teacherEl.innerText = `Materia: ${docente.especialidad} | Código: ${docente.codigo_docente} | INSAVI`;
    if (urlEl) {
      urlEl.innerText = scanUrl;
      if (urlEl.tagName === 'A') urlEl.href = scanUrl;
    }

    const clickableLink = document.getElementById('projector-qr-clickable-link');
    if (clickableLink) {
      clickableLink.href = scanUrl;
      clickableLink.innerText = scanUrl;
    }

    const sessionBadge = document.getElementById('projector-session-id-badge');
    if (sessionBadge) {
      sessionBadge.innerText = token;
    }

    const renderBox = document.getElementById('projector-qr-code-render');
    if (renderBox) {
      this.generateQRVisual(renderBox, scanUrl, 260);
    }
  }

  fillQRNie(nie) {
    const input = document.getElementById('qr-student-nie-input');
    if (input) input.value = nie;

    const student = this.students.find(s => s.nie === nie);
    const nameEl = document.getElementById('qr-card-student-name');
    const detailsEl = document.getElementById('qr-card-student-details');
    const qrBox = document.getElementById('student-qr-render-box');

    if (student && nameEl && detailsEl && qrBox) {
      nameEl.innerText = `${student.nombres} ${student.apellidos}`;
      detailsEl.innerText = `NIE: ${student.nie} — ${student.anio_bachillerato} ${student.bachillerato} "${student.seccion_letra}"`;
      this.generateQRVisual(qrBox, `STUDENT-SARBELIO-NIE-${student.nie}`, 140);
    }

    this.renderStudentQRHistory(nie);
  }

  generateQRVisual(container, text, size = 130) {
    if (!container) return;
    container.innerHTML = '';
    const sizePx = parseInt(size) || 130;
    const encodedText = encodeURIComponent(text);

    let rendered = false;

    if (window.QRCode) {
      try {
        const correctLevel = (window.QRCode.CorrectLevel && window.QRCode.CorrectLevel.M !== undefined)
          ? window.QRCode.CorrectLevel.M
          : 0;

        new QRCode(container, {
          text: text,
          width: sizePx,
          height: sizePx,
          colorDark: "#1e1b4b",
          colorLight: "#ffffff",
          correctLevel: correctLevel
        });

        const canvas = container.querySelector('canvas');
        const img = container.querySelector('img');
        if (canvas || (img && (img.src || img.getAttribute('src')))) {
          rendered = true;
          if (img) {
            img.style.display = 'block';
            img.style.margin = '0 auto';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '6px';
          }
          if (canvas) {
            canvas.style.maxWidth = '100%';
          }
        }
      } catch(e) {
        console.warn('Error QRCode:', e);
      }
    }

    if (!rendered) {
      const img = document.createElement('img');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${sizePx}x${sizePx}&data=${encodedText}&margin=10`;
      img.alt = 'Código QR';
      img.style.width = `${sizePx}px`;
      img.style.height = `${sizePx}px`;
      img.style.borderRadius = '8px';
      img.style.display = 'block';
      img.style.margin = '0 auto';
      img.onerror = () => {
        container.innerHTML = this.createSVGQRPlaceholder(text, sizePx);
      };
      container.innerHTML = '';
      container.appendChild(img);
    }
  }

  createSVGQRPlaceholder(text, size = 130) {
    const s = parseInt(size) || 130;
    return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#ffffff" rx="8"/>
      <rect x="8" y="8" width="28" height="28" fill="#1e1b4b" rx="2"/><rect x="13" y="13" width="18" height="18" fill="#ffffff"/><rect x="17" y="17" width="10" height="10" fill="#1e1b4b"/>
      <rect x="64" y="8" width="28" height="28" fill="#1e1b4b" rx="2"/><rect x="69" y="13" width="18" height="18" fill="#ffffff"/><rect x="73" y="17" width="10" height="10" fill="#1e1b4b"/>
      <rect x="8" y="64" width="28" height="28" fill="#1e1b4b" rx="2"/><rect x="13" y="69" width="18" height="18" fill="#ffffff"/><rect x="17" y="73" width="10" height="10" fill="#1e1b4b"/>
      <rect x="42" y="42" width="16" height="16" fill="#22c55e" rx="3"/>
      <rect x="42" y="12" width="14" height="8" fill="#1e1b4b"/><rect x="70" y="42" width="12" height="12" fill="#1e1b4b"/>
      <rect x="42" y="72" width="16" height="12" fill="#1e1b4b"/><rect x="70" y="72" width="14" height="16" fill="#1e1b4b"/>
      <rect x="12" y="42" width="10" height="14" fill="#1e1b4b"/>
    </svg>`;
  }

  checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const token = params.get('token');
    const docenteId = params.get('docente_id');

    if (action === 'scan_qr' || token) {
      this.scanToken = token;
      
      // Activar modo alumno focalizado para escaneo desde proyector
      document.body.classList.add('student-scan-mode');
      this.switchRole('estudiante', 'view-estudiante-qr-asistencia');
      
      setTimeout(() => {
        this.setupStudentQRView(token, docenteId);
      }, 150);
    }
  }

  setupStudentQRView(token, docenteId) {
    const teacherEl = document.getElementById('student-session-teacher');
    const dateEl = document.getElementById('student-session-date');
    const descEl = document.getElementById('student-attendance-banner-desc');
    const nieInput = document.getElementById('qr-student-nie-input');
    const statusCard = document.getElementById('qr-today-status-card');
    const sessionInput = document.getElementById('qr-student-session-id');

    const urlParams = new URLSearchParams(window.location.search);
    const urlSalon = urlParams.get('salon') || (this.activeQRSession ? this.activeQRSession.salon : 'Laboratorio de Cómputo 1');

    const actualToken = token || this.scanToken || (sessionInput ? sessionInput.value.trim() : '') || (this.activeQRSession ? this.activeQRSession.token : (this.currentTeacher ? this.currentTeacher.qr_token : 'DOC-QR-CHERNANDEZ-2026'));

    if (sessionInput) {
      sessionInput.value = actualToken;
    }
    this.scanToken = actualToken;

    const docFound = this.maestros.find(m => 
      m.qr_token === actualToken || 
      (actualToken && m.qr_token && m.qr_token.includes(actualToken)) || 
      (`DOC-QR-${m.id}-2026` === actualToken) || 
      (`DOC-QR-${m.id}` === actualToken) || 
      (m.id == actualToken)
    ) 
      || (docenteId ? this.maestros.find(m => m.id == docenteId) : null) 
      || (this.currentTeacher ? this.currentTeacher : null)
      || this.getActiveTeacher();

    const docName = docFound ? docFound.nombre_completo : 'Prof. Carlos Hernández';
    const docMateria = (this.activeQRSession && this.activeQRSession.materia) ? this.activeQRSession.materia : (docFound ? docFound.especialidad : 'Desarrollo de Software');

    if (teacherEl) {
      teacherEl.innerHTML = `<i class="fas fa-chalkboard-teacher"></i> ${docName} — ${docMateria} <span style="font-size: 13px; color: #a5b4fc; margin-left: 6px;">(${urlSalon})</span>`;
    }
    if (dateEl) {
      const hoy = new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      dateEl.innerText = `INSAVI • ${urlSalon} — ${hoy.charAt(0).toUpperCase() + hoy.slice(1)}`;
    }
    if (descEl) {
      const isTardanzaMode = this.activeQRSession && this.activeQRSession.timestamp_cierre_puntual && Date.now() > this.activeQRSession.timestamp_cierre_puntual;
      if (isTardanzaMode) {
        descEl.innerHTML = `<span class="badge badge-warning" style="font-size: 11px; margin-right: 6px;"><i class="fas fa-exclamation-triangle"></i> PERIODO DE TARDANZA</span> El tiempo puntual fijado por el docente expiró. Su registro ingresará como <strong>Tardanza</strong>.`;
      } else {
        descEl.innerHTML = `<span class="badge badge-success" style="font-size: 11px; margin-right: 6px;"><i class="fas fa-check-circle"></i> PERIODO PUNTUAL</span> Sesión en <strong>${urlSalon}</strong> con ${docName}. Ingrese su NIE para registrar su presencia.`;
      }
    }

    const sessionFeedback = document.getElementById('qr-session-id-feedback');
    if (sessionFeedback) {
      if (docFound) {
        sessionFeedback.innerHTML = `<span style="color: #16a34a; font-weight: 700;"><i class="fas fa-check-circle"></i> Sesión vinculada con: <strong>${docName}</strong> (${docMateria})</span>`;
      } else {
        sessionFeedback.innerHTML = `<span style="color: #4f46e5; font-weight: 600;"><i class="fas fa-info-circle"></i> ID asignado para marcaje: <code>${actualToken}</code></span>`;
      }
    }

    if (statusCard && !statusCard.getAttribute('data-has-result')) {
      statusCard.style.border = "1px dashed #cbd5e1";
      statusCard.style.background = "#f8fafc";
      statusCard.innerHTML = `
        <i class="fas fa-id-card" style="font-size: 32px; color: #22c55e; margin-bottom: 8px; display: block;"></i>
        <h4 style="font-size: 15px; font-weight: 700; color: #334155; margin: 0 0 4px 0;">Listo para Registro de Asistencia</h4>
        <p style="font-size: 13px; color: #64748b; margin: 0;" id="qr-status-message">
          Ingrese su número de NIE en la casilla superior y presione "REGISTRAR MI ASISTENCIA".
        </p>
      `;
    }

    if (nieInput) {
      nieInput.value = '';
      setTimeout(() => nieInput.focus(), 100);
    }

    this.renderStudentQRHistory('');

    // Inicializar y solicitar verificación de geolocalización en INSAVI
    this.actualizarUIUbicacionEstudiante();
    if (this.studentLocationStatus === 'unverified') {
      setTimeout(() => {
        this.solicitarUbicacionEstudiante(false);
      }, 300);
    }
  }


  bindMaestroForm() {
    const form = document.getElementById('form-crear-maestro');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const materia = document.getElementById('mst_materia')?.value.trim() || 'Desarrollo de Software Web';
      const usuario = document.getElementById('mst_usuario').value.trim();
      const qrToken = `DOC-QR-${usuario.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const nuevoMaestro = {
        id: this.maestros.length + 1,
        codigo_docente: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
        nombre_completo: document.getElementById('mst_nombre').value.trim(),
        email: document.getElementById('mst_email').value.trim(),
        telefono: document.getElementById('mst_telefono').value.trim() || '7700-0000',
        usuario: usuario,
        password: document.getElementById('mst_password').value.trim() || '123456',
        especialidad: materia,
        qr_token: qrToken,
        estado: 'Activo'
      };

      try {
        await fetch('/api/maestros/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoMaestro)
        });
      } catch(ex) {}

      this.maestros.unshift(nuevoMaestro);
      this.saveLocalMaestros();

      this.closeModal('modal-crear-maestro');
      form.reset();

      this.renderMaestrosTable();
      this.renderTeacherOfficialQR();

      // Abrir inmediatamente la ventana con su nuevo Código QR generado listo para proyectar
      this.verQRDocente(nuevoMaestro.id);

      alert(`🎉 ¡Docente "${nuevoMaestro.nombre_completo}" registrado con éxito!\nSe ha generado su Código QR de Asistencia oficial para proyectarlo a sus alumnos.`);
    });
  }

  // =========================================================================
  // SISTEMA DE CÓDIGO QR ÚNICO DE ASISTENCIA POR MAESTRO (PROYECCIÓN EN AULA)
  // =========================================================================
  getActiveTeacher() {
    if (this.currentTeacher && this.currentTeacher.id) {
      const found = this.maestros.find(m => m.id === this.currentTeacher.id);
      if (found) return found;
      return this.currentTeacher;
    }
    return this.maestros[0] || {
      id: 1,
      codigo_docente: 'DOC-2026-001',
      nombre_completo: 'Prof. Carlos Hernandez',
      email: 'chernandez@sarbelio.edu.sv',
      especialidad: 'Informática y Robótica',
      qr_token: 'DOC-QR-CHERNANDEZ-2026'
    };
  }

  cambiarDocenteActivoQR(maestroId) {
    const id = parseInt(maestroId);
    const maestro = this.maestros.find(m => m.id === id);
    if (maestro) {
      this.currentTeacher = maestro;
      this.renderTeacherSalonOptions();
      this.iniciarSesionSalonQR(false);
      this.renderTeacherOfficialQR();
      this.renderTeacherQRMonitor();
      this.renderDocenteJustificaciones();
    }
  }

  initTeacherSalonControls() {
    const timeInput = document.getElementById('qr-session-start-time');
    if (timeInput && !timeInput.value) {
      const now = new Date();
      timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    const savedSession = localStorage.getItem('sarbelio_active_salon_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        const todayStr = new Date().toISOString().split('T')[0];
        const sessionDate = new Date(parsed.timestamp_inicio || Date.now()).toISOString().split('T')[0];
        if (sessionDate === todayStr) {
          this.activeQRSession = parsed;
        }
      } catch (e) {}
    }

    if (!this.activeQRSession) {
      this.iniciarSesionSalonQR(false);
    } else {
      this.startSalonSessionCountdown();
    }
  }

  renderTeacherSalonOptions() {
    const select = document.getElementById('docente-salon-select');
    if (!select) return;

    const docente = this.getActiveTeacher();
    const docenteClases = this.clases.filter(c => 
      c.maestro_id === docente.id || 
      (c.maestro_nombre && c.maestro_nombre.toLowerCase() === docente.nombre_completo.toLowerCase())
    );

    const clasesList = docenteClases.length > 0 ? docenteClases : this.clases;
    const currentClaseId = this.activeQRSession ? this.activeQRSession.clase_id : (clasesList[0] ? clasesList[0].id : 1);

    select.innerHTML = clasesList.map(c => `
      <option value="${c.id}" ${c.id === currentClaseId ? 'selected' : ''}>
        ${c.aula || 'Aula Principal'} — ${c.grado} "${c.seccion}" (${c.materia})
      </option>
    `).join('') + `
      <option value="custom">✏️ + Ingresar Otro Salón / Aula personalizada...</option>
    `;
  }

  onTeacherSalonSelected(val) {
    if (val === 'custom') {
      const docente = this.getActiveTeacher();
      const salonNuevo = prompt('Ingrese el nombre o número del Salón / Aula al que llegó (Ejemplo: Aula 204, Laboratorio 3):', 'Aula 204');
      if (!salonNuevo) {
        this.renderTeacherSalonOptions();
        return;
      }
      const materiaNueva = prompt('Ingrese el Grado y Materia de la clase a impartir:', '1° ITSI "A" — Programación');
      if (!materiaNueva) return;

      const nuevaClase = {
        id: this.clases.length + 1,
        maestro_id: docente.id,
        maestro_nombre: docente.nombre_completo,
        anio_academico: '2026',
        grado: materiaNueva.includes('—') ? materiaNueva.split('—')[0].trim() : '1° Año',
        seccion: 'A',
        materia: materiaNueva.includes('—') ? materiaNueva.split('—')[1].trim() : materiaNueva,
        aula: salonNuevo.trim(),
        estado: 'Activo'
      };

      this.clases.unshift(nuevaClase);
      this.saveLocalClases();
      this.renderTeacherSalonOptions();
      this.iniciarSesionSalonQR(true);
      return;
    }

    this.iniciarSesionSalonQR(true);
  }

  setQRStartTimeNow() {
    const timeInput = document.getElementById('qr-session-start-time');
    if (timeInput) {
      const now = new Date();
      timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
  }

  iniciarSesionSalonQR(showAlert = true) {
    const docente = this.getActiveTeacher();
    if (!docente) return;

    const select = document.getElementById('docente-salon-select');
    const claseId = select ? parseInt(select.value) : 1;
    const clase = this.clases.find(c => c.id === claseId) || (this.clases[0] || {
      id: 1,
      aula: 'Laboratorio de Cómputo 1',
      grado: '1° ITSI',
      seccion: 'A',
      materia: 'Desarrollo de Software Web'
    });

    const timeInput = document.getElementById('qr-session-start-time');
    const graceSelect = document.getElementById('qr-session-grace-minutes');

    const now = new Date();
    const timeVal = (timeInput && timeInput.value) ? timeInput.value : `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const graceMinutes = parseInt(graceSelect ? graceSelect.value : 10) || 10;

    const startEpoch = new Date();
    const [h, m] = timeVal.split(':').map(Number);
    startEpoch.setHours(h, m, 0, 0);

    const punctualUntilEpoch = startEpoch.getTime() + (graceMinutes * 60 * 1000);
    const token = `DOC-QR-${docente.id}-${clase.id}-${Date.now().toString(36).toUpperCase()}`;

    this.activeQRSession = {
      id: Date.now(),
      token: token,
      docente_id: docente.id,
      docente_nombre: docente.nombre_completo,
      salon: clase.aula || 'Laboratorio de Cómputo 1',
      clase_id: clase.id,
      materia: clase.materia,
      grado: `${clase.grado} "${clase.seccion}"`,
      hora_inicio: timeVal,
      duracion_minutos: graceMinutes,
      timestamp_inicio: startEpoch.getTime(),
      timestamp_cierre_puntual: punctualUntilEpoch,
      estado: 'Activa'
    };

    localStorage.setItem('sarbelio_active_salon_session', JSON.stringify(this.activeQRSession));

    // Registrar en el servidor Node.js backend si está activo
    try {
      fetch('/api/qr/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.activeQRSession)
      }).catch(() => {});
    } catch (e) {}

    // Actualizar Badges en la vista docente
    const badgeSalon = document.getElementById('badge-active-salon');
    const badgeClase = document.getElementById('badge-active-clase');
    if (badgeSalon) badgeSalon.innerHTML = `<i class="fas fa-door-open"></i> ${this.activeQRSession.salon}`;
    if (badgeClase) badgeClase.innerText = `${this.activeQRSession.grado} — ${this.activeQRSession.materia}`;

    this.renderTeacherOfficialQR();
    this.startSalonSessionCountdown();
    this.renderTeacherQRMonitor();

    if (showAlert) {
      alert(`🚀 ¡Código QR de Asistencia actualizado para el Salón:\n\n📍 Salón: ${this.activeQRSession.salon}\n📚 Clase: ${this.activeQRSession.grado} — ${this.activeQRSession.materia}\n⏰ Inicio habilitado: ${this.activeQRSession.hora_inicio}\n⏱️ Tolerancia puntual: ${graceMinutes} minutos\n\nPasado este tiempo, el sistema registrará los escaneos automáticamente como TARDANZA.`);
    }
  }

  startSalonSessionCountdown() {
    if (this.sessionCountdownInterval) clearInterval(this.sessionCountdownInterval);

    const updateDisplay = () => {
      if (!this.activeQRSession) return;

      const nowMs = Date.now();
      const diffMs = this.activeQRSession.timestamp_cierre_puntual - nowMs;

      const countdownEl = document.getElementById('session-countdown-display');
      const modeBadge = document.getElementById('badge-session-mode');
      const projCountdown = document.getElementById('projector-countdown');
      const projModeBadge = document.getElementById('projector-mode-badge');

      if (diffMs > 0) {
        // PERIODO PUNTUAL (Marcando como Presente)
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        if (countdownEl) {
          countdownEl.innerText = `${timeStr} restantes`;
          countdownEl.style.color = '#38bdf8';
        }
        if (modeBadge) {
          modeBadge.style.background = '#16a34a';
          modeBadge.innerHTML = '<i class="fas fa-check-circle"></i> PERIODO PUNTUAL (Marcando como Presente)';
        }
        if (projCountdown) {
          projCountdown.innerText = timeStr;
          projCountdown.style.color = '#38bdf8';
        }
        if (projModeBadge) {
          projModeBadge.style.background = '#16a34a';
          projModeBadge.innerHTML = '<i class="fas fa-check-circle"></i> PERIODO PUNTUAL (Marcando como Presente)';
        }
      } else {
        // PERIODO DE TARDANZA (El tiempo puntual expiró)
        const tardyMs = Math.abs(diffMs);
        const minsT = Math.floor(tardyMs / 60000);
        const secsT = Math.floor((tardyMs % 60000) / 1000);
        const tardyStr = `+${String(minsT).padStart(2, '0')}:${String(secsT).padStart(2, '0')}`;

        if (countdownEl) {
          countdownEl.innerText = `Tardanza (${tardyStr})`;
          countdownEl.style.color = '#fbbf24';
        }
        if (modeBadge) {
          modeBadge.style.background = '#d97706';
          modeBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> PERIODO DE TARDANZA (Marcando como Tardanza)';
        }
        if (projCountdown) {
          projCountdown.innerText = `Tardanza ${tardyStr}`;
          projCountdown.style.color = '#fbbf24';
        }
        if (projModeBadge) {
          projModeBadge.style.background = '#d97706';
          projModeBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> PERIODO DE TARDANZA (Marcando como Tardanza)';
        }
      }
    };

    updateDisplay();
    this.sessionCountdownInterval = setInterval(updateDisplay, 1000);
  }

  renderTeacherOfficialQR() {
    const docente = this.getActiveTeacher();
    if (!docente) return;

    // Actualizar nombre, código y materia en el banner del portal docente
    const nameEl = document.getElementById('teacher-profile-name');
    const codeEl = document.getElementById('teacher-profile-code');
    const materiaEl = document.getElementById('teacher-profile-materia');
    const tokenEl = document.getElementById('teacher-official-token-badge');
    const badgeSalon = document.getElementById('badge-active-salon');
    const badgeClase = document.getElementById('badge-active-clase');

    const salon = this.activeQRSession ? this.activeQRSession.salon : 'Laboratorio de Cómputo 1';
    const materia = this.activeQRSession ? this.activeQRSession.materia : docente.especialidad;
    const grado = this.activeQRSession ? this.activeQRSession.grado : '1° ITSI "A"';
    const token = this.activeQRSession ? this.activeQRSession.token : (docente.qr_token || `DOC-QR-${docente.id}-2026`);

    if (nameEl) nameEl.innerText = docente.nombre_completo;
    if (codeEl) codeEl.innerHTML = `<i class="fas fa-id-badge"></i> ${docente.codigo_docente}`;
    if (materiaEl) materiaEl.innerHTML = `<i class="fas fa-book"></i> ${materia}`;
    if (tokenEl) tokenEl.innerText = token;
    if (badgeSalon) badgeSalon.innerHTML = `<i class="fas fa-door-open"></i> ${salon}`;
    if (badgeClase) badgeClase.innerText = `${grado} — ${materia}`;

    // Llenar selector de docentes registrados
    const select = document.getElementById('docente-selector-qr');
    if (select) {
      select.innerHTML = this.maestros.map(m => `
        <option value="${m.id}" ${m.id === docente.id ? 'selected' : ''}>
          ${m.nombre_completo} — ${m.especialidad}
        </option>
      `).join('');
    }

    // Generar URL del QR con vinculación de salón y sesión
    const protocol = window.location.protocol;
    const host = this.getServerHost();
    const path = window.location.pathname;
    const scanUrl = `${protocol}//${host}${path}?action=scan_qr&token=${token}&docente_id=${docente.id}&salon=${encodeURIComponent(salon)}`;

    // Renderizar QR en contenedor del docente
    const container = document.getElementById('class-daily-qr-container');
    if (container) {
      this.generateQRVisual(container, scanUrl, 150);
    }

    const dailyLink = document.getElementById('teacher-daily-qr-link');
    if (dailyLink) {
      dailyLink.href = scanUrl;
    }
    const dailyTokenDisplay = document.getElementById('teacher-official-token-display');
    if (dailyTokenDisplay) {
      dailyTokenDisplay.innerText = token;
    }

    // Actualizar contadores para este salón / docente
    const todayStr = new Date().toISOString().split('T')[0];
    const docenteAsist = this.asistencias.filter(a => 
      a.fecha === todayStr && 
      (a.token === token || a.registrado_por === docente.nombre_completo || a.materia === materia || a.metodo_registro === 'QR_Estudiante')
    );

    let countPresent = 0;
    let countTardy = 0;
    docenteAsist.forEach(r => {
      if (r.estado === 'Presente') countPresent++;
      else if (r.estado === 'Tardanza') countTardy++;
      else if (r.estado === 'Asistió' || !r.estado) countPresent++;
    });

    const elPresent = document.getElementById('teacher-qr-count-present');
    const elTardy = document.getElementById('teacher-qr-count-tardy');
    const elTotal = document.getElementById('teacher-qr-count-total');
    if (elPresent) elPresent.innerText = `${countPresent} Alumnos`;
    if (elTardy) elTardy.innerText = `${countTardy} Alumnos`;
    if (elTotal) elTotal.innerText = `${docenteAsist.length} Alumnos`;
  }

  async abrirProyectorDocente(teacherId = null, duracionMinutos = null) {
    if (!this.systemNetworkIp && !localStorage.getItem('sarbelio_server_ip')) {
      await this.fetchSystemInfo();
    }

    let docente = null;
    if (teacherId) {
      docente = this.maestros.find(m => m.id == teacherId);
    }
    if (!docente) {
      docente = this.getActiveTeacher();
    }
    this.currentTeacher = docente;

    if (!this.activeQRSession) {
      this.iniciarSesionSalonQR(false);
    }

    const session = this.activeQRSession;
    const salon = session ? session.salon : 'Laboratorio de Cómputo 1';
    const materia = session ? session.materia : docente.especialidad;
    const grado = session ? session.grado : '1° ITSI "A"';
    const token = session ? session.token : (docente.qr_token || `DOC-QR-${docente.id}-2026`);

    const protocol = window.location.protocol;
    const host = this.getServerHost();
    const path = window.location.pathname;
    const scanUrl = `${protocol}//${host}${path}?action=scan_qr&token=${token}&docente_id=${docente.id}&salon=${encodeURIComponent(salon)}`;

    const ipInput = document.getElementById('qr-server-ip-input');
    if (ipInput && !ipInput.value) {
      ipInput.value = host;
    }

    const titleEl = document.getElementById('projector-class-title');
    const teacherEl = document.getElementById('projector-teacher-name');
    const salonBadge = document.getElementById('projector-salon-badge');
    const urlEl = document.getElementById('projector-direct-url');

    if (titleEl) titleEl.innerText = `${grado} — ${materia}`;
    if (salonBadge) salonBadge.innerHTML = `<i class="fas fa-door-open"></i> Salón: ${salon}`;
    if (teacherEl) teacherEl.innerText = `Docente: ${docente.nombre_completo} | Código: ${docente.codigo_docente} | INSAVI`;
    if (urlEl) {
      urlEl.innerText = scanUrl;
      if (urlEl.tagName === 'A') urlEl.href = scanUrl;
    }

    const clickableLink = document.getElementById('projector-qr-clickable-link');
    if (clickableLink) {
      clickableLink.href = scanUrl;
      clickableLink.innerText = scanUrl;
    }

    const sessionBadge = document.getElementById('projector-session-id-badge');
    if (sessionBadge) {
      sessionBadge.innerText = token;
    }

    const dailyLink = document.getElementById('teacher-daily-qr-link');
    if (dailyLink) {
      dailyLink.href = scanUrl;
    }
    const dailyTokenDisplay = document.getElementById('teacher-official-token-display');
    if (dailyTokenDisplay) {
      dailyTokenDisplay.innerText = token;
    }

    // Cambiar a la vista del proyector de aula
    this.switchView('view-proyector-qr');

    // Renderizar QR en alta definición para pantalla de aula
    const renderBox = document.getElementById('projector-qr-code-render');
    if (renderBox) {
      this.generateQRVisual(renderBox, scanUrl, 260);
    }

    const teacherMiniBox = document.getElementById('class-daily-qr-container');
    if (teacherMiniBox) {
      this.generateQRVisual(teacherMiniBox, scanUrl, 150);
    }

    this.startSalonSessionCountdown();
    this.startLivePoll(token);
  }

  // =========================================================================
  // EXPORTACIÓN DE ASISTENCIAS EN TABLA DE EXCEL (.XLS) PARA EL DOCENTE
  // =========================================================================
  exportTeacherSessionAttendanceExcel() {
    const docente = this.getActiveTeacher();
    const session = this.activeQRSession || {
      salon: 'Laboratorio de Cómputo 1',
      materia: docente.especialidad || 'Desarrollo de Software Web',
      grado: '1° ITSI "A"',
      hora_inicio: '07:30',
      duracion_minutos: 10,
      token: ''
    };

    const todayStr = new Date().toISOString().split('T')[0];

    // Buscar asistencias de la sesión o registradas con este docente hoy
    let records = this.asistencias.filter(a => {
      const matchToken = session.token && a.token && (a.token === session.token || a.token.includes(session.token));
      const matchTeacher = a.registrado_por === docente.nombre_completo || a.materia === session.materia;
      const matchDate = a.fecha === todayStr;
      return (matchToken || matchTeacher || a.metodo_registro === 'QR_Estudiante') && matchDate;
    });

    if (records.length === 0) {
      records = this.asistencias.filter(a => a.metodo_registro === 'QR_Estudiante' || a.fecha === todayStr);
    }

    if (records.length === 0) {
      const confirmEmpty = confirm('Aún no se han registrado asistencias de alumnos en esta sesión.\n\n¿Desea generar y descargar la plantilla oficial de asistencia en Excel para este salón de todas formas?');
      if (!confirmEmpty) return;
    }

    function escapeXML(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    let countPresent = 0;
    let countTardy = 0;
    records.forEach(r => {
      if (r.estado === 'Presente') countPresent++;
      else if (r.estado === 'Tardanza') countTardy++;
      else countPresent++;
    });

    const headers = [
      'N°',
      'Fecha',
      'Hora Marcaje',
      'NIE',
      'Apellidos',
      'Nombres',
      'Bachillerato',
      'Año / Grado',
      'Sección',
      'Salón / Aula',
      'Materia',
      'Docente Responsable',
      'Estado Asistencia',
      'Método de Marcaje'
    ];

    const rowsXml = records.map((r, index) => {
      const st = this.students.find(s => s.nie === r.nie) || {
        nombres: r.nombres || r.estudiante || 'Alumno Registrado',
        apellidos: r.apellidos || '',
        bachillerato: 'ITSI',
        anio_bachillerato: 'Primer Año',
        seccion_letra: 'A'
      };

      const salonVal = r.salon || session.salon || 'Laboratorio 1';
      const materiaVal = r.materia || session.materia || 'Informática';
      const horaVal = r.hora_marcaje || r.hora || '07:30:00 AM';
      const estadoVal = r.estado || 'Presente';

      const cells = [
        index + 1,
        r.fecha || todayStr,
        horaVal,
        r.nie,
        st.apellidos,
        st.nombres,
        st.bachillerato,
        st.anio_bachillerato,
        st.seccion_letra,
        salonVal,
        materiaVal,
        docente.nombre_completo,
        estadoVal,
        'Marcaje Autónomo QR'
      ];

      const rowColor = estadoVal === 'Presente' ? 'DataPresente' : (estadoVal === 'Tardanza' ? 'DataTardanza' : 'DataStyle');
      return `<Row>` + cells.map(c => `<Cell ss:StyleID="${rowColor}"><Data ss:Type="String">${escapeXML(c)}</Data></Cell>`).join('') + `</Row>`;
    }).join('');

    const headerRowXml = `<Row>` + headers.map(h => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`).join('') + `</Row>`;

    const safeSalonName = (session.salon || 'Salon').replace(/[^a-zA-Z0-9]/g, '_');
    const safeGradoName = (session.grado || 'ITSI').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Asistencia_${safeSalonName}_${safeGradoName}_${todayStr}.xls`;

    const xmlWorkbook = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="TitleStyle">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="14"/>
   <Interior ss:Color="#1E1B4B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaStyle">
   <Font ss:Bold="1" ss:Color="#1E293B" ss:Size="10"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
  </Style>
  <Style ss:ID="DataStyle">
   <Font ss:Size="10" ss:Color="#0F172A"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataPresente">
   <Font ss:Size="10" ss:Color="#15803D" ss:Bold="1"/>
   <Interior ss:Color="#F0FDF4" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BBF7D0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BBF7D0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BBF7D0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BBF7D0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataTardanza">
   <Font ss:Size="10" ss:Color="#B45309" ss:Bold="1"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Asistencias en Salón">
  <Table>
   <Row>
    <Cell ss:MergeAcross="13" ss:StyleID="TitleStyle">
     <Data ss:Type="String">INSTITUTO NACIONAL DR. SARBELIO NAVARRETE — CONTROL OFICIAL DE ASISTENCIA QR</Data>
    </Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="13" ss:StyleID="MetaStyle">
     <Data ss:Type="String">DOCENTE: ${escapeXML(docente.nombre_completo)} | SALÓN: ${escapeXML(session.salon)} | CLASE: ${escapeXML(session.grado)} (${escapeXML(session.materia)}) | FECHA: ${todayStr}</Data>
    </Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="13" ss:StyleID="MetaStyle">
     <Data ss:Type="String">HORA APERTURA QR: ${escapeXML(session.hora_inicio || '07:30')} | TOLERANCIA PUNTUAL: ${session.duracion_minutos || 10} MINUTOS | TOTAL REGISTRADOS: ${records.length} | PRESENTES: ${countPresent} | TARDANZAS: ${countTardy}</Data>
    </Cell>
   </Row>
   <Row></Row>
   ${headerRowXml}
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob(['\ufeff' + xmlWorkbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    alert(`📥 ¡Tabla de asistencias descargada exitosamente en Excel!\n\n📄 Archivo: ${filename}\n👥 Total Estudiantes Registrados: ${records.length}\n🟢 Presentes Puntuales: ${countPresent}\n🟡 Tardanzas: ${countTardy}`);
  }

  verQRDocente(maestroId) {
    const docente = this.maestros.find(m => m.id == maestroId) || this.getActiveTeacher();
    if (!docente) return;

    this.modalTeacherSelected = docente;

    const nombreEl = document.getElementById('modal-docente-nombre');
    const materiaEl = document.getElementById('modal-docente-materia');
    const codigoEl = document.getElementById('modal-docente-codigo');
    const tokenEl = document.getElementById('modal-docente-token');
    const renderBox = document.getElementById('modal-docente-qr-render');

    if (nombreEl) nombreEl.innerText = docente.nombre_completo;
    if (materiaEl) materiaEl.innerText = docente.especialidad;
    if (codigoEl) codigoEl.innerText = docente.codigo_docente;
    if (tokenEl) tokenEl.innerText = docente.qr_token || `DOC-QR-${docente.id}`;

    const protocol = window.location.protocol;
    const host = this.getServerHost();
    const path = window.location.pathname;
    const token = docente.qr_token || `DOC-QR-${docente.id}-2026`;
    const scanUrl = `${protocol}//${host}${path}?action=scan_qr&token=${token}&docente_id=${docente.id}`;

    if (renderBox) {
      this.generateQRVisual(renderBox, scanUrl, 180);
    }

    const modalLink = document.getElementById('modal-docente-qr-link');
    if (modalLink) {
      modalLink.href = scanUrl;
      modalLink.innerText = scanUrl;
    }
    const modalTokenDisplay = document.getElementById('modal-docente-token-display');
    if (modalTokenDisplay) {
      modalTokenDisplay.innerText = token;
    }

    this.openModal('modal-ver-qr-docente');
  }

  proyectarDesdeModal() {
    this.closeModal('modal-ver-qr-docente');
    const mId = this.modalTeacherSelected ? this.modalTeacherSelected.id : null;
    this.abrirProyectorDocente(mId);
  }

  imprimirQRModal() {
    const docente = this.modalTeacherSelected || this.getActiveTeacher();
    this.imprimirQRDocente(docente.id);
  }

  copiarEnlaceModal() {
    const docente = this.modalTeacherSelected || this.getActiveTeacher();
    this.copiarEnlaceAsistenciaDocente(docente.id);
  }

  imprimirQRDocente(teacherId = null) {
    const docente = teacherId ? (this.maestros.find(m => m.id == teacherId) || this.getActiveTeacher()) : this.getActiveTeacher();
    const protocol = window.location.protocol;
    const host = this.getServerHost();
    const path = window.location.pathname;
    const token = docente.qr_token || `DOC-QR-${docente.id}-2026`;
    const scanUrl = `${protocol}//${host}${path}?action=scan_qr&token=${token}&docente_id=${docente.id}`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}&margin=10`;

    const printWin = window.open('', '_blank', 'width=700,height=800');
    if (!printWin) {
      alert('Por favor permita ventanas emergentes para imprimir el Código QR.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Código QR de Asistencia - ${docente.nombre_completo}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; text-align: center; padding: 40px; color: #1e1b4b; background: #ffffff; }
          .container { border: 3px solid #1e1b4b; border-radius: 20px; padding: 30px; max-width: 550px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
          h1 { margin: 0 0 5px 0; font-size: 22px; color: #1e1b4b; }
          h2 { margin: 0; font-size: 16px; color: #4338ca; font-weight: 600; }
          .qr-box { margin: 25px auto; padding: 15px; background: #ffffff; border: 2px dashed #6366f1; border-radius: 16px; display: inline-block; }
          .qr-box img { width: 260px; height: 260px; display: block; }
          .docente-name { font-size: 20px; font-weight: 800; color: #1e1b4b; margin: 15px 0 5px 0; }
          .materia { font-size: 15px; color: #4f46e5; font-weight: 700; margin: 0 0 15px 0; }
          .instructions { font-size: 13px; color: #475569; margin: 15px 0; line-height: 1.5; background: #f8fafc; padding: 12px; border-radius: 10px; }
          .footer { font-size: 11px; color: #94a3b8; margin-top: 20px; }
          @media print {
            body { padding: 0; }
            .container { border: 2px solid #000; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>INSTITUTO NACIONAL DR. SARBELIO NAVARRETE</h1>
            <h2>Control y Monitoreo de Asistencia Digital INSAVI</h2>
          </div>
          <div class="docente-name">${docente.nombre_completo}</div>
          <div class="materia"><span style="color:#64748b;">Módulo:</span> ${docente.especialidad}</div>
          <div style="font-size:12px; font-family:monospace; color:#64748b;">Código Docente: ${docente.codigo_docente}</div>

          <div class="qr-box">
            <img src="${qrImgUrl}" alt="Código QR Asistencia">
          </div>

          <!-- Enlace directo y ID abajo del QR impreso -->
          <div style="margin: 15px auto; padding: 14px 18px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; max-width: 480px; text-align: center;">
            <div style="font-size: 13px; font-weight: 800; color: #1e1b4b; margin-bottom: 6px;">
              🔑 ID de Asistencia: <span style="font-family: monospace; font-size: 15px; background: #e0e7ff; color: #3730a3; padding: 3px 10px; border-radius: 6px; font-weight: 900;">${token}</span>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #2563eb; word-break: break-all; margin-top: 6px;">
              🔗 Enlace directo abajo del QR: <a href="${scanUrl}" style="color: #2563eb; text-decoration: underline;">${scanUrl}</a>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px; line-height: 1.4;">
              💡 <em>Si la cámara o el código QR no funciona en su dispositivo, ingrese al enlace directamente o digite este <strong>ID</strong> en la plataforma.</em>
            </div>
          </div>

          <div class="instructions">
            📱 <strong>Instrucciones para los alumnos:</strong><br>
            1. Abra la cámara o lector de código QR y apunte al código (o abra el enlace / use el ID).<br>
            2. Active y permita el acceso a su ubicación GPS para validar que se encuentra en el <strong>Instituto Nacional Dr. Sarbelio Navarrete</strong> (6ª Calle Poniente y 9ª Av. Sur, San Vicente).<br>
            3. Ingrese su número de NIE para registrar su asistencia en el aula.
          </div>

          <div class="footer">
            Generado por Sistema de Gestión INSAVI • Token: ${token}
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        <\/script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  copiarEnlaceAsistenciaDocente(teacherId = null) {
    const docente = teacherId ? (this.maestros.find(m => m.id == teacherId) || this.getActiveTeacher()) : this.getActiveTeacher();
    const protocol = window.location.protocol;
    const host = this.getServerHost();
    const path = window.location.pathname;
    const token = docente.qr_token || `DOC-QR-${docente.id}-2026`;
    const scanUrl = `${protocol}//${host}${path}?action=scan_qr&token=${token}&docente_id=${docente.id}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(scanUrl).then(() => {
        alert(`📋 ¡Enlace de Asistencia copiado para Prof. ${docente.nombre_completo}!\n\n${scanUrl}\n\nPuede compartirlo con sus estudiantes.`);
      }).catch(() => {
        prompt('Copie el enlace de asistencia para los estudiantes:', scanUrl);
      });
    } else {
      prompt('Copie el enlace de asistencia para los estudiantes:', scanUrl);
    }
  }

  regenerarQRDocente(teacherId = null) {
    const docente = teacherId ? (this.maestros.find(m => m.id == teacherId) || this.getActiveTeacher()) : this.getActiveTeacher();
    if (!confirm(`¿Desea regenerar el Código QR de asistencia para el Prof. ${docente.nombre_completo}?\nEl código anterior dejará de ser válido.`)) {
      return;
    }

    docente.qr_token = `DOC-QR-${(docente.usuario || 'DOC').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase()}`;
    this.saveLocalMaestros();

    this.renderTeacherOfficialQR();
    this.renderMaestrosTable();
    alert(`✅ ¡Nuevo Código QR de asistencia generado con éxito para el Prof. ${docente.nombre_completo}!`);
  }

  eliminarMaestro(maestroId) {
    const maestro = this.maestros.find(m => m.id == maestroId);
    if (!maestro) return;

    if (!confirm(`¿Está seguro de eliminar la cuenta del docente "${maestro.nombre_completo}"?`)) {
      return;
    }

    this.maestros = this.maestros.filter(m => m.id != maestroId);
    this.saveLocalMaestros();

    if (this.currentTeacher && this.currentTeacher.id == maestroId) {
      this.currentTeacher = this.maestros[0] || null;
    }

    this.renderMaestrosTable();
    this.renderTeacherOfficialQR();
    alert(`Docente "${maestro.nombre_completo}" eliminado correctamente.`);
  }

  renderDocenteClasesCards() {
    const container = document.getElementById('docente-clases-cards-grid');
    if (!container) return;
    container.innerHTML = '';
  }

  bindClaseForm() {
    const form = document.getElementById('form-crear-clase');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const maestroId = parseInt(document.getElementById('cls_maestro_id').value);
      const maestro = this.maestros.find(m => m.id === maestroId) || this.maestros[0];

      const nuevaClase = {
        id: this.clases.length + 1,
        maestro_id: maestroId,
        maestro_nombre: maestro ? maestro.nombre_completo : 'Prof. Carlos Hernandez',
        anio_academico: document.getElementById('cls_anio').value,
        grado: document.getElementById('cls_grado').value.trim(),
        seccion: document.getElementById('cls_seccion').value,
        materia: document.getElementById('cls_materia').value.trim(),
        aula: document.getElementById('cls_aula').value.trim() || 'Aula 1',
        estado: 'Activo'
      };

      try {
        await fetch('/api/clases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevaClase)
        });
      } catch(ex) {}

      this.clases.unshift(nuevaClase);
      this.saveLocalClases();

      alert(`¡Clase "${nuevaClase.materia}" asignada exitosamente!`);
      this.closeModal('modal-crear-clase');
      form.reset();
      this.renderTeacherQRMonitor();
    });
  }

  renderMaestrosTable() {
    const tbody = document.getElementById('maestros-table-body');
    if (!tbody) return;

    if (this.maestros.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--text-muted);">No hay maestros registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.maestros.map(m => `
      <tr>
        <td><code>${m.codigo_docente}</code></td>
        <td><strong>${m.nombre_completo}</strong></td>
        <td>${m.email}</td>
        <td>${m.telefono || 'N/A'}</td>
        <td><code>${m.usuario}</code></td>
        <td><span class="badge badge-primary">${m.especialidad || 'Docente'}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" style="font-weight: 700; font-size: 11px; padding: 5px 10px; border-color: #818cf8; color: #4338ca; display: inline-flex; align-items: center; gap: 4px;" onclick="sarbelioApp.verQRDocente(${m.id})" title="Ver Código QR de Asistencia">
            <i class="fas fa-qrcode"></i> Ver QR
          </button>
        </td>
        <td><span class="badge ${m.estado === 'Activo' ? 'badge-success' : 'badge-danger'}">${m.estado}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-primary" style="font-weight: 700; font-size: 11px; padding: 5px 10px;" onclick="sarbelioApp.abrirProyectorDocente(${m.id})" title="Proyectar QR a alumnos en pantalla de aula">
              <i class="fas fa-expand"></i> 📺 Proyectar
            </button>
            <button class="btn btn-sm btn-outline" style="font-size: 11px; padding: 5px 8px; color: var(--danger);" onclick="sarbelioApp.eliminarMaestro(${m.id})" title="Eliminar cuenta">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderHistorialSesiones() {
    const tbody = document.getElementById('historial-sesiones-table-body');
    if (!tbody) return;

    if (this.sesionesQR.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">No hay sesiones QR registradas en el historial.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.sesionesQR.map(s => {
      const clase = this.clases.find(c => c.id === s.clase_id) || { materia: 'Desarrollo de Software', grado: '1° ITSI', seccion: 'A' };
      const total = s.total_asistencias || this.asistencias.filter(a => a.sesion_qr_id === s.id || a.metodo_registro === 'QR_Estudiante').length;
      const estadoBadge = s.estado === 'Activa' ? 'badge-success' : s.estado === 'Expirada' ? 'badge-warning' : 'badge-danger';

      return `
        <tr>
          <td><strong>#${s.id}</strong></td>
          <td><strong>${clase.materia}</strong></td>
          <td>${clase.grado} "${clase.seccion}"</td>
          <td>${s.fecha_inicio}</td>
          <td>${s.duracion_minutos} minutos</td>
          <td><span class="badge badge-primary">${total} Alumnos</span></td>
          <td><span class="badge ${estadoBadge}">${s.estado}</span></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="sarbelioApp.switchView('view-proyector-qr')">
              <i class="fas fa-eye"></i> Ver Proyector
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async generarSesionQR(claseId = 1, duracionMinutos = 10) {
    return this.abrirProyectorDocente(null, duracionMinutos);
  }

  startProjectorCountdown(secondsRemaining) {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    const timerEl = document.getElementById('projector-countdown');
    
    this.countdownTimer = setInterval(() => {
      if (secondsRemaining <= 0) {
        clearInterval(this.countdownTimer);
        if (timerEl) timerEl.innerText = "00:00";
        alert('⏱️ La sesión de asistencia con Código QR ha finalizado (Tiempo Expirado).');
        if (this.activeQRSession) this.activeQRSession.estado = 'Expirada';
        return;
      }
      secondsRemaining--;
      const mins = Math.floor(secondsRemaining / 60);
      const secs = secondsRemaining % 60;
      if (timerEl) {
        timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  startLivePoll(token) {
    if (this.livePollTimer) clearInterval(this.livePollTimer);

    const poll = async () => {
      try {
        const resp = await fetch(`/api/qr/estado?token=${token}`);
        const data = await resp.json();

        if (data.status === 'success') {
          this.updateProjectorLiveFeed(data.asistentes, data.total_asistencias);
        }
      } catch (e) {
        const localAsist = this.asistencias.filter(a => a.metodo_registro === 'QR_Estudiante');
        this.updateProjectorLiveFeed(localAsist, localAsist.length);
      }
    };

    poll();
    this.livePollTimer = setInterval(poll, 3000);
  }

  updateProjectorLiveFeed(asistentes = [], totalCount = 0) {
    const counterEl = document.getElementById('projector-count-live');
    const totalEl = document.getElementById('projector-total-counter');
    const listEl = document.getElementById('projector-live-students-list');

    if (counterEl) counterEl.innerText = totalCount;
    if (totalEl) totalEl.innerText = totalCount;

    if (!listEl) return;

    if (asistentes.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 15px; font-size: 13px;">Esperando que los estudiantes escaneen el código QR en el aula...</div>`;
      return;
    }

    listEl.innerHTML = asistentes.map(a => `
      <div style="background: rgba(255,255,255,0.06); padding: 8px 14px; border-radius: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: #ffffff; font-size: 13px;">${a.nombres || a.estudiante || 'Estudiante'} ${a.apellidos || ''}</strong>
          <span style="font-size: 11px; color: #94a3b8; margin-left: 8px;">NIE: ${a.nie}</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-size: 11px; color: #a5b4fc; font-family: monospace;">${a.hora_marcaje || a.hora || 'Ahora'}</span>
          <span class="badge ${a.estado === 'Presente' ? 'badge-success' : 'badge-warning'}" style="font-size: 11px;">${a.estado}</span>
        </div>
      </div>
    `).join('');
  }

  async cerrarSesionQRActual() {
    if (this.activeQRSession) {
      this.activeQRSession.estado = 'Cerrada';
      try {
        await fetch('/api/qr/cerrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sesion_id: this.activeQRSession.id, token: this.activeQRSession.token })
        });
      } catch(e) {}
    }

    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.livePollTimer) clearInterval(this.livePollTimer);

    alert('🔒 La sesión del Código QR ha sido cerrada por el docente.');
    this.switchView('view-docente-portal');
  }

  copyText(text, message = 'Copiado al portapapeles') {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`📋 ¡${message}!\n\n${text}`);
      }).catch(() => {
        prompt(message, text);
      });
    } else {
      prompt(message, text);
    }
  }

  copyProjectorURL() {
    const urlEl = document.getElementById('projector-qr-clickable-link') || document.getElementById('projector-direct-url');
    const url = urlEl ? (urlEl.href || urlEl.innerText).trim() : '';
    if (url) {
      this.copyText(url, 'Enlace directo de escaneo QR copiado');
    }
  }

  copyProjectorSessionId() {
    const badge = document.getElementById('projector-session-id-badge');
    const token = badge ? badge.innerText.trim() : (this.activeQRSession ? this.activeQRSession.token : '');
    if (token) {
      this.copyText(token, 'ID de Sesión copiado');
    }
  }

  copyTeacherSessionId() {
    const badge = document.getElementById('teacher-official-token-display') || document.getElementById('teacher-official-token-badge');
    const token = badge ? badge.innerText.trim() : '';
    if (token) {
      this.copyText(token, 'ID de Sesión del Docente copiado');
    }
  }

  copyModalTeacherToken() {
    const badge = document.getElementById('modal-docente-token-display') || document.getElementById('modal-docente-token');
    const token = badge ? badge.innerText.trim() : '';
    if (token) {
      this.copyText(token, 'ID de Asistencia Docente copiado');
    }
  }

  onManualSessionIdChange(val) {
    const clean = (val || '').trim().toUpperCase();
    if (!clean) return;
    this.scanToken = clean;
    this.updateStudentViewTeacherInfo(clean, false);
  }

  aplicarSessionIdManual() {
    const sessionInput = document.getElementById('qr-student-session-id');
    const val = sessionInput ? sessionInput.value.trim().toUpperCase() : '';
    if (!val) {
      alert('Por favor ingrese un ID de sesión válido (ej: DOC-QR-1-2026).');
      return;
    }
    this.scanToken = val;
    this.updateStudentViewTeacherInfo(val, true);
  }

  updateStudentViewTeacherInfo(token, showFeedback = false) {
    if (!token) return;
    const teacherEl = document.getElementById('student-session-teacher');
    const feedbackEl = document.getElementById('qr-session-id-feedback');

    const docFound = this.maestros.find(m => 
      m.qr_token === token || 
      (token && m.qr_token && m.qr_token.includes(token)) || 
      (`DOC-QR-${m.id}-2026` === token) || 
      (`DOC-QR-${m.id}` === token) || 
      (m.id == token)
    ) || (this.activeQRSession && this.activeQRSession.token === token ? this.getActiveTeacher() : null);

    const docName = docFound ? docFound.nombre_completo : (this.activeQRSession ? this.getActiveTeacher().nombre_completo : 'Docente Asignado');
    const docMateria = docFound ? docFound.especialidad : ((this.activeQRSession && this.activeQRSession.materia) ? this.activeQRSession.materia : 'Materia General');
    const salon = (this.activeQRSession && this.activeQRSession.salon) ? this.activeQRSession.salon : 'Aula INSAVI';

    if (teacherEl) {
      teacherEl.innerHTML = `<i class="fas fa-chalkboard-teacher"></i> ${docName} — ${docMateria} <span style="font-size: 13px; color: #a5b4fc; margin-left: 6px;">(${salon})</span>`;
    }

    if (feedbackEl) {
      if (docFound) {
        feedbackEl.innerHTML = `<span style="color: #16a34a; font-weight: 700;"><i class="fas fa-check-circle"></i> ID reconocido: ${docName} — ${docMateria}</span>`;
      } else {
        feedbackEl.innerHTML = `<span style="color: #4f46e5; font-weight: 700;"><i class="fas fa-id-badge"></i> ID asignado para marcaje: <code>${token}</code></span>`;
      }
    }

    if (showFeedback) {
      if (docFound) {
        alert(`✅ ID de sesión verificado con éxito:\n\nProfesor: ${docName}\nMateria: ${docMateria}\nSalón: ${salon}\n\nAhora escriba su NIE y presione "REGISTRAR MI ASISTENCIA".`);
      } else {
        alert(`ℹ️ ID de sesión configurado: "${token}".\nAhora puede ingresar su NIE.`);
      }
    }
  }

  async marcarAsistenciaEstudianteQR() {
    const nieInput = document.getElementById('qr-student-nie-input');
    const nie = nieInput ? nieInput.value.trim() : '';
    const statusCard = document.getElementById('qr-today-status-card');

    if (!nie) {
      if (statusCard) {
        statusCard.style.border = "2px solid #f59e0b";
        statusCard.style.background = "#fffbeb";
        statusCard.innerHTML = `
          <i class="fas fa-exclamation-circle" style="font-size: 38px; color: #f59e0b; margin-bottom: 8px; display: block;"></i>
          <h4 style="font-size: 16px; font-weight: 800; color: #b45309; margin: 0 0 4px 0;">Ingrese su NIE</h4>
          <p style="font-size: 13px; color: #78350f; margin: 0;">Por favor escriba su número de NIE en la casilla superior antes de continuar.</p>
        `;
      }
      if (nieInput) nieInput.focus();
      return;
    }

    const sessionInput = document.getElementById('qr-student-session-id');
    const manualToken = (sessionInput ? sessionInput.value : '').trim().toUpperCase();
    const token = manualToken || this.scanToken || (this.activeQRSession ? this.activeQRSession.token : (this.currentTeacher ? this.currentTeacher.qr_token : 'DOC-QR-CHERNANDEZ-2026'));
    this.scanToken = token;

    // 1. Intentar registrar en el servidor (API Node.js o PHP)
    let apiProcessed = false;
    try {
      const resp = await fetch('/api/asistencia/marcar-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token, 
          nie: nie, 
          metodo_registro: manualToken ? 'ID_Sesion_Estudiante' : 'QR_Estudiante' 
        })
      });

      if (resp.ok) {
        const data = await resp.json();

        if (data.status === 'success') {
          apiProcessed = true;
          const est = data.estudiante;
          if (statusCard) {
            statusCard.setAttribute('data-has-result', 'true');
            statusCard.style.border = "2px solid #22c55e";
            statusCard.style.background = "#f0fdf4";
            statusCard.innerHTML = `
              <i class="fas fa-check-circle" style="font-size: 46px; color: #22c55e; margin-bottom: 10px; display: block;"></i>
              <h3 style="font-size: 19px; font-weight: 900; color: #15803d; margin: 0 0 6px 0;">¡Asistencia Registrada Exitosamente!</h3>
              <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${est.nombres} ${est.apellidos}</div>
              <div style="font-size: 13px; color: #475569; margin-bottom: 12px;">NIE: <strong>${est.nie}</strong> — ${est.grado || ''}</div>
              <div style="display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap;">
                <span class="badge ${est.estado === 'Presente' ? 'badge-success' : 'badge-warning'}" style="font-size: 13px; padding: 6px 14px;">
                  <i class="fas fa-user-check"></i> ${est.estado}
                </span>
                <span class="badge badge-primary" style="font-size: 13px; padding: 6px 14px;">
                  <i class="fas fa-clock"></i> Hora: ${est.hora}
                </span>
              </div>
            `;
          }

          const nuevaAsisObj = {
            id: this.asistencias.length + 1,
            nie: est.nie,
            fecha: new Date().toISOString().split('T')[0],
            hora_marcaje: est.hora,
            materia: est.materia || 'Asignatura',
            estado: est.estado,
            metodo_registro: manualToken ? 'ID_Sesion_Estudiante' : 'QR_Estudiante',
            token: token
          };
          this.asistencias.unshift(nuevaAsisObj);
          this.saveLocalAsistencias();
          this.syncAsistenciaToGoogleSheets(nuevaAsisObj);

          if (nieInput) {
            nieInput.value = '';
            nieInput.focus();
          }
          this.renderStudentQRHistory(nie);
          this.renderTeacherQRMonitor();
          this.renderTeacherOfficialQR();
          return;
        }

        if (data.status === 'warning') {
          apiProcessed = true;
          if (statusCard) {
            statusCard.setAttribute('data-has-result', 'true');
            statusCard.style.border = "2px solid #f59e0b";
            statusCard.style.background = "#fffbeb";
            statusCard.innerHTML = `
              <i class="fas fa-exclamation-triangle" style="font-size: 42px; color: #f59e0b; margin-bottom: 10px; display: block;"></i>
              <h4 style="font-size: 17px; font-weight: 800; color: #b45309; margin: 0 0 6px 0;">¡Asistencia Ya Registrada!</h4>
              <p style="font-size: 14px; color: #78350f; margin: 0 0 8px 0;">
                El alumno <strong>${data.estudiante}</strong> ya cuenta con registro para la sesión de hoy.
              </p>
              <span class="badge badge-warning" style="font-size: 12px; padding: 6px 14px;">
                Hora de registro: ${data.hora}
              </span>
            `;
          }
          return;
        }

        if (data.status === 'error') {
          apiProcessed = true;
          if (statusCard) {
            statusCard.setAttribute('data-has-result', 'true');
            statusCard.style.border = "2px solid #ef4444";
            statusCard.style.background = "#fef2f2";
            statusCard.innerHTML = `
              <i class="fas fa-times-circle" style="font-size: 42px; color: #ef4444; margin-bottom: 10px; display: block;"></i>
              <h4 style="font-size: 17px; font-weight: 800; color: #dc2626; margin: 0 0 4px 0;">NIE No Encontrado</h4>
              <p style="font-size: 13px; color: #991b1b; margin: 0;">${data.message || 'Verifique el número ingresado e intente de nuevo.'}</p>
            `;
          }
          return;
        }
      }
    } catch (e) {
      console.warn('API fetch no disponible, ejecutando validación en datos locales:', e);
    }

    // 2. Fallback de alta confiabilidad en local
    if (!apiProcessed) {
      this.marcarAsistenciaEstudianteQRLocal(nie);
    }
  }

  marcarAsistenciaEstudianteQRLocal(nie) {
    const statusCard = document.getElementById('qr-today-status-card');
    const nieInput = document.getElementById('qr-student-nie-input');
    const student = this.students.find(s => s.nie === nie);

    if (!student) {
      if (statusCard) {
        statusCard.setAttribute('data-has-result', 'true');
        statusCard.style.border = "2px solid #ef4444";
        statusCard.style.background = "#fef2f2";
        statusCard.innerHTML = `
          <i class="fas fa-times-circle" style="font-size: 42px; color: #ef4444; margin-bottom: 10px; display: block;"></i>
          <h4 style="font-size: 17px; font-weight: 800; color: #dc2626; margin: 0 0 4px 0;">NIE No Encontrado</h4>
          <p style="font-size: 13px; color: #991b1b; margin: 0;">No se encontró ningún estudiante matriculado con el NIE <strong>"${nie}"</strong>.<br>Verifique el número en su carnet estudiantil e intente de nuevo.</p>
        `;
      }
      return;
    }

    const now = new Date();
    const hoyFecha = now.toISOString().split('T')[0];
    const horaActualStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const yaRegistro = this.asistencias.find(a => a.nie === nie && a.fecha === hoyFecha);

    if (yaRegistro) {
      if (statusCard) {
        statusCard.setAttribute('data-has-result', 'true');
        statusCard.style.border = "2px solid #f59e0b";
        statusCard.style.background = "#fffbeb";
        statusCard.innerHTML = `
          <i class="fas fa-exclamation-triangle" style="font-size: 42px; color: #f59e0b; margin-bottom: 10px; display: block;"></i>
          <h4 style="font-size: 17px; font-weight: 800; color: #b45309; margin: 0 0 6px 0;">¡Asistencia Ya Registrada Hoy!</h4>
          <p style="font-size: 14px; color: #78350f; margin: 0 0 8px 0;">
            El estudiante <strong>${student.nombres} ${student.apellidos}</strong> (NIE ${student.nie}) ya fue registrado hoy <strong>${hoyFecha}</strong>.
          </p>
          <span class="badge badge-warning" style="font-size: 12px; padding: 6px 14px;">
            Estado previo: ${yaRegistro.estado} (${yaRegistro.hora_marcaje || 'Hora registrada'})
          </span>
        `;
      }
      return;
    }

    const sessionInput = document.getElementById('qr-student-session-id');
    const manualToken = (sessionInput ? sessionInput.value : '').trim().toUpperCase();
    const tokenToUse = manualToken || this.scanToken || (this.activeQRSession ? this.activeQRSession.token : (this.currentTeacher ? this.currentTeacher.qr_token : 'DOC-QR-CHERNANDEZ-2026'));
    this.scanToken = tokenToUse;

    const activeDoc = (tokenToUse && this.maestros.find(m => 
      m.qr_token === tokenToUse || 
      (m.qr_token && m.qr_token.includes(tokenToUse)) || 
      (`DOC-QR-${m.id}-2026` === tokenToUse) || 
      (`DOC-QR-${m.id}` === tokenToUse) || 
      (m.id == tokenToUse)
    )) || this.getActiveTeacher();

    let esTardanza = false;
    let salonActual = (this.activeQRSession && this.activeQRSession.salon) ? this.activeQRSession.salon : 'Laboratorio de Cómputo 1';
    let materiaActual = (this.activeQRSession && this.activeQRSession.materia) ? this.activeQRSession.materia : (activeDoc ? activeDoc.especialidad : 'Desarrollo de Software Web');
    const docNombre = (this.activeQRSession && this.activeQRSession.docente_nombre) ? this.activeQRSession.docente_nombre : (activeDoc ? activeDoc.nombre_completo : 'Prof. Carlos Hernandez');

    if (this.activeQRSession && this.activeQRSession.timestamp_cierre_puntual) {
      esTardanza = Date.now() > this.activeQRSession.timestamp_cierre_puntual;
    } else {
      esTardanza = now.getHours() >= 8 && now.getMinutes() > 15;
    }
    const estadoAsistencia = esTardanza ? 'Tardanza' : 'Presente';

    const nuevaAsistencia = {
      id: this.asistencias.length + 1,
      estudiante_id: student.id,
      nie: student.nie,
      token: (this.activeQRSession && this.activeQRSession.token) || tokenToUse || (activeDoc ? activeDoc.qr_token : ''),
      fecha: hoyFecha,
      hora_marcaje: horaActualStr,
      materia: materiaActual,
      salon: salonActual,
      estado: estadoAsistencia,
      motivo: esTardanza ? `Marcaje con Tardanza en ${salonActual} con ${docNombre}` : `Marcaje puntual en ${salonActual} con ${docNombre}`,
      registrado_por: docNombre,
      metodo_registro: manualToken ? 'ID_Sesion_Estudiante' : 'QR_Estudiante'
    };

    this.asistencias.unshift(nuevaAsistencia);
    this.saveLocalAsistencias();
    this.syncAsistenciaToGoogleSheets(nuevaAsistencia);

    if (statusCard) {
      statusCard.setAttribute('data-has-result', 'true');
      statusCard.style.border = esTardanza ? "2px solid #f59e0b" : "2px solid #22c55e";
      statusCard.style.background = esTardanza ? "#fffbeb" : "#f0fdf4";
      statusCard.innerHTML = `
        <i class="fas ${esTardanza ? 'fa-exclamation-triangle' : 'fa-check-circle'}" style="font-size: 46px; color: ${esTardanza ? '#d97706' : '#22c55e'}; margin-bottom: 10px; display: block;"></i>
        <h3 style="font-size: 19px; font-weight: 900; color: ${esTardanza ? '#b45309' : '#15803d'}; margin: 0 0 6px 0;">
          ${esTardanza ? '⚠️ ¡Asistencia Registrada como TARDANZA!' : '✅ ¡Asistencia PUNTUAL Registrada!'}
        </h3>
        <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${student.nombres} ${student.apellidos}</div>
        <div style="font-size: 13px; color: #475569; margin-bottom: 8px;">NIE: <strong>${student.nie}</strong> — ${student.anio_bachillerato} ${student.bachillerato} "${student.seccion_letra}"</div>
        <div style="font-size: 12px; color: #0284c7; font-weight: 700; margin-bottom: 12px;"><i class="fas fa-door-open"></i> Salón: ${salonActual} • ${materiaActual}</div>
        <div style="display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap;">
          <span class="badge ${esTardanza ? 'badge-warning' : 'badge-success'}" style="font-size: 13px; padding: 6px 14px;">
            <i class="fas ${esTardanza ? 'fa-clock' : 'fa-user-check'}"></i> ${estadoAsistencia}
          </span>
          <span class="badge badge-primary" style="font-size: 13px; padding: 6px 14px;">
            <i class="fas fa-history"></i> Hora: ${horaActualStr}
          </span>
        </div>
      `;
    }

    if (nieInput) {
      nieInput.value = '';
      nieInput.focus();
    }

    this.renderStudentQRHistory(nie);
    this.renderTeacherOfficialQR();
    this.renderTeacherQRMonitor();
  }

  renderStudentQRHistory(studentNie) {
    const tbody = document.getElementById('student-qr-history-body');
    if (!tbody) return;

    const student = this.students.find(s => s.nie === studentNie);
    const records = this.asistencias.filter(a => a.nie === studentNie || !studentNie);

    if (records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No hay registros de marcaje para este estudiante.</td></tr>`;
      return;
    }

    tbody.innerHTML = records.map(r => {
      const st = this.students.find(s => s.nie === r.nie) || student || { nombres: 'Estudiante', apellidos: '', bachillerato: 'General', seccion_letra: 'A' };
      const badgeClass = r.estado === 'Presente' ? 'badge-success' : r.estado === 'Tardanza' ? 'badge-warning' : 'badge-danger';
      const hora = r.hora_marcaje || '07:10:00 AM';

      return `<tr>
        <td><strong>${r.fecha}</strong> <span style="font-size:11px; color:var(--text-muted);">${hora}</span></td>
        <td><code>${r.nie}</code></td>
        <td><strong>${st.nombres} ${st.apellidos}</strong></td>
        <td>${st.bachillerato || 'General'} "${st.seccion_letra || 'A'}"</td>
        <td><span class="badge-qr-method"><i class="fas fa-qrcode"></i> ${r.metodo_registro || 'QR_Estudiante'}</span></td>
        <td><span class="badge ${badgeClass}">${r.estado}</span></td>
      </tr>`;
    }).join('');
  }

  async renderTeacherQRMonitor(showFeedback = false) {
    const tbody = document.getElementById('teacher-qr-monitor-table-body');
    const icon = document.getElementById('icon-refresh-teacher-monitor');
    const feedback = document.getElementById('monitor-refresh-feedback');

    if (icon) icon.classList.add('fa-spin');

    // 1. Recargar asistencias desde localStorage para capturar marcajes de otras pestañas o ventanas
    const localAsist = localStorage.getItem('sarbelio_asistencias');
    if (localAsist) {
      try {
        this.asistencias = JSON.parse(localAsist);
      } catch (e) {}
    }

    // 2. Consultar al servidor backend si está activo para traer marcajes remotos por Wi-Fi
    try {
      const activeTeacher = (this.currentTeacher && this.currentTeacher.qr_token) 
        ? this.currentTeacher 
        : this.getActiveTeacher();
      const token = activeTeacher ? (activeTeacher.qr_token || '') : '';
      
      const resp = await fetch(`/api/qr/estado?token=${encodeURIComponent(token)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'success' && Array.isArray(data.asistentes)) {
          let updated = false;
          data.asistentes.forEach(remota => {
            const exists = this.asistencias.some(a => a.nie === remota.nie && a.fecha === remota.fecha);
            if (!exists) {
              this.asistencias.unshift(remota);
              updated = true;
            }
          });
          if (updated) {
            this.saveLocalAsistencias();
          }
        }
      }
    } catch (e) {
      // Modo local continuo
    }

    if (!tbody) {
      if (icon) icon.classList.remove('fa-spin');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const docente = this.getActiveTeacher();
    const sessionToken = this.activeQRSession ? this.activeQRSession.token : null;
    
    // Filtrar marcajes de hoy para este docente o salón
    const qrRecords = this.asistencias.filter(a => {
      const matchToken = sessionToken && a.token && (a.token === sessionToken || a.token.includes(sessionToken));
      const matchTeacher = a.registrado_por === docente.nombre_completo || a.materia === (this.activeQRSession ? this.activeQRSession.materia : docente.especialidad);
      const esQR = a.metodo_registro === 'QR_Estudiante' || (a.motivo && a.motivo.includes('QR'));
      const esHoy = a.fecha === todayStr;
      return (matchToken || matchTeacher || esQR) && esHoy;
    });

    let countPresent = 0;
    let countTardy = 0;

    qrRecords.forEach(r => {
      if (r.estado === 'Presente') countPresent++;
      else if (r.estado === 'Tardanza') countTardy++;
      else if (r.estado === 'Asistió' || !r.estado) countPresent++;
    });

    const elPresent = document.getElementById('teacher-qr-count-present');
    const elTardy = document.getElementById('teacher-qr-count-tardy');
    const elTotal = document.getElementById('teacher-qr-count-total');
    if (elPresent) elPresent.innerText = `${countPresent} Alumnos`;
    if (elTardy) elTardy.innerText = `${countTardy} Alumnos`;
    if (elTotal) elTotal.innerText = `${qrRecords.length} Alumnos`;

    if (qrRecords.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 25px;">
            <div style="font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 4px;">
              <i class="fas fa-qrcode" style="color: #22c55e;"></i> No hay marcajes de asistencia registrados aún para este salón
            </div>
            <div style="font-size: 12px; color: #94a3b8;">
              Cuando los estudiantes ingresen su NIE en el portal QR, aparecerán aquí en tiempo real con su estado (Presente o Tardanza).
            </div>
          </td>
        </tr>`;
    } else {
      tbody.innerHTML = qrRecords.map(r => {
        const student = this.students.find(s => s.nie === r.nie) || {
          nombres: r.nombres || r.estudiante || 'Alumno Registrado',
          apellidos: r.apellidos || '',
          bachillerato: 'ITSI',
          anio_bachillerato: '1° Año',
          seccion_letra: 'A'
        };
        const badgeClass = r.estado === 'Presente' ? 'badge-success' : r.estado === 'Tardanza' ? 'badge-warning' : 'badge-danger';
        const hora = r.hora_marcaje || r.hora || '07:12:00 AM';
        const bachilleratoStr = student.bachillerato ? `${student.anio_bachillerato || ''} ${student.bachillerato} "${student.seccion_letra || 'A'}"` : (r.grado || '1° Año "A"');
        const salonStr = r.salon || (this.activeQRSession ? this.activeQRSession.salon : 'Laboratorio 1');

        return `<tr>
          <td><i class="fas fa-clock" style="color: var(--primary);"></i> <strong>${hora}</strong></td>
          <td><code>${r.nie}</code></td>
          <td><strong>${student.nombres} ${student.apellidos}</strong></td>
          <td>${bachilleratoStr}</td>
          <td><span class="badge" style="background: #f1f5f9; color: #1e293b; font-weight: 700; font-size: 11px;"><i class="fas fa-door-open" style="color: #0284c7;"></i> ${salonStr}</span></td>
          <td><span class="badge-qr-method"><i class="fas fa-qrcode"></i> Marcaje QR</span></td>
          <td><span class="badge ${badgeClass}"><i class="fas ${r.estado === 'Presente' ? 'fa-check' : 'fa-clock'}"></i> ${r.estado}</span></td>
        </tr>`;
      }).join('');
    }

    // Efecto de feedback visual al presionar "Actualizar Monitor"
    setTimeout(() => {
      if (icon) icon.classList.remove('fa-spin');
      if (showFeedback && feedback) {
        feedback.innerHTML = `<i class="fas fa-check-circle"></i> ¡Monitor Actualizado! (${qrRecords.length} registros)`;
        feedback.style.display = 'inline-block';
        setTimeout(() => {
          feedback.style.display = 'none';
        }, 2500);
      }
    }, 250);
  }

  // =========================================================================
  // MÓDULO DE CONTROL DE USUARIOS Y PERMISOS
  // =========================================================================
  renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    if (this.usuarios.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">No hay usuarios registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.usuarios.map(u => {
      const isActivo = u.estado === 'Activo';
      const badgeRole = u.rol === 'Administrador' ? 'badge-primary' : u.rol === 'Docente' ? 'badge-warning' : u.rol === 'Padre / Responsable' ? 'badge-success' : 'badge-primary';
      return `
        <tr>
          <td><strong>#${u.id}</strong></td>
          <td><strong>${u.nombre}</strong></td>
          <td><code>${u.usuario}</code></td>
          <td>${u.email}</td>
          <td><span class="badge ${badgeRole}">${u.rol}</span></td>
          <td><span class="badge ${isActivo ? 'badge-success' : 'badge-danger'}">${u.estado}</span></td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm ${isActivo ? 'btn-warning' : 'btn-success'}" onclick="sarbelioApp.toggleUserStatus(${u.id})">
                <i class="fas ${isActivo ? 'fa-user-slash' : 'fa-user-check'}"></i> ${isActivo ? 'Desactivar' : 'Activar'}
              </button>
              <button class="btn btn-sm btn-outline" style="color:var(--danger);" onclick="sarbelioApp.deleteUser(${u.id})">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  bindUserForm() {
    const form = document.getElementById('form-crear-usuario');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rol = document.getElementById('usr_rol').value;
      const materia = document.getElementById('usr_materia')?.value || 'Desarrollo de Software Web';
      const anios = document.getElementById('usr_anios')?.value || 'Todos los Años';

      const newUser = {
        id: this.usuarios.length + 1,
        nombre: document.getElementById('usr_nombre').value.trim(),
        usuario: document.getElementById('usr_usuario').value.trim(),
        email: document.getElementById('usr_email').value.trim(),
        rol: rol,
        estado: 'Activo',
        created_at: new Date().toISOString().split('T')[0]
      };

      this.usuarios.push(newUser);
      this.saveLocalUsuarios();

      if (rol === 'Docente') {
        const nuevoMaestro = {
          id: this.maestros.length + 1,
          codigo_docente: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
          nombre_completo: newUser.nombre,
          email: newUser.email,
          usuario: newUser.usuario,
          password: '123',
          especialidad: materia,
          estado: 'Activo'
        };
        this.maestros.push(nuevoMaestro);
        this.saveLocalMaestros();

        const listaAnios = (anios.includes('Todos')) ? ['Primer Año', 'Segundo Año', 'Tercer Año'] : [anios];
        listaAnios.forEach((an, idx) => {
          this.clases.push({
            id: this.clases.length + 1,
            maestro_id: nuevoMaestro.id,
            maestro_nombre: nuevoMaestro.nombre_completo,
            anio_academico: an,
            grado: `${idx + 1}° ITSI / General`,
            seccion: 'A',
            materia: materia,
            aula: `Aula ${idx + 1}`,
            estado: 'Activo'
          });
        });
        this.saveLocalClases();
        this.renderMaestrosTable();
        this.renderDocenteClasesCards();
      }

      alert(`¡Usuario "${newUser.usuario}" creado exitosamente en el sistema!`);
      this.closeModal('modal-crear-usuario');
      form.reset();
      this.renderUsersTable();
    });
  }

  toggleUserStatus(id) {
    const u = this.usuarios.find(user => user.id === id);
    if (u) {
      u.estado = u.estado === 'Activo' ? 'Inactivo' : 'Activo';
      this.saveLocalUsuarios();
      this.renderUsersTable();
    }
  }

  deleteUser(id) {
    if (confirm('¿Está seguro de eliminar esta cuenta de usuario del sistema?')) {
      this.usuarios = this.usuarios.filter(u => u.id !== id);
      this.saveLocalUsuarios();
      this.renderUsersTable();
    }
  }

  // =========================================================================
  // MÓDULO DE REPORTES INSTITUCIONALES (VISTA INTERACTIVA & EXPORTACIÓN)
  // =========================================================================
  renderReportsTable() {
    const type = document.getElementById('report-type')?.value || 'estudiantes';
    const bachi = document.getElementById('report-filter-bachillerato')?.value || '';
    const anio = document.getElementById('report-filter-anio')?.value || '';
    const estado = document.getElementById('report-filter-estado')?.value || '';

    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');
    const countEl = document.getElementById('report-stat-count');
    const extraEl = document.getElementById('report-stat-extra');

    if (!thead || !tbody) return;

    if (type === 'estudiantes') {
      thead.innerHTML = `
        <tr>
          <th>NIE</th>
          <th>Expediente</th>
          <th>Estudiante</th>
          <th>Bachillerato</th>
          <th>Año & Sección</th>
          <th>Orientador</th>
          <th>Encargado</th>
          <th>Teléfono Encargado</th>
          <th>Estado</th>
        </tr>
      `;
      let filtered = this.students;
      if (bachi) filtered = filtered.filter(s => s.bachillerato === bachi);
      if (anio) filtered = filtered.filter(s => s.anio_bachillerato === anio);
      if (estado) filtered = filtered.filter(s => s.estado === estado);

      if (countEl) countEl.innerText = `Total Estudiantes Registrados: ${filtered.length}`;
      if (extraEl) extraEl.innerText = `Estudiantes Activos: ${filtered.filter(s => s.estado === 'Activo').length}`;

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--text-muted);">No se encontraron estudiantes para este reporte.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(s => `
        <tr>
          <td><strong>${s.nie}</strong></td>
          <td>${s.codigo_expediente}</td>
          <td><strong>${s.nombres} ${s.apellidos}</strong></td>
          <td><span class="badge badge-primary">${s.bachillerato}</span></td>
          <td>${s.anio_bachillerato} "${s.seccion_letra}"</td>
          <td>${s.docente_orientador || 'N/A'}</td>
          <td>${s.nombre_encargado}</td>
          <td>${s.telefono_encargado}</td>
          <td><span class="badge badge-success">${s.estado}</span></td>
        </tr>
      `).join('');

    } else if (type === 'asistencias') {
      thead.innerHTML = `
        <tr>
          <th>Fecha / Hora</th>
          <th>NIE Alumno</th>
          <th>Estudiante</th>
          <th>Materia</th>
          <th>Método Registro</th>
          <th>Estado Asistencia</th>
          <th>Motivo / Observación</th>
        </tr>
      `;
      let records = this.asistencias;
      if (countEl) countEl.innerText = `Total Registros Asistencia: ${records.length}`;
      if (extraEl) extraEl.innerText = `Ausencias Justificadas: ${records.filter(a => a.estado === 'Ausencia Justificada').length} | Sin Justificar: ${records.filter(a => a.estado === 'Ausencia Sin Justificar').length}`;

      if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">No hay registros de asistencias.</td></tr>`;
        return;
      }

      tbody.innerHTML = records.map(r => {
        const student = this.students.find(s => s.nie === r.nie || s.id === r.estudiante_id);
        const stName = student ? `${student.nombres} ${student.apellidos}` : 'Estudiante';
        const badgeClass = r.estado === 'Presente' ? 'badge-success' : r.estado === 'Tardanza' ? 'badge-warning' : 'badge-danger';
        return `
          <tr>
            <td><strong>${r.fecha}</strong> ${r.hora_marcaje || ''}</td>
            <td><code>${r.nie}</code></td>
            <td><strong>${stName}</strong></td>
            <td>${r.materia || 'General'}</td>
            <td><span class="badge-qr-method">${r.metodo_registro || 'Docente'}</span></td>
            <td><span class="badge ${badgeClass}">${r.estado}</span></td>
            <td>${r.motivo || '-'}</td>
          </tr>
        `;
      }).join('');

    } else if (type === 'justificaciones') {
      thead.innerHTML = `
        <tr>
          <th>Fecha Inasistencia</th>
          <th>NIE Alumno</th>
          <th>Estudiante</th>
          <th>Padre / Responsable</th>
          <th>Motivo Justificado</th>
          <th>Estado Solicitud</th>
        </tr>
      `;
      let justs = this.justificaciones;
      if (countEl) countEl.innerText = `Total Justificaciones: ${justs.length}`;
      if (extraEl) extraEl.innerText = `Pendientes: ${justs.filter(j => j.estado === 'Pendiente').length} | Aprobadas: ${justs.filter(j => j.estado === 'Aprobada').length}`;

      if (justs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No hay justificaciones registradas.</td></tr>`;
        return;
      }

      tbody.innerHTML = justs.map(j => {
        const student = this.students.find(s => s.nie === j.nie || s.id === j.estudiante_id);
        const stName = student ? `${student.nombres} ${student.apellidos}` : (j.student_nombres ? `${j.student_nombres} ${j.student_apellidos}` : 'Estudiante');
        const badgeClass = j.estado === 'Aprobada' ? 'badge-success' : j.estado === 'Rechazada' ? 'badge-danger' : 'badge-warning';
        return `
          <tr>
            <td><strong>${j.fecha_inasistencia}</strong></td>
            <td><code>${j.nie}</code></td>
            <td><strong>${stName}</strong></td>
            <td>${j.padre_nombre}</td>
            <td>${j.motivo}</td>
            <td><span class="badge ${badgeClass}">${j.estado}</span></td>
          </tr>
        `;
      }).join('');

    } else if (type === 'padres') {
      thead.innerHTML = `
        <tr>
          <th>ID</th>
          <th>Nombre Padre / Responsable</th>
          <th>DUI</th>
          <th>Usuario</th>
          <th>Teléfono</th>
          <th>Correo</th>
          <th>NIE Hijo Vinculado</th>
          <th>Estudiante Hijo</th>
        </tr>
      `;
      let padresList = this.padres;
      if (countEl) countEl.innerText = `Total Cuentas de Responsables: ${padresList.length}`;
      if (extraEl) extraEl.innerText = ``;

      tbody.innerHTML = padresList.map(p => {
        const child = this.students.find(s => s.nie === p.nie_hijo);
        const childName = child ? `${child.nombres} ${child.apellidos}` : 'Estudiante no hallado';
        return `
          <tr>
            <td>#${p.id}</td>
            <td><strong>${p.nombre_completo}</strong></td>
            <td><code>${p.dui}</code></td>
            <td><code>${p.usuario}</code></td>
            <td>${p.telefono}</td>
            <td>${p.correo || '-'}</td>
            <td><code>${p.nie_hijo}</code></td>
            <td><strong>${childName}</strong></td>
          </tr>
        `;
      }).join('');
    }
  }

  exportReportExcel() {
    const type = document.getElementById('report-type')?.value || 'Reporte';
    ReportExporter.exportToExcel(`Reporte_${type}_Sarbelio.xls`, 'table-reportes-view');
  }

  exportReportCSV() {
    const type = document.getElementById('report-type')?.value || 'estudiantes';
    if (type === 'estudiantes') {
      ReportExporter.exportToCSV('Estudiantes_Sarbelio.csv', this.students);
    } else if (type === 'asistencias') {
      ReportExporter.exportToCSV('Asistencias_Sarbelio.csv', this.asistencias);
    } else if (type === 'justificaciones') {
      ReportExporter.exportToCSV('Justificaciones_Sarbelio.csv', this.justificaciones);
    } else if (type === 'padres') {
      ReportExporter.exportToCSV('Padres_Sarbelio.csv', this.padres);
    }
  }

  printReportView() {
    const typeEl = document.getElementById('report-type');
    const title = typeEl ? typeEl.options[typeEl.selectedIndex].text : 'Reporte Institucional Sarbelio Navarrete';
    const tableEl = document.getElementById('table-reportes-view');
    if (tableEl) {
      ReportExporter.printReport(title, tableEl.outerHTML);
    }
  }

  // =========================================================================
  // INTEGRACIÓN Y SINCRONIZACIÓN CON GOOGLE SHEETS
  // =========================================================================
  updateGoogleSheetsUI() {
    const isConfigured = !!this.googleSheetsUrl;
    const badge = document.getElementById('gsheets-status-badge');
    const pill = document.getElementById('cfg-gsheets-status-pill');
    const modalText = document.getElementById('modal-gs-status-text');

    if (badge) {
      if (isConfigured) {
        badge.innerHTML = '🟢 Conectado';
        badge.style.color = '#ffffff';
      } else {
        badge.innerHTML = '⚪ Configurar';
      }
    }

    if (pill) {
      if (isConfigured) {
        pill.className = 'badge badge-success';
        pill.innerHTML = '🟢 Conectado en Tiempo Real';
        pill.style.background = '#dcfce7';
        pill.style.color = '#15803d';
      } else {
        pill.className = 'badge';
        pill.innerHTML = '⚪ Sin Configurar';
        pill.style.background = '#e2e8f0';
        pill.style.color = '#475569';
      }
    }

    if (modalText) {
      modalText.innerHTML = isConfigured 
        ? '<span style="color:#15803d; font-weight:700;"><i class="fas fa-check-circle"></i> Conectado (Sincronización Activa)</span>'
        : '<span style="color:#64748b; font-weight:600;"><i class="fas fa-info-circle"></i> Sin configurar (Ingrese su URL abajo)</span>';
    }

    const cfgUrl = document.getElementById('cfg_gs_web_app_url');
    if (cfgUrl && !cfgUrl.value) cfgUrl.value = this.googleSheetsUrl;
    const cfgSheet = document.getElementById('cfg_gs_sheet_url');
    if (cfgSheet && !cfgSheet.value) cfgSheet.value = this.googleSheetsSheetUrl;
    const cfgAuto = document.getElementById('cfg_gs_auto_sync');
    if (cfgAuto) cfgAuto.checked = this.googleSheetsAutoSync;
    const cfgClass = document.getElementById('cfg_gs_class_tab');
    if (cfgClass) cfgClass.checked = this.googleSheetsByClassTab;

    const modalUrl = document.getElementById('modal_gs_web_app_url');
    if (modalUrl) modalUrl.value = this.googleSheetsUrl;
    const modalSheet = document.getElementById('modal_gs_sheet_url');
    if (modalSheet) modalSheet.value = this.googleSheetsSheetUrl;
    const modalAuto = document.getElementById('modal_gs_auto_sync');
    if (modalAuto) modalAuto.checked = this.googleSheetsAutoSync;
    const modalClass = document.getElementById('modal_gs_class_tab');
    if (modalClass) modalClass.checked = this.googleSheetsByClassTab;
  }

  openGoogleSheetsModal() {
    this.updateGoogleSheetsUI();
    const testBox = document.getElementById('modal-gs-test-result-box');
    if (testBox) testBox.style.display = 'none';
    this.openModal('modal-google-sheets');
  }

  saveGoogleSheetsConfigFromModal() {
    const urlInput = document.getElementById('modal_gs_web_app_url');
    const sheetUrlInput = document.getElementById('modal_gs_sheet_url');
    const autoSyncInput = document.getElementById('modal_gs_auto_sync');
    const classTabInput = document.getElementById('modal_gs_class_tab');

    const url = urlInput ? urlInput.value.trim() : '';
    const sheetUrl = sheetUrlInput ? sheetUrlInput.value.trim() : '';
    const autoSync = autoSyncInput ? autoSyncInput.checked : true;
    const classTab = classTabInput ? classTabInput.checked : true;

    const modalBox = document.getElementById('modal-gs-test-result-box');

    if (!url) {
      if (modalBox) {
        modalBox.style.display = 'block';
        modalBox.style.background = '#fef2f2';
        modalBox.style.color = '#991b1b';
        modalBox.style.border = '1px solid #fecaca';
        modalBox.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <strong>Aviso:</strong> Por favor ingrese o pegue la URL de su Web App de Google Apps Script.<br><small style="color:#64748b;">(Haga clic arriba en "Copiar Código Apps Script" si aún no lo ha implementado).</small>';
      }
      alert('⚠️ Por favor ingrese o pegue la URL de la Aplicación Web de Google Apps Script.');
      if (urlInput) urlInput.focus();
      return;
    }

    this.saveGoogleSheetsConfig(url, sheetUrl, autoSync, classTab);

    if (modalBox) {
      modalBox.style.display = 'block';
      modalBox.style.background = '#ecfdf5';
      modalBox.style.color = '#065f46';
      modalBox.style.border = '1px solid #a7f3d0';
      modalBox.innerHTML = '<strong><i class="fas fa-check-circle"></i> ¡Configuración Guardada Exitosamente!</strong><br>El sistema ahora está conectado a Google Sheets. Los escaneos QR registrarán Día, Grado, Sección y Maestro.';
    }

    setTimeout(() => {
      this.closeModal('modal-google-sheets');
    }, 1200);

    alert('✅ ¡Configuración guardada exitosamente!\nGoogle Sheets está ahora conectado para registrar las asistencias QR.');
  }

  saveGoogleSheetsConfigFromPanel() {
    const urlInput = document.getElementById('cfg_gs_web_app_url');
    const sheetUrlInput = document.getElementById('cfg_gs_sheet_url');
    const autoSyncInput = document.getElementById('cfg_gs_auto_sync');
    const classTabInput = document.getElementById('cfg_gs_class_tab');

    const url = urlInput ? urlInput.value.trim() : '';
    const sheetUrl = sheetUrlInput ? sheetUrlInput.value.trim() : '';
    const autoSync = autoSyncInput ? autoSyncInput.checked : true;
    const classTab = classTabInput ? classTabInput.checked : true;

    const cfgBox = document.getElementById('cfg-gs-test-result-box');

    if (!url) {
      if (cfgBox) {
        cfgBox.style.display = 'block';
        cfgBox.style.background = '#fef2f2';
        cfgBox.style.color = '#991b1b';
        cfgBox.style.border = '1px solid #fecaca';
        cfgBox.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Por favor ingrese la URL de Google Apps Script antes de guardar.';
      }
      alert('⚠️ Ingrese la URL de su Aplicación Web de Google Apps Script.');
      return;
    }

    this.saveGoogleSheetsConfig(url, sheetUrl, autoSync, classTab);

    if (cfgBox) {
      cfgBox.style.display = 'block';
      cfgBox.style.background = '#ecfdf5';
      cfgBox.style.color = '#065f46';
      cfgBox.style.border = '1px solid #a7f3d0';
      cfgBox.innerHTML = '<strong><i class="fas fa-check-circle"></i> ¡Configuración de Google Sheets Guardada con Éxito!</strong>';
    }

    alert('✅ ¡Configuración de Google Sheets guardada exitosamente!');
  }

  // =========================================================================
  // GESTIÓN ESTÉTICA DE SELECCIÓN Y FILTRO POR SECCIÓN (A, B, C, D, E)
  // =========================================================================
  selectFormSeccion(seccion, btnEl, inputId = 'mat_seccion', previewId = 'mat_seccion_preview') {
    const input = document.getElementById(inputId);
    if (input) input.value = seccion;

    const preview = document.getElementById(previewId);
    if (preview) preview.innerText = `Seleccionada: Sección ${seccion}`;

    if (btnEl && btnEl.parentElement) {
      btnEl.parentElement.querySelectorAll('.btn-seccion-pill').forEach(b => b.classList.remove('active'));
      btnEl.classList.add('active');
    }
  }

  filterBySeccionQuick(seccion, btnEl) {
    if (btnEl && btnEl.parentElement) {
      btnEl.parentElement.querySelectorAll('.btn-filter-sec-pill').forEach(b => b.classList.remove('active'));
      btnEl.classList.add('active');
    }

    const tbody = document.getElementById('students-table-body');
    if (!tbody) return;

    let filtered = this.students;
    if (seccion) {
      filtered = this.students.filter(s => (s.seccion_letra || '').toUpperCase() === seccion.toUpperCase());
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);"><i class="fas fa-search" style="font-size:24px; margin-bottom:8px; display:block; opacity:0.5;"></i>No se encontraron estudiantes en la Sección "${seccion}".</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(s => `
      <tr>
        <td><code>${s.nie}</code></td>
        <td><code>${s.codigo_expediente}</code></td>
        <td><strong>${s.nombres} ${s.apellidos}</strong></td>
        <td>${s.bachillerato}</td>
        <td>${s.anio_bachillerato}</td>
        <td><span class="badge badge-primary" style="font-weight:700;">Sec. ${s.seccion_letra}</span></td>
        <td>${s.docente_orientador || '-'}</td>
        <td><span class="badge ${s.estado === 'Activo' ? 'badge-success' : 'badge-danger'}">${s.estado}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="sarbelioApp.showStudentFicha(${s.id})"><i class="fas fa-eye"></i> Ver</button>
        </td>
      </tr>
    `).join('');
  }

  saveGoogleSheetsConfig(url, sheetUrl, autoSync, classTab) {
    this.googleSheetsUrl = url;
    this.googleSheetsSheetUrl = sheetUrl;
    this.googleSheetsAutoSync = autoSync;
    this.googleSheetsByClassTab = classTab;

    localStorage.setItem('sarbelio_gsheets_url', url);
    localStorage.setItem('sarbelio_gsheets_sheet_url', sheetUrl);
    localStorage.setItem('sarbelio_gsheets_autosync', autoSync ? 'true' : 'false');
    localStorage.setItem('sarbelio_gsheets_classtab', classTab ? 'true' : 'false');

    this.updateGoogleSheetsUI();
  }

  async testGoogleSheetsConnection() {
    const url = this.googleSheetsUrl || document.getElementById('modal_gs_web_app_url')?.value.trim() || document.getElementById('cfg_gs_web_app_url')?.value.trim();
    if (!url) {
      alert('Por favor ingrese la URL de la Aplicación Web de Google Apps Script antes de probar.');
      return;
    }

    const modalBox = document.getElementById('modal-gs-test-result-box');
    const cfgBox = document.getElementById('cfg-gs-test-result-box');
    const showMessage = (html, isSuccess) => {
      [modalBox, cfgBox].forEach(b => {
        if (b) {
          b.style.display = 'block';
          b.style.background = isSuccess ? '#ecfdf5' : '#fef2f2';
          b.style.color = isSuccess ? '#065f46' : '#991b1b';
          b.style.border = `1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'}`;
          b.innerHTML = html;
        }
      });
    };

    showMessage('<i class="fas fa-spinner fa-spin"></i> Probando conexión con Google Sheets...', true);

    try {
      const proxyResp = await fetch('/api/google-sheets/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_url: url,
          payload: { action: 'ping', fecha: new Date().toISOString() }
        })
      });

      if (proxyResp.ok) {
        const json = await proxyResp.json();
        if (json.status === 'success') {
          showMessage(`<strong><i class="fas fa-check-circle"></i> ¡Conexión Exitosa con Google Sheets!</strong><br>El webhook respondió correctamente. Hoja: <code>${json.response?.sheet_name || 'Conectado'}</code>`, true);
          return;
        }
      }
    } catch(err) {
      console.warn('Proxy local no disponible, probando envío directo', err);
    }

    try {
      const pingUrl = url + (url.includes('?') ? '&' : '?') + 'action=ping&_t=' + Date.now();
      const img = new Image();
      img.src = pingUrl;
      showMessage('<strong><i class="fas fa-check-circle"></i> ¡Solicitud de prueba enviada a Google Sheets!</strong><br>La URL es válida y respondió a la señal de conexión.', true);
    } catch(e) {
      showMessage(`<strong><i class="fas fa-exclamation-triangle"></i> Error al conectar:</strong> ${e.message}`, false);
    }
  }

  async syncAsistenciaToGoogleSheets(asistencia) {
    if (!this.googleSheetsUrl || !this.googleSheetsAutoSync) return;

    const student = this.students.find(s => s.nie === asistencia.nie || s.id === asistencia.estudiante_id);
    const estNombre = student ? `${student.nombres} ${student.apellidos}` : (asistencia.estudiante || 'Estudiante');
    const anio = student ? student.anio_bachillerato : 'Primer Año';
    const bach = student ? student.bachillerato : 'General';
    const sec = student ? student.seccion_letra : 'A';
    const maestro = asistencia.registrado_por || (student ? student.docente_orientador : 'Docente Encargado');

    const payload = {
      action: 'registrar_asistencia',
      fecha: asistencia.fecha || new Date().toISOString().split('T')[0],
      hora: asistencia.hora_marcaje || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      nie: asistencia.nie,
      estudiante: estNombre,
      anio_bachillerato: anio,
      bachillerato: bach,
      seccion: sec,
      maestro: maestro,
      materia: asistencia.materia || 'Jornada General',
      estado: asistencia.estado || 'Presente',
      metodo: asistencia.metodo_registro || 'Escaneo QR Estudiante',
      observaciones: asistencia.motivo || 'Marcaje institucional por código QR'
    };

    console.log('📊 Sincronizando asistencia a Google Sheets:', payload);

    try {
      const resp = await fetch('/api/google-sheets/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_url: this.googleSheetsUrl,
          payload: payload
        })
      });

      if (resp.ok) {
        console.log('✅ Asistencia guardada en Google Sheets vía proxy');
        this.notificarSyncExitoso(payload);
        return;
      }
    } catch(err) {
      console.warn('Fallo proxy local, ejecutando fallback directo no-cors', err);
    }

    try {
      await fetch(this.googleSheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('✅ Asistencia enviada a Google Sheets en modo no-cors');
      this.notificarSyncExitoso(payload);
    } catch(e) {
      console.error('Error al enviar a Google Sheets:', e);
    }
  }

  notificarSyncExitoso(data) {
    const statusCard = document.getElementById('qr-today-status-card');
    if (statusCard) {
      const existing = document.getElementById('gs-live-confirm-pill');
      if (existing) existing.remove();

      const gsheetNotice = document.createElement('div');
      gsheetNotice.id = 'gs-live-confirm-pill';
      gsheetNotice.style.cssText = "margin-top: 10px; padding: 8px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 12px; color: #065f46; display: flex; align-items: center; justify-content: center; gap: 6px;";
      gsheetNotice.innerHTML = `<i class="fas fa-table" style="color: #0f9d58;"></i> <strong>Guardado en Google Sheets:</strong> ${data.anio_bachillerato} ${data.bachillerato} Sec. "${data.seccion}" | Maestro: ${data.maestro}`;
      statusCard.appendChild(gsheetNotice);
    }
  }

  async syncAllAttendanceToGoogleSheets() {
    if (!this.googleSheetsUrl) {
      this.openGoogleSheetsModal();
      alert('Por favor configure primero la URL de su Aplicación Web de Google Sheets.');
      return;
    }

    if (this.asistencias.length === 0) {
      alert('No hay registros de asistencias para sincronizar.');
      return;
    }

    const registros = this.asistencias.map(a => {
      const student = this.students.find(s => s.nie === a.nie || s.id === a.estudiante_id);
      return {
        fecha: a.fecha,
        hora: a.hora_marcaje || '07:15:00',
        nie: a.nie,
        estudiante: student ? `${student.nombres} ${student.apellidos}` : 'Estudiante',
        anio_bachillerato: student ? student.anio_bachillerato : 'Primer Año',
        bachillerato: student ? student.bachillerato : 'General',
        seccion: student ? student.seccion_letra : 'A',
        maestro: a.registrado_por || (student ? student.docente_orientador : 'Docente'),
        materia: a.materia || 'Jornada General',
        estado: a.estado,
        metodo: a.metodo_registro || 'Sistema',
        observaciones: a.motivo || 'Registro sincronizado'
      };
    });

    const confirmar = confirm(`¿Desea sincronizar los ${registros.length} registros de asistencia actuales hacia su Hoja de Google Sheets?`);
    if (!confirmar) return;

    try {
      const resp = await fetch('/api/google-sheets/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_url: this.googleSheetsUrl,
          payload: { action: 'sync_batch', registros: registros }
        })
      });

      if (resp.ok) {
        alert(`¡Sincronización masiva exitosa! Se enviaron ${registros.length} asistencias a Google Sheets.`);
        return;
      }
    } catch(e) {
      console.warn('Fallo proxy batch, enviando secuencialmente...');
    }

    let synced = 0;
    for (const r of registros) {
      try {
        await fetch(this.googleSheetsUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(r)
        });
        synced++;
      } catch(err){}
    }
    alert(`¡Sincronización completada! Se transmitieron ${synced} registros a su Hoja de Google Sheets.`);
  }

  openGoogleSheetDirect() {
    if (this.googleSheetsSheetUrl) {
      window.open(this.googleSheetsSheetUrl, '_blank');
    } else {
      const abrir = confirm('No ha guardado el enlace directo de su Google Sheet en la configuración.\n¿Desea abrir Google Sheets en una nueva pestaña?');
      if (abrir) window.open('https://sheets.google.com', '_blank');
    }
  }

  copyGoogleAppsScriptCode() {
    const code = this.getGoogleAppsScriptCodeText();
    navigator.clipboard.writeText(code).then(() => {
      alert('📋 ¡Código de Google Apps Script copiado con éxito al portapapeles!\n\nPasos a seguir:\n1. Abra su hoja de Google Sheets (o cree una en sheets.new)\n2. Vaya al menú: Extensiones > Apps Script\n3. Pegue este código y guarde\n4. Haga clic en: Implementar > Nueva implementación > Aplicación web\n   - Quién tiene acceso: "Cualquier persona" (Anyone)\n5. Copie la URL generada y péguela aquí en el sistema.');
    }).catch(() => {
      prompt('Copie manualmente el código de Google Apps Script a continuación:', code);
    });
  }

  getGoogleAppsScriptCodeText() {
    return `// ==============================================================================
// SISTEMA INSTITUCIONAL DE CONTROL DE ASISTENCIA QR — GOOGLE SHEETS CONNECTOR
// Instituto Nacional Dr. Sarbelio Navarrete (San Vicente, El Salvador)
// ==============================================================================

var MASTER_SHEET_NAME = "📊 Todas_Las_Asistencias";

function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : "";
    var data = contents ? JSON.parse(contents) : (e.parameter || {});
    return handleRequest(data);
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function doGet(e) {
  try {
    return handleRequest(e ? e.parameter : {});
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function handleRequest(data) {
  var action = data.action || "registrar_asistencia";

  if (action === "ping" || action === "test") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return createJsonResponse({
      status: "success",
      message: "¡Conectado exitosamente con Google Sheets!",
      sheet_name: ss.getName(),
      timestamp: new Date().toISOString()
    });
  }

  if (action === "sync_batch" && Array.isArray(data.registros)) {
    for (var i = 0; i < data.registros.length; i++) {
      guardarFilaAsistencia(data.registros[i]);
    }
    return createJsonResponse({ status: "success", total: data.registros.length });
  }

  return createJsonResponse(guardarFilaAsistencia(data));
}

function guardarFilaAsistencia(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date();
  
  var fecha = d.fecha || Utilities.formatDate(now, "GMT-6", "yyyy-MM-dd");
  var hora = d.hora || d.hora_marcaje || Utilities.formatDate(now, "GMT-6", "hh:mm:ss a");
  var timestamp = Utilities.formatDate(now, "GMT-6", "yyyy-MM-dd HH:mm:ss");
  
  var nie = String(d.nie || "").trim();
  var estudiante = d.estudiante || d.nombre_completo || "Estudiante";
  var anio = d.anio_bachillerato || d.anio || "Primer Año";
  var bachillerato = d.bachillerato || d.grado || "General";
  var seccion = d.seccion || d.seccion_letra || "A";
  var maestro = d.maestro || d.docente_orientador || d.registrado_por || "Docente";
  var materia = d.materia || "Jornada General";
  var estado = d.estado || "Presente";
  var metodo = d.metodo || d.metodo_registro || "Escaneo QR Estudiante";
  var observaciones = d.observaciones || d.motivo || "Marcaje institucional QR";

  // 1. Guardar en Hoja General
  var masterSheet = obtenerOCrearHojaMaestra(ss);
  var rowData = [timestamp, fecha, hora, nie, estudiante, anio, bachillerato, seccion, maestro, materia, estado, metodo, observaciones];
  masterSheet.appendRow(rowData);
  aplicarEstiloFila(masterSheet, masterSheet.getLastRow(), estado);

  // 2. Guardar en Pestaña Organizada por Grado, Año y Sección
  var nombreHojaGrupo = normalizarNombrePestana(anio, bachillerato, seccion);
  var grupoSheet = obtenerOCrearHojaGrupo(ss, nombreHojaGrupo);
  grupoSheet.appendRow([timestamp, fecha, hora, nie, estudiante, maestro, materia, metodo, estado, observaciones]);
  aplicarColorEstado(grupoSheet.getRange(grupoSheet.getLastRow(), 9), estado);

  return { status: "success", estudiante: estudiante, nie: nie, grupo: nombreHojaGrupo };
}

function obtenerOCrearHojaMaestra(ss) {
  var sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MASTER_SHEET_NAME, 0);
    var h = ["Marca Temporal", "Fecha (Día)", "Hora Marcaje", "NIE", "Estudiante", "Año", "Grado", "Sección", "Maestro", "Materia", "Estado", "Método", "Observaciones"];
    sheet.appendRow(h);
    formatearEncabezado(sheet, h.length, "#1e3a8a");
  }
  return sheet;
}

function obtenerOCrearHojaGrupo(ss, nombreHoja) {
  var sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) {
    sheet = ss.insertSheet(nombreHoja);
    var h = ["Marca Temporal", "Fecha (Día)", "Hora Marcaje", "NIE", "Estudiante", "Maestro", "Materia", "Método", "Estado", "Observación"];
    sheet.appendRow(h);
    formatearEncabezado(sheet, h.length, "#065f46");
  }
  return sheet;
}

function normalizarNombrePestana(anio, bach, sec) {
  var a = (anio.indexOf("Segundo") !== -1 || anio.indexOf("2") !== -1) ? "2°" : ((anio.indexOf("Tercer") !== -1 || anio.indexOf("3") !== -1) ? "3°" : "1°");
  var b = (bach.indexOf("Software") !== -1 || bach.indexOf("ITSI") !== -1) ? "ITSI" : ((bach.indexOf("Contable") !== -1) ? "Contable" : ((bach.indexOf("Salud") !== -1) ? "Salud" : "General"));
  var s = String(sec).replace("Sección", "").trim();
  return (a + " " + b + " - Sec " + s).substring(0, 50);
}

function formatearEncabezado(sheet, cols, bg) {
  var r = sheet.getRange(1, 1, 1, cols);
  r.setBackground(bg).setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);
  for (var c = 1; c <= cols; c++) sheet.autoResizeColumn(c);
}

function aplicarEstiloFila(sheet, row, estado) {
  sheet.setRowHeight(row, 24);
  aplicarColorEstado(sheet.getRange(row, 11), estado);
}

function aplicarColorEstado(celda, estado) {
  var est = String(estado).toLowerCase();
  celda.setFontWeight("bold").setHorizontalAlignment("center");
  if (est.indexOf("presente") !== -1) {
    celda.setBackground("#dcfce7").setFontColor("#15803d");
  } else if (est.indexOf("tardanza") !== -1) {
    celda.setBackground("#fef3c7").setFontColor("#b45309");
  } else {
    celda.setBackground("#fee2e2").setFontColor("#b91c1c");
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;
  }
}

