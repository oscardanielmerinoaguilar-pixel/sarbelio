/**
 * Manejador del Asistente de Registro de Estudiantes (6 Pasos)
 * Instituto Nacional Dr. Sarbelio Navarrete
 */

class StudentWizard {
  constructor() {
    this.currentStep = 1;
    this.maxSteps = 6;
    this.formData = {};
  }

  init() {
    this.bindEvents();
    this.updateStepUI();
  }

  bindEvents() {
    document.querySelectorAll('.btn-wizard-next').forEach(btn => {
      btn.addEventListener('click', () => this.nextStep());
    });

    document.querySelectorAll('.btn-wizard-prev').forEach(btn => {
      btn.addEventListener('click', () => this.prevStep());
    });

    document.querySelectorAll('.wizard-step').forEach(stepEl => {
      stepEl.addEventListener('click', (e) => {
        const stepNum = parseInt(e.currentTarget.getAttribute('data-step'));
        if (stepNum < this.currentStep || this.validateCurrentStep()) {
          this.goToStep(stepNum);
        }
      });
    });

    const btnFinish = document.getElementById('btn-wizard-finish');
    if (btnFinish) {
      btnFinish.addEventListener('click', () => this.submitWizard());
    }
  }

  submitWizard() {
    if (!this.validateCurrentStep()) return;

    const newStudent = {
      nie: document.getElementById('wiz_nie')?.value.trim(),
      codigo_expediente: document.getElementById('wiz_expediente')?.value.trim() || `EXP-2026-${Math.floor(100 + Math.random() * 900)}`,
      nombres: document.getElementById('wiz_nombres')?.value.trim(),
      apellidos: document.getElementById('wiz_apellidos')?.value.trim(),
      fecha_nacimiento: document.getElementById('wiz_fecha_nacimiento')?.value || '2008-01-01',
      edad: parseInt(document.getElementById('wiz_edad_calculada')?.innerText) || 17,
      sexo: document.getElementById('wiz_sexo')?.value || 'Masculino',
      bachillerato: document.getElementById('wiz_bachillerato')?.value || 'General',
      anio_bachillerato: document.getElementById('wiz_grado')?.value || 'Primer Año',
      seccion_letra: document.getElementById('wiz_seccion')?.value || 'A',
      docente_orientador: document.getElementById('wiz_docente_orientador')?.value.trim() || 'Prof. Carlos Hernandez',
      nombre_encargado: document.getElementById('wiz_encargado_nombre')?.value.trim(),
      dui_encargado: document.getElementById('wiz_encargado_dui')?.value.trim(),
      telefono_encargado: document.getElementById('wiz_encargado_telefono')?.value.trim(),
      direccion: document.getElementById('wiz_direccion')?.value.trim(),
      con_quien_vive: document.getElementById('wiz_con_quien_vive')?.value || 'Padre y Madre',
      correo: document.getElementById('wiz_correo')?.value.trim(),
      repite: document.getElementById('wiz_repite')?.value || 'No',
      discapacidad: document.getElementById('wiz_discapacidad')?.value || 'Ninguna',
      trastorno: document.getElementById('wiz_trastorno')?.value || 'Ninguno',
      estado: 'Activo',
      observaciones: document.getElementById('wiz_observaciones')?.value.trim() || 'Registrado desde Asistente de Matrícula (Wizard)'
    };

    if (window.sarbelioApp) {
      window.sarbelioApp.registerStudentFromWizard(newStudent);
    } else {
      alert('Estudiante registrado exitosamente desde el Asistente de Matrícula.');
    }
  }

  calculateAge(birthDateStr) {

    if (!birthDateStr) return;
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const ageEl = document.getElementById('wiz_edad_calculada');
    if (ageEl) {
      ageEl.innerText = `${age} años`;
    }
  }

  validateCurrentStep() {
    const currentContainer = document.querySelector(`.wizard-content-step[data-step="${this.currentStep}"]`);
    if (!currentContainer) return true;

    const requiredInputs = currentContainer.querySelectorAll('[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        input.classList.add('is-invalid');
        input.style.borderColor = 'var(--danger)';
        isValid = false;
      } else {
        input.classList.remove('is-invalid');
        input.style.borderColor = 'var(--border-color)';
      }
    });

    if (!isValid) {
      alert('Por favor complete todos los campos obligatorios antes de continuar.');
    }

    return isValid;
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.maxSteps) {
        this.currentStep++;
        this.updateStepUI();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepUI();
    }
  }

  goToStep(stepNum) {
    if (stepNum >= 1 && stepNum <= this.maxSteps) {
      this.currentStep = stepNum;
      this.updateStepUI();
    }
  }

  updateStepUI() {
    // Actualizar indicador superior
    document.querySelectorAll('.wizard-step').forEach(stepEl => {
      const stepNum = parseInt(stepEl.getAttribute('data-step'));
      stepEl.classList.remove('active', 'completed');
      if (stepNum === this.currentStep) {
        stepEl.classList.add('active');
      } else if (stepNum < this.currentStep) {
        stepEl.classList.add('completed');
      }
    });

    // Mostrar sección correspondiente
    document.querySelectorAll('.wizard-content-step').forEach(contentEl => {
      const stepNum = parseInt(contentEl.getAttribute('data-step'));
      if (stepNum === this.currentStep) {
        contentEl.style.display = 'block';
      } else {
        contentEl.style.display = 'none';
      }
    });

    // Si es el último paso (Resumen y Confirmación), renderizar datos
    if (this.currentStep === 6) {
      this.renderSummary();
    }
  }

  renderSummary() {
    const summaryContainer = document.getElementById('wizard-summary-box');
    if (!summaryContainer) return;

    const nombres = document.getElementById('wiz_nombres')?.value || '';
    const apellidos = document.getElementById('wiz_apellidos')?.value || '';
    const nie = document.getElementById('wiz_nie')?.value || '';
    const expediente = document.getElementById('wiz_expediente')?.value || '';
    const gradoSelect = document.getElementById('wiz_grado');
    const gradoText = gradoSelect ? gradoSelect.options[gradoSelect.selectedIndex]?.text : '';
    const seccionSelect = document.getElementById('wiz_seccion');
    const seccionText = seccionSelect ? seccionSelect.options[seccionSelect.selectedIndex]?.text : '';
    const encargadoNombre = document.getElementById('wiz_encargado_nombre')?.value || '';
    const encargadoTel = document.getElementById('wiz_encargado_telefono')?.value || '';

    summaryContainer.innerHTML = `
      <div class="data-detail-grid">
        <div class="detail-item"><label>Nombre Completo</label><p>${nombres} ${apellidos}</p></div>
        <div class="detail-item"><label>NIE</label><p>${nie}</p></div>
        <div class="detail-item"><label>Código Expediente</label><p>${expediente}</p></div>
        <div class="detail-item"><label>Grado Asignado</label><p>${gradoText}</p></div>
        <div class="detail-item"><label>Sección</label><p>${seccionText}</p></div>
        <div class="detail-item"><label>Encargado Principal</label><p>${encargadoNombre}</p></div>
        <div class="detail-item"><label>Teléfono Encargado</label><p>${encargadoTel}</p></div>
      </div>
    `;
  }
}

window.StudentWizard = StudentWizard;
