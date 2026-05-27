require("dotenv").config();

const express = require("express");
const cors = require("cors");

const clientesRoutes = require("./routes/clientes.routes");
const mascotasRoutes = require("./routes/mascotas.routes");
const citasRoutes = require("./routes/citas.routes");
const empleadosRoutes = require("./routes/empleados.routes");
const serviciosRoutes = require("./routes/servicios.routes");
const medicamentosRoutes = require("./routes/medicamentos.routes");
const vacunasRoutes = require("./routes/vacunas.routes");
const consultasRoutes = require("./routes/consultas.routes");
const diagnosticosRoutes = require("./routes/diagnosticos.routes");
const tratamientosRoutes = require("./routes/tratamientos.routes");
const facturasRoutes = require("./routes/facturas.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const reportesRoutes = require("./routes/reportes.routes");
const diccionarioRoutes = require("./routes/diccionario.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "API VetCare funcionando",
    });
});

app.use("/api/clientes", clientesRoutes);
app.use("/api/mascotas", mascotasRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/empleados", empleadosRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/medicamentos", medicamentosRoutes);
app.use("/api/vacunas", vacunasRoutes);
app.use("/api/consultas", consultasRoutes);
app.use("/api/diagnosticos", diagnosticosRoutes);
app.use("/api/tratamientos", tratamientosRoutes);
app.use("/api/facturas", facturasRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/diccionario", diccionarioRoutes);  // ← esta es la que faltaba

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});