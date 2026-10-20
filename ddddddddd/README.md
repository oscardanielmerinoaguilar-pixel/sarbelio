# Sistema de Gestión de Fichas de Estudiantes y Portal Multirrol
## Instituto Nacional Dr. Sarbelio Navarrete (Proyecto Final de Módulo)

Este es el sistema web institucional optimizado para la gestión completa de fichas de estudiantes, matrículas multianuales, portal de responsables/padres de familia, consulta docente por NIE/Apellidos, control de asistencias (ausencias justificadas y sin justificar), justificaciones online y reportes imprimibles en formato Carta.

---

## 🌟 Novedades y Mejoras Implementadas (Superior a insavi.biz)

### 1. Barra Superior de Selección de Roles Instantánea
- **🏛️ Registro / Admin**: Acceso a dashboard global, tabla completa de estudiantes, asistente de matrícula de 6 pasos, historial de auditoría y configuración.
- **👨‍🏫 Docente**: Buscador rápido de fichas de estudiantes por **NIE** o por **Apellidos**, registro de asistencias diarias y formulario de observaciones psicopedagógicas.
- **🎓 Estudiante**: Portal de auto-registro para guardar la **Ficha de Matrícula** directamente en el servidor local (MySQL).
- **👨‍👩‍👧 Responsable (Padre de Familia)**: Portal familiar para consultar asistencias, ausencias justificadas/sin justificar, solicitar justificaciones online y revisar calificaciones.

### 2. Módulo de Registro de Asistencia Autónomo por Código QR (Estudiantes & Docentes)
- **📱 Marcaje Autónomo del Estudiante**: El alumno registra su propia asistencia escaneando el código QR proyectado en el aula o ingresando su NIE/Carnet Estudantil desde su dispositivo.
- **⏱️ Detección Automática de Puntualidad / Tardanza**: Clasifica automáticamente como `Presente` o `Tardanza` con hora exacta de marcaje.
- **👨‍🏫 Monitor Docente en Tiempo Real**: El maestro ya no toma lista manualmente persona por persona; la vista docente cuenta con un proyector de QR de clase y un monitor en tiempo real de asistencias registradas.
- **💳 Credencial y Carnet QR Digital**: Generación de códigos QR únicos por estudiante en la Ficha Institucional.

### 3. Portal del Responsable (Padre de Familia) — Con Función PLUS
- **Creación de Cuenta y Login**: Registro con Nombre, DUI, Usuario, Contraseña, Teléfono y NIE del Hijo/a.
- **Control de Asistencias**: Tarjetas estadísticas y desglose en tabla de ausencias **Justificadas (verde)** y **Sin Justificar (rojo)**.
- **Solicitud de Justificación Online**: El padre puede redactar el motivo de inasistencia (cita médica, enfermedad) y enviarlo al docente/orientador para su aprobación.
- **Plus 1 — Boleta de Calificaciones**: Consulta del rendimiento por periodos académicos.
- **Plus 2 — Bitácora del Docente**: Avisos y observaciones registradas por los profesores.
- **Plus 3 — Impresión de Ficha Carta**: Generación del documento imprimible en formato Carta.

### 4. Búsqueda de Fichas por Docente (por NIE o Apellidos)
- El docente puede buscar la ficha de cualquier estudiante ingresando su **NIE** o **Apellidos**.
- Monitor en vivo de asistencias marcadas por los alumnos vía QR.
- Aprobar o rechazar solicitudes de justificación enviadas por los padres.

### 4. Formulario de Ficha de Matrícula del Estudiante (I. Identificación)
Incluye todos los campos requeridos:
- **Bachillerato**: General, Administrativo Contable, ITSI (Software), Turismo, Salud, Automotriz.
- **Año**: Primer Año, Segundo Año, Tercer Año.
- **Sección**: A, B, C, D, E.
- **Nombre Completo**, **NIE**, **Edad**.
- **Docente Encargado (Orientador)**.
- **Nombre Encargado**, **DUI Encargado**, **Teléfono**.
- **Dirección**, **Con quién vive**, **Correo**.
- **¿Repite?** (No / Sí).
- **Discapacidad** (Ninguna, Visual, Auditiva, Motora, Intelectual, Otra).
- **Trastorno** (Ninguno, TDAH, Espectro Autista, Dislexia, Ansiedad, Otro).

---

## 🔑 Credenciales de Acceso para Demostración

| Rol / Módulo | Usuario / Identificador | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin` | `admin123` |
| **Docente Orientador** | `mrodriguez` | `admin123` |
| **Padre / Responsable (Demostración 1)** | `02345678-4` (o `roberto.padre`) | `123456` |
| **Padre / Responsable (Demostración 2)** | `01987654-2` (o `ana.padre`) | `123456` |

---

## 🛠️ Instalación y Base de Datos MySQL

1. Importe el archivo `database/database.sql` en su servidor de MySQL / phpMyAdmin.
2. Abra `public/index.html` en su navegador o ejecute su servidor PHP / Node local.
