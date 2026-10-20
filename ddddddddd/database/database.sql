-- ============================================================================
-- SISTEMA DE GESTIÓN DE FICHAS DE ESTUDIANTES
-- INSTITUTO NACIONAL DR. SARBELIO NAVARRETE
-- Base de Datos MySQL 8.0+ (Con soporte para Padre/Responsable, Matrícula Estudiante y Docente)
-- Codificación: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `instituto_sarbelio` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `instituto_sarbelio`;

-- ----------------------------------------------------------------------------
-- 1. TABLA: roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(50) NOT NULL UNIQUE,
  `descripcion` VARCHAR(255) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Administrador', 'Acceso total y gestión completa del sistema'),
(2, 'Personal Administrativo', 'Gestión de registros, matrículas, encargados y reportes'),
(3, 'Docente', 'Consulta de estudiantes, fichas, pase de lista y observaciones'),
(4, 'Estudiante', 'Auto-registro y consulta de Ficha de Matrícula'),
(5, 'Padre / Responsable', 'Portal familiar de consulta de inasistencias, notas y justificaciones')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- ----------------------------------------------------------------------------
-- 2. TABLA: usuarios
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `usuario` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol_id` INT NOT NULL,
  `estado` ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `email`, `password`, `rol_id`, `estado`) VALUES
(1, 'Administrador Principal', 'admin', 'admin@sarbelio.edu.sv', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe11y.uC1n/12j7uA6W/1hP4F/y3H1q3S', 1, 'Activo'),
(2, 'Licda. Maria Rodriguez', 'mrodriguez', 'mrodriguez@sarbelio.edu.sv', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe11y.uC1n/12j7uA6W/1hP4F/y3H1q3S', 2, 'Activo'),
(3, 'Prof. Carlos Hernandez', 'chernandez', 'chernandez@sarbelio.edu.sv', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe11y.uC1n/12j7uA6W/1hP4F/y3H1q3S', 3, 'Activo')
ON DUPLICATE KEY UPDATE `usuario` = VALUES(`usuario`);

-- ----------------------------------------------------------------------------
-- 3. TABLA: estudiantes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `estudiantes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_expediente` VARCHAR(20) NOT NULL UNIQUE,
  `nie` VARCHAR(20) NOT NULL UNIQUE,
  `nombres` VARCHAR(100) NOT NULL,
  `apellidos` VARCHAR(100) NOT NULL,
  `fecha_nacimiento` DATE NOT NULL,
  `edad` INT NULL,
  `sexo` ENUM('Masculino', 'Femenino') NOT NULL,
  `bachillerato` VARCHAR(100) NOT NULL DEFAULT 'General',
  `anio_bachillerato` VARCHAR(50) NOT NULL DEFAULT 'Primer Año',
  `seccion_letra` VARCHAR(10) NOT NULL DEFAULT 'A',
  `docente_orientador` VARCHAR(150) NULL,
  `nombre_encargado` VARCHAR(150) NULL,
  `dui_encargado` VARCHAR(20) NULL,
  `telefono_encargado` VARCHAR(20) NULL,
  `direccion` TEXT NOT NULL,
  `con_quien_vive` VARCHAR(100) DEFAULT 'Padre y Madre',
  `correo` VARCHAR(100) NULL,
  `repite` ENUM('No', 'Sí') DEFAULT 'No',
  `discapacidad` VARCHAR(100) DEFAULT 'Ninguna',
  `trastorno` VARCHAR(100) DEFAULT 'Ninguno',
  `fotografia` VARCHAR(255) NULL DEFAULT 'default_student.png',
  `estado` ENUM('Activo', 'Retirado', 'Graduado', 'Inactivo') NOT NULL DEFAULT 'Activo',
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_estudiantes_nie` (`nie`),
  INDEX `idx_estudiantes_expediente` (`codigo_expediente`),
  INDEX `idx_estudiantes_nombres` (`nombres`, `apellidos`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABLA: padres_familia (Cuentas de Responsables)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `padres_familia` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_completo` VARCHAR(150) NOT NULL,
  `dui` VARCHAR(20) NOT NULL UNIQUE,
  `usuario` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(20) NOT NULL,
  `correo` VARCHAR(100) NULL,
  `nie_hijo` VARCHAR(20) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. TABLA: asistencias (Registro Autónomo por QR y Control Institucional)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asistencias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `estudiante_id` INT NOT NULL,
  `clase_id` INT NULL,
  `sesion_qr_id` INT NULL,
  `fecha` DATE NOT NULL,
  `hora_marcaje` TIME NULL,
  `materia` VARCHAR(100) DEFAULT 'General',
  `estado` ENUM('Presente', 'Tardanza', 'Ausencia Justificada', 'Ausencia Sin Justificar') NOT NULL DEFAULT 'Presente',
  `motivo` TEXT NULL,
  `registrado_por` VARCHAR(100) DEFAULT 'QR_Estudiante',
  `metodo_registro` ENUM('QR_Estudiante', 'Docente', 'Sistema') DEFAULT 'QR_Estudiante',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_asistencias_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. TABLA: justificaciones_padres (Solicitudes de Justificación por el Padre)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `justificaciones_padres` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `estudiante_id` INT NOT NULL,
  `padre_dui` VARCHAR(20) NOT NULL,
  `fecha_inasistencia` DATE NOT NULL,
  `motivo` TEXT NOT NULL,
  `estado` ENUM('Pendiente', 'Aprobada', 'Rechazada') NOT NULL DEFAULT 'Pendiente',
  `fecha_solicitud` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_justificaciones_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TABLA: observaciones_docente (Ficha Psicopedagógica y Conducta del Maestro)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `observaciones_docente` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `estudiante_id` INT NOT NULL,
  `docente_nombre` VARCHAR(150) NOT NULL,
  `tipo` ENUM('Conducta', 'Académica', 'Psicopedagógica', 'Excelente') NOT NULL DEFAULT 'Conducta',
  `observacion` TEXT NOT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_observaciones_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. TABLA: maestros (Gestión de Docentes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `maestros` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_docente` VARCHAR(20) NOT NULL UNIQUE,
  `nombre_completo` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `telefono` VARCHAR(20) NULL,
  `usuario` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `especialidad` VARCHAR(100) DEFAULT 'Docente',
  `qr_token` VARCHAR(64) NOT NULL UNIQUE,
  `estado` ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. TABLA: clases (Asignación y Creación de Clases por Maestro)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `maestro_id` INT NOT NULL,
  `anio_academico` VARCHAR(50) NOT NULL DEFAULT 'Primer Año',
  `grado` VARCHAR(50) NOT NULL,
  `seccion` VARCHAR(10) NOT NULL DEFAULT 'A',
  `materia` VARCHAR(100) NOT NULL,
  `aula` VARCHAR(50) NULL DEFAULT 'Aula 1',
  `estado` ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_clases_maestros` FOREIGN KEY (`maestro_id`) REFERENCES `maestros` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. TABLA: sesiones_qr (Sesiones Activas de Asistencia por Código QR)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sesiones_qr` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `maestro_id` INT NOT NULL,
  `clase_id` INT NOT NULL,
  `token` VARCHAR(64) NOT NULL UNIQUE,
  `duracion_minutos` INT NOT NULL DEFAULT 10,
  `fecha_inicio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` DATETIME NOT NULL,
  `estado` ENUM('Activa', 'Expirada', 'Cerrada') NOT NULL DEFAULT 'Activa',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sesiones_maestros` FOREIGN KEY (`maestro_id`) REFERENCES `maestros` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sesiones_clases` FOREIGN KEY (`clase_id`) REFERENCES `clases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- INSERCIONES DEMO PARA MAESTROS Y CLASES
-- ----------------------------------------------------------------------------
INSERT INTO `maestros` (`id`, `codigo_docente`, `nombre_completo`, `email`, `telefono`, `usuario`, `password`, `especialidad`, `qr_token`, `estado`) VALUES
(1, 'DOC-2026-001', 'Prof. Carlos Hernandez', 'chernandez@sarbelio.edu.sv', '7788-9900', 'chernandez', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe11y.uC1n/12j7uA6W/1hP4F/y3H1q3S', 'Informática y Robótica', 'DOC-QR-CHERNANDEZ-2026', 'Activo'),
(2, 'DOC-2026-002', 'Licda. Maria Rodriguez', 'mrodriguez@sarbelio.edu.sv', '7654-3210', 'mrodriguez', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe11y.uC1n/12j7uA6W/1hP4F/y3H1q3S', 'Lenguaje y Literatura', 'DOC-QR-MRODRIGUEZ-2026', 'Activo')
ON DUPLICATE KEY UPDATE `nombre_completo` = VALUES(`nombre_completo`), `qr_token` = VALUES(`qr_token`);

INSERT INTO `clases` (`id`, `maestro_id`, `anio_academico`, `grado`, `seccion`, `materia`, `aula`) VALUES
(1, 1, 'Primer Año', '1° ITSI', 'A', 'Desarrollo de Software', 'Laboratorio 1'),
(2, 1, 'Primer Año', '1° ITSI', 'A', 'Mantenimiento de Computadoras', 'Laboratorio 2'),
(3, 2, 'Primer Año', '1° General', 'A', 'Lenguaje y Literatura', 'Aula 104')
ON DUPLICATE KEY UPDATE `materia` = VALUES(`materia`);


-- ----------------------------------------------------------------------------
-- DATOS DE PRUEBA (DEMO SEED DATA)
-- ----------------------------------------------------------------------------
INSERT INTO `estudiantes` (`id`, `codigo_expediente`, `nie`, `nombres`, `apellidos`, `fecha_nacimiento`, `edad`, `sexo`, `bachillerato`, `anio_bachillerato`, `seccion_letra`, `docente_orientador`, `nombre_encargado`, `dui_encargado`, `telefono_encargado`, `direccion`, `con_quien_vive`, `correo`, `repite`, `discapacidad`, `trastorno`, `estado`, `observaciones`) VALUES
(1, 'EXP-2026-001', '8492015', 'Carlos Eduardo', 'Alvarado Gomez', '2008-05-14', 17, 'Masculino', 'ITSI', 'Primer Año', 'A', 'Prof. Carlos Hernandez', 'Roberto Carlos Alvarado Perez', '02345678-4', '7744-1122', 'Barrio El Calvario, Av. Crespo #14', 'Padre y Madre', 'carlos.alvarado@estudiante.edu.sv', 'No', 'Ninguna', 'Ninguno', 'Activo', 'Estudiante de excelente rendimiento académico.'),
(2, 'EXP-2026-002', '9120482', 'Sofía Beatriz', 'Rivas Morales', '2009-08-22', 16, 'Femenino', 'General', 'Primer Año', 'A', 'Licda. Maria Rodriguez', 'Ana Maria Morales de Rivas', '01987654-2', '7633-2211', 'Colonia Las Mercedes, Pasaje 3 #45', 'Padre y Madre', 'sofia.rivas@estudiante.edu.sv', 'No', 'Ninguna', 'Ninguno', 'Activo', 'Participante en club de robótica y matemáticas.'),
(3, 'EXP-2026-003', '7483921', 'Kevin Alexander', 'Martinez Martinez', '2008-11-03', 17, 'Masculino', 'Administrativo Contable', 'Segundo Año', 'B', 'Prof. Roberto Garcia', 'Jose Alexander Martinez Cruz', '03412578-9', '7811-9922', 'Canton El Saler, Calle Principal', 'Solo Padre', 'kevin.martinez@estudiante.edu.sv', 'No', 'Ninguna', 'TDAH', 'Activo', 'Integrante de la banda de paz institucional.'),
(4, 'EXP-2026-004', '6382019', 'Valeria Nicolle', 'Gutierrez Lopez', '2007-03-30', 18, 'Femenino', 'Salud', 'Tercer Año', 'A', 'Dra. Carmen Lopez', 'Lucia Beatriz Lopez', '04512398-7', '7999-1122', 'Barrio San Jose, Final 4ta Calle Poniente', 'Solo Madre', 'valeria.gutierrez@estudiante.edu.sv', 'No', 'Ninguna', 'Ninguno', 'Activo', 'Abanderada institucional año 2025.');

INSERT INTO `padres_familia` (`id`, `nombre_completo`, `dui`, `usuario`, `password`, `telefono`, `correo`, `nie_hijo`) VALUES
(1, 'Roberto Carlos Alvarado Perez', '02345678-4', 'roberto.padre', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe11y.uC1n/12j7uA6W/1hP4F/y3H1q3S', '7744-1122', 'roberto.alvarado@gmail.com', '8492015'),
(2, 'Ana Maria Morales de Rivas', '01987654-2', 'ana.padre', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe11y.uC1n/12j7uA6W/1hP4F/y3H1q3S', '7633-2211', 'ana.rivas@gmail.com', '9120482');

INSERT INTO `asistencias` (`id`, `estudiante_id`, `fecha`, `materia`, `estado`, `motivo`, `registrado_por`) VALUES
(1, 1, '2026-02-10', 'Matemáticas', 'Ausencia Justificada', 'Cita médica en Hospital de San Vicente', 'Prof. Carlos Hernandez'),
(2, 1, '2026-02-18', 'Lenguaje', 'Ausencia Sin Justificar', 'Falta imprevista a primera hora', 'Prof. Carlos Hernandez'),
(3, 1, '2026-03-02', 'Informática', 'Ausencia Justificada', 'Trámites de DUI en RNPN', 'Prof. Carlos Hernandez'),
(4, 2, '2026-02-15', 'Ciencias', 'Ausencia Sin Justificar', 'Sin reporte de encargado', 'Licda. Maria Rodriguez');

INSERT INTO `justificaciones_padres` (`id`, `estudiante_id`, `padre_dui`, `fecha_inasistencia`, `motivo`, `estado`) VALUES
(1, 1, '02345678-4', '2026-02-18', 'Gripe fuerte con fiebre, se adjunta constancia médica', 'Pendiente');

INSERT INTO `observaciones_docente` (`id`, `estudiante_id`, `docente_nombre`, `tipo`, `observacion`) VALUES
(1, 1, 'Prof. Carlos Hernandez', 'Excelente', 'Muestra gran interés en el módulo de desarrollo web y liderazgo en proyectos de equipo.'),
(2, 1, 'Prof. Carlos Hernandez', 'Conducta', 'Se le recuerda puntualidad en la primera clase de la mañana.');
