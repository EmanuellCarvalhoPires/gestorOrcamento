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
      }}
    >
      <div
        style={{
          backgroundColor: '#545454',
          borderRadius: '24px',
          padding: '28px 32px',
          width: '90%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
          textAlign: 'center',
        }}
      >
        {/* Pergunta Principal */}
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '19px', fontWeight: 'bold', lineHeight: '1.4' }}>
          {isFixa
            ? `Opções de exclusão para "${item.nome}" (Registro Fixo)`
            : (totalParcelasNum > 1
                ? `Opções de exclusão para "${item.nome}" (${item.parcelas})`
                : `Deseja excluir o registro "${item.nome}"?`)}
        </h3>

        {isMultiplas && (
          <p style={{ margin: 0, color: '#dddddd', fontSize: '13px' }}>
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
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: '#737373',
                  color: '#ffffff',
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
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: '#ffe192',
                  color: '#333333',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  transition: 'opacity 0.2s',
                }}
              >
                2. Excluir deste mês em diante (este mês e os próximos)
              </button>

              {/* Opção 3 para Fixa: TODAS as ocorrências do ano */}
              <button
                onClick={() => onConfirm({ deletarModo: 'todas', ehFixa: true, mes: item.mes })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: '#4a4a4a',
                  color: '#ffe192',
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
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaaaaa',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '4px',
                  textDecoration: 'underline',
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
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: '#737373',
                  color: '#ffffff',
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
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: '#ffe192',
                  color: '#333333',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  transition: 'opacity 0.2s',
                }}
              >
                2. Excluir esta parcela e as futuras (a partir da {item.parcelas})
              </button>

              {/* Opção 3 para Parcelados: TODAS as parcelas */}
              <button
                onClick={() => onConfirm({ deletarModo: 'todas' })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: '#4a4a4a',
                  color: '#ffe192',
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
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaaaaa',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '4px',
                  textDecoration: 'underline',
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onConfirm({ deletarModo: 'apenas_esta' })}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: '#ffe192',
                  color: '#333333',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Sim
              </button>

              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: '#737373',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
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
