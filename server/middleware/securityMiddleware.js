import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Configuração do Helmet para Security Headers
export const securityHeaders = helmet();

// Configuração estrita de CORS
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permite conexões mobile (Capacitor/native não enviam origin ou usam capacitor://)
    if (!origin || origin.startsWith('capacitor://') || origin.startsWith('http://localhost') || origin.startsWith('file://')) {
      return callback(null, true);
    }
    // Adicionar domínios permitidos se necessário
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Rate Limiter Geral para todas as rotas de API (100 req por 15 min)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições deste IP. Tente novamente em 15 minutos.' },
});

// Rate Limiter Estrito para Login/Registro (30 tentativas por 15 min - Prevenção contra força bruta)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas tentativas de autenticação. Tente novamente após 15 minutos.' },
});
