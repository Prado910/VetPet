// Mock data para VetCare Admin

export const clientes = [
  {
    id: 1,
    nombre: "Juan Pérez",
    direccion: "Calle Los Álamos 123, Santiago",
    email: "juan.perez@email.com",
    telefono: "+56 9 1234 5678",
    estado: "ACTIVO"
  },
  {
    id: 2,
    nombre: "Ana Gómez",
    direccion: "Av. Providencia 456, Santiago",
    email: "ana.gomez@email.com",
    telefono: "+56 9 8765 4321",
    estado: "ACTIVO"
  },
  {
    id: 3,
    nombre: "Carlos Ramírez",
    direccion: "Los Pinos 789, Maipú",
    email: "carlos.ramirez@email.com",
    telefono: "+56 9 5555 1234",
    estado: "ACTIVO"
  },
  {
    id: 4,
    nombre: "María López",
    direccion: "Las Rosas 321, Ñuñoa",
    email: "maria.lopez@email.com",
    telefono: "+56 9 9999 8888",
    estado: "INACTIVO"
  }
];

export const mascotas = [
  {
    id: 1,
    codigo: "M001",
    nombre: "Firulais",
    clienteId: 1,
    fechaNacimiento: "2020-05-15",
    sexo: "Macho",
    peso: 28.5,
    especie: "Perro",
    raza: "Labrador",
    estadoSalud: "Saludable"
  },
  {
    id: 2,
    codigo: "M002",
    nombre: "Mishi",
    clienteId: 2,
    fechaNacimiento: "2021-03-10",
    sexo: "Hembra",
    peso: 4.2,
    especie: "Gato",
    raza: "Siamés",
    estadoSalud: "Saludable"
  },
  {
    id: 3,
    codigo: "M003",
    nombre: "Rocky",
    clienteId: 3,
    fechaNacimiento: "2019-08-22",
    sexo: "Macho",
    peso: 35.0,
    especie: "Perro",
    raza: "Pastor Alemán",
    estadoSalud: "En tratamiento"
  },
  {
    id: 4,
    codigo: "M004",
    nombre: "Luna",
    clienteId: 2,
    fechaNacimiento: "2022-01-05",
    sexo: "Hembra",
    peso: 3.8,
    especie: "Gato",
    raza: "Persa",
    estadoSalud: "Saludable"
  },
  {
    id: 5,
    codigo: "M005",
    nombre: "Max",
    clienteId: 1,
    fechaNacimiento: "2021-11-30",
    sexo: "Macho",
    peso: 12.5,
    especie: "Perro",
    raza: "Beagle",
    estadoSalud: "Saludable"
  }
];

export const empleados = [
  {
    id: 1,
    nombre: "Dr. Luis Torres",
    telefono: "+56 9 1111 2222",
    fechaIngreso: "2018-03-15",
    estadoLaboral: "ACTIVO",
    tipo: "VETERINARIO",
    salario: 2500000,
    especialidad: "Medicina Interna",
    matricula: "VET-12345"
  },
  {
    id: 2,
    nombre: "Dra. Marta Silva",
    telefono: "+56 9 3333 4444",
    fechaIngreso: "2019-07-01",
    estadoLaboral: "ACTIVO",
    tipo: "VETERINARIO",
    salario: 2800000,
    especialidad: "Cirugía",
    matricula: "VET-67890"
  },
  {
    id: 3,
    nombre: "Patricia González",
    telefono: "+56 9 5555 6666",
    fechaIngreso: "2020-02-10",
    estadoLaboral: "ACTIVO",
    tipo: "RECEPCIONISTA",
    salario: 800000,
    turno: "DIURNO"
  },
  {
    id: 4,
    nombre: "Roberto Morales",
    telefono: "+56 9 7777 8888",
    fechaIngreso: "2021-09-20",
    estadoLaboral: "ACTIVO",
    tipo: "RECEPCIONISTA",
    salario: 850000,
    turno: "NOCTURNO"
  }
];

export const servicios = [
  { id: 1, nombre: "Consulta General", precio: 25000 },
  { id: 2, nombre: "Consulta Especializada", precio: 45000 },
  { id: 3, nombre: "Cirugía Ambulatoria", precio: 150000 },
  { id: 4, nombre: "Fisioterapia", precio: 35000 },
  { id: 5, nombre: "Vacunación Básica", precio: 15000 },
  { id: 6, nombre: "Desparasitación", precio: 12000 },
  { id: 7, nombre: "Esterilización", precio: 120000 }
];

export const citas = [
  {
    id: 1,
    fecha: "2026-05-19",
    hora: "09:00",
    mascotaId: 1,
    veterinarioId: 1,
    recepcionistaId: 3,
    motivo: "Control de rutina",
    estado: "CONFIRMADA"
  },
  {
    id: 2,
    fecha: "2026-05-19",
    hora: "10:30",
    mascotaId: 2,
    veterinarioId: 2,
    recepcionistaId: 3,
    motivo: "Vacunación anual",
    estado: "PROGRAMADA"
  },
  {
    id: 3,
    fecha: "2026-05-19",
    hora: "11:00",
    mascotaId: 3,
    veterinarioId: 1,
    recepcionistaId: 3,
    motivo: "Revisión post-operatoria",
    estado: "CONFIRMADA"
  },
  {
    id: 4,
    fecha: "2026-05-19",
    hora: "14:00",
    mascotaId: 4,
    veterinarioId: 2,
    recepcionistaId: 3,
    motivo: "Problemas respiratorios",
    estado: "PROGRAMADA"
  },
  {
    id: 5,
    fecha: "2026-05-19",
    hora: "15:30",
    mascotaId: 5,
    veterinarioId: 1,
    recepcionistaId: 3,
    motivo: "Consulta dermatológica",
    estado: "ATENDIDA"
  },
  {
    id: 6,
    fecha: "2026-05-20",
    hora: "09:00",
    mascotaId: 1,
    veterinarioId: 2,
    recepcionistaId: 3,
    motivo: "Control de peso",
    estado: "PROGRAMADA"
  }
];

