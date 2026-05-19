require("dotenv").config();

const express = require("express");
const cors = require("cors");

const clientesRoutes = require("./routes/clientes.routes");
const mascotasRoutes = require("./routes/mascotas.routes");
const citasRoutes = require("./routes/citas.routes");
const empleadosRoutes = require("./routes/empleados.routes");

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});
