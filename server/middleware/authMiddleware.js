import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gestor_orcamento_jwt_secret_key_2026_super_secure';

/**
 * Middleware para validar o Access Token JWT nas rotas protegidas
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ success: false, error: 'Acesso não autorizado. Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token inválido ou expirado.' });
    }
    req.user = user;
    next();
  });
}