export const consultas = [
  {
    id: 1,
    citaId: 5,
    servicioId: 1,
    temperatura: 38.5,
    peso: 12.3,
    observaciones: "Piel enrojecida en zona abdominal",
    recomendaciones: "Aplicar pomada tópica dos veces al día",
    fechaAtencion: "2026-05-19"
  }
];

export const diagnosticos = [
  {
    id: 1,
    consultaId: 1,
    descripcion: "Dermatitis alérgica",
    nivelGravedad: "LEVE",
    tipoAfeccion: "DERMATOLOGICA",
    estado: "EN_TRATAMIENTO"
  }
];

export const tratamientos = [
  {
    id: 1,
    diagnosticoId: 1,
    veterinarioId: 1,
    servicioId: null,
    tipo: "MEDICACION",
    fechaInicio: "2026-05-19",
    fechaFin: "2026-06-02",
    indicaciones: "Aplicar pomada antiinflamatoria en zona afectada",
    estado: "ACTIVO"
  },
  {
    id: 2,
    diagnosticoId: 1,
    veterinarioId: 1,
    servicioId: 4,
    tipo: "TERAPIA",
    fechaInicio: "2026-05-20",
    fechaFin: "2026-06-10",
    indicaciones: "Sesiones de fisioterapia semanales",
    estado: "ACTIVO"
  }
];

export const medicamentos = [
  {
    id: 1,
    nombre: "Prednisolona",
    descripcion: "Antiinflamatorio corticoide",
    precioUnitario: 15000
  },
  {
    id: 2,
    nombre: "Amoxicilina",
    descripcion: "Antibiótico de amplio espectro",
    precioUnitario: 12000
  },
  {
    id: 3,
    nombre: "Ibuprofeno Veterinario",
    descripcion: "Analgésico antiinflamatorio",
    precioUnitario: 8000
  }
];

export const vacunas = [
  {
    id: 1,
    nombre: "Sextuple Canina",
    laboratorio: "Zoetis",
    lote: "LOT-2026-001",
    fechaVencimiento: "2027-12-31",
    especieObjetivo: "Perro",
    precio: 18000
  },
  {
    id: 2,
    nombre: "Triple Felina",
    laboratorio: "Boehringer Ingelheim",
    lote: "LOT-2026-002",
    fechaVencimiento: "2027-11-30",
    especieObjetivo: "Gato",
    precio: 16000
  },
  {
    id: 3,
    nombre: "Antirrábica",
    laboratorio: "MSD Animal Health",
    lote: "LOT-2026-003",
    fechaVencimiento: "2028-01-15",
    especieObjetivo: "Perro/Gato",
    precio: 12000
  }
];

export const aplicacionVacunas = [
  {
    id: 1,
    mascotaId: 1,
    vacunaId: 1,
    fechaAplicacion: "2026-03-15",
    observacion: "Sin reacciones adversas"
  },
  {
    id: 2,
    mascotaId: 2,
    vacunaId: 2,
    fechaAplicacion: "2026-04-10",
    observacion: "Aplicación exitosa"
  }
];

export const facturas = [
  {
    id: 1,
    clienteId: 1,
    consultaId: 1,
    fecha: "2026-05-19",
    valorTotal: 40000,
    metodoPago: "Tarjeta de Crédito",
    estadoPago: "PAGADA"
  },
  {
    id: 2,
    clienteId: 2,
    consultaId: null,
    fecha: "2026-05-18",
    valorTotal: 16000,
    metodoPago: "Efectivo",
    estadoPago: "PAGADA"
  },
  {
    id: 3,
    clienteId: 3,
    consultaId: null,
    fecha: "2026-05-17",
    valorTotal: 150000,
    metodoPago: "Transferencia",
    estadoPago: "PENDIENTE"
  }
];

export const detalleFacturas = [
  {
    id: 1,
    facturaId: 1,
    descripcion: "Consulta General",
    tipoConcepto: "CONSULTA",
    cantidad: 1,
    precioUnitario: 25000
  },
  {
    id: 2,
    facturaId: 1,
    descripcion: "Prednisolona",
    tipoConcepto: "MEDICAMENTO",
    cantidad: 1,
    precioUnitario: 15000
  },
  {
    id: 3,
    facturaId: 2,
    descripcion: "Triple Felina",
    tipoConcepto: "VACUNA",
    cantidad: 1,
    precioUnitario: 16000
  },
  {
    id: 4,
    facturaId: 3,
    descripcion: "Cirugía Ambulatoria",
    tipoConcepto: "PROCEDIMIENTO",
    cantidad: 1,
    precioUnitario: 150000
  }
];

// Helper functions
export const getClienteById = (id: number) => clientes.find(c => c.id === id);
export const getMascotaById = (id: number) => mascotas.find(m => m.id === id);
export const getEmpleadoById = (id: number) => empleados.find(e => e.id === id);
export const getServicioById = (id: number) => servicios.find(s => s.id === id);
export const getMascotasByCliente = (clienteId: number) => mascotas.filter(m => m.clienteId === clienteId);
export const getCitasByMascota = (mascotaId: number) => citas.filter(c => c.mascotaId === mascotaId);
export const getVacunasByMascota = (mascotaId: number) => aplicacionVacunas.filter(av => av.mascotaId === mascotaId);
