import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import { securityHeaders, corsMiddleware, apiLimiter } from './middleware/securityMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de Segurança
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply Rate Limiting no prefixo da API
app.use('/api', apiLimiter);

// Rotas de Autenticação e Finanças
app.use('/api/auth', authRoutes);
app.use('/api', financeRoutes);

// Endpoint de Status / Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Gestor Orcamento API RESTful HTTPS' });
});

// Tratamento global de rotas 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint não encontrado.' });
});

// Tratamento global de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado na API:', err);
  res.status(500).json({ success: false, error: 'Erro interno no servidor.' });
});

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` Servidor Gestor Orçamento API RESTful rodando na porta ${PORT}`);
  console.log(` Healthcheck: http://localhost:${PORT}/health`);
  console.log(`================================================================`);
});
