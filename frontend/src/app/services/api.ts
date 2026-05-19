const API_URL = 'http://localhost:3000/api';

export async function getClientes() {
  const response = await fetch(`${API_URL}/clientes`);

  if (!response.ok) {
    throw new Error("Error cargando clientes");
  }

  return response.json();
}