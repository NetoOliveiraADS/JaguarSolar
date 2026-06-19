import express from "express";
import cors from "cors";
import { 
  listarPropostas, gerarProposta, agendarVisita, 
  apagarProposta, obterDashboard, atualizarStatusVisita,
  remarcarVisita 
} from "./controller.js";

const servidor = express();
const PORTA = 8080;

servidor.use(cors());
servidor.use(express.json()); 

servidor.get("/api/dashboard", obterDashboard);
servidor.get("/api/propostas", listarPropostas);
servidor.post("/api/propostas", gerarProposta);
servidor.delete("/api/propostas/:id", apagarProposta);
servidor.post("/api/visitas", agendarVisita);
servidor.put("/api/visitas/:id/status", atualizarStatusVisita);
servidor.put("/api/visitas/:id", remarcarVisita);

servidor.listen(PORTA, () => console.log(`SERVER ON -> PORTA ${PORTA}`));