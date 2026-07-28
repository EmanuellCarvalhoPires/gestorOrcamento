// src/components/Button.jsx
import React from 'react';

export default function Button({ children, onClick, styleType = 'primary' }) {
  // Estilos base para qualquer botão
  const baseStyle = {
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: 'none',
    fontWeight: '600',
    fontSize: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  // Variações de estilo
  const styles = {
    primary: { ...baseStyle, backgroundColor: '#a6a6a6', color: '#ffe192' },
    secondary: { ...baseStyle, backgroundColor: '#737373', color: '#ffe192' }
  };

  return (
    <button style={styles[styleType]} onClick={onClick}>
      {children}
    </button>
  );
}