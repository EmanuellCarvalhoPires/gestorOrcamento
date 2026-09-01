import React from 'react';

export default function DeleteConfirmModal({ isOpen, item, onClose, onConfirm }) {
  if (!isOpen || !item) return null;

  // Extrai informações do lançamento
  const partes = (item.parcelas || '1/1').split('/');
  const parcelaNum = parseInt(partes[0] || '1', 10);
  const totalParcelasNum = parseInt(partes[1] || '1', 10);
  const isFixa = item.eh_fixa === 1 || item.parcelas === 'Fixa';
  const isMultiplas = totalParcelasNum > 1 || isFixa;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg, #545454)',
          borderRadius: '24px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
          padding: '28px 32px',
          width: '90%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          textAlign: 'center',
          color: 'var(--text-primary, #ffffff)',
        }}
      >
        {/* Pergunta Principal */}
        <h3 style={{ margin: 0, color: 'var(--text-primary, #ffffff)', fontSize: '19px', fontWeight: 'bold', lineHeight: '1.4' }}>
          {isFixa
            ? `Opções de exclusão para "${item.nome}" (Registro Fixo)`
            : (totalParcelasNum > 1
                ? `Opções de exclusão para "${item.nome}" (${item.parcelas})`
                : `Deseja excluir o registro "${item.nome}"?`)}
        </h3>

        {isMultiplas && (
          <p style={{ margin: 0, color: 'var(--text-secondary, #cccccc)', fontSize: '13px', lineHeight: '1.5' }}>
            {isFixa
              ? 'Este registro foi marcado como Fixo. Como deseja realizar a exclusão?'
              : `Esta compra foi parcelada em ${totalParcelasNum} vezes. Como deseja realizar a exclusão?`}
          </p>
        )}

        {/* Botões de Ação */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMultiplas ? 'column' : 'row',
            gap: '10px',
            width: '100%',
            justifyContent: 'center',
            marginTop: '4px',
          }}
        >
          {isFixa ? (
            <>
              {/* Opção 1 para Fixa: APENAS este mês */}
              <button
                onClick={() => onConfirm({ deletarModo: 'apenas_esta', ehFixa: true, mes: item.mes })}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover, rgba(255,255,255,0.1))')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-bg, #3e3e3e)')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: '1px solid var(--border-color, #737373)',
                  backgroundColor: 'var(--surface-bg, #3e3e3e)',
                  color: 'var(--text-primary, #ffffff)',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                1. Excluir APENAS o registro deste mês ({item.mes})
              </button>

              {/* Opção 2 para Fixa: Este mês em diante */}
              <button
                onClick={() => onConfirm({ deletarModo: 'posteriores', ehFixa: true, mes: item.mes })}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  transition: 'opacity 0.2s',
                }}
              >
                2. Excluir deste mês em diante (este mês e os próximos)
              </button>

              {/* Opção 3 para Fixa: TODAS as ocorrências do ano */}
              <button
                onClick={() => onConfirm({ deletarModo: 'todas', ehFixa: true, mes: item.mes })}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover, rgba(255,255,255,0.1))')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-bg, #3e3e3e)')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: '1px solid var(--accent-color, #ffe192)',
                  backgroundColor: 'var(--surface-bg, #3e3e3e)',
                  color: 'var(--accent-color, #ffe192)',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  transition: 'background-color 0.2s',
                }}
              >
                3. Excluir TODAS as ocorrências fixas do ano
              </button>

              {/* Cancelar */}
              <button
                onClick={onClose}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary, #ffffff)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary, #aaaaaa)')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #aaaaaa)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '4px',
                  textDecoration: 'underline',
                  transition: 'color 0.2s',
                }}
              >
                Cancelar
              </button>
            </>
          ) : totalParcelasNum > 1 ? (
            <>
              {/* Opção 1 para Parcelados: APENAS esta parcela */}
              <button
                onClick={() => onConfirm({ deletarModo: 'apenas_esta' })}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover, rgba(255,255,255,0.1))')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-bg, #3e3e3e)')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: '1px solid var(--border-color, #737373)',
                  backgroundColor: 'var(--surface-bg, #3e3e3e)',
                  color: 'var(--text-primary, #ffffff)',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                1. Excluir APENAS esta parcela ({item.parcelas})
              </button>

              {/* Opção 2 para Parcelados: Esta parcela e as futuras */}
              <button
                onClick={() => onConfirm({ deletarModo: 'posteriores', parcelaNum })}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  transition: 'opacity 0.2s',
                }}
              >
                2. Excluir esta parcela e as futuras (a partir da {item.parcelas})
              </button>

              {/* Opção 3 para Parcelados: TODAS as parcelas */}
              <button
                onClick={() => onConfirm({ deletarModo: 'todas' })}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover, rgba(255,255,255,0.1))')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-bg, #3e3e3e)')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: '1px solid var(--accent-color, #ffe192)',
                  backgroundColor: 'var(--surface-bg, #3e3e3e)',
                  color: 'var(--accent-color, #ffe192)',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  transition: 'background-color 0.2s',
                }}
              >
                3. Excluir TODAS as parcelas da compra (passadas e futuras)
              </button>

              {/* Cancelar */}
              <button
                onClick={onClose}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary, #ffffff)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary, #aaaaaa)')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #aaaaaa)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '4px',
                  textDecoration: 'underline',
                  transition: 'color 0.2s',
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onConfirm({ deletarModo: 'apenas_esta' })}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  transition: 'opacity 0.2s',
                }}
              >
                Sim
              </button>

              <button
                onClick={onClose}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover, rgba(255,255,255,0.1))')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-bg, #3e3e3e)')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '24px',
                  border: '1px solid var(--border-color, #737373)',
                  backgroundColor: 'var(--surface-bg, #3e3e3e)',
                  color: 'var(--text-primary, #ffffff)',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                Não
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
