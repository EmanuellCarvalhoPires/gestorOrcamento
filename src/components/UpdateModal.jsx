import React, { useState } from 'react';

export default function UpdateModal({
  isOpen,
  updateData,
  updateStatus,
  onClose,
  onIgnoreVersion,
  onDownloadUpdate,
  onQuitAndInstall,
}) {
  const [downloadIniciadoWeb, setDownloadIniciadoWeb] = useState(false);

  if (!isOpen && updateStatus?.state !== 'downloading' && updateStatus?.state !== 'downloaded') {
    return null;
  }

  const isNativoDownloading = updateStatus?.state === 'downloading';
  const isNativoDownloaded = updateStatus?.state === 'downloaded';

  const versaoAtual = updateData?.versaoAtual || '1.0.1';
  const versaoMaisRecente = updateStatus?.version || updateData?.versaoMaisRecente || '1.0.2';
  const titulo = updateData?.titulo || `Versão ${versaoMaisRecente}`;
  const notas = updateData?.notas || updateStatus?.releaseNotes || 'Melhorias de desempenho, segurança e correções gerais de estabilidade.';
  const progresso = updateStatus?.progress || 0;

  const handleBaixarAtualizacao = async () => {
    const linkAlvo = updateData?.urlDownload || updateData?.urlRelease;
    if (onDownloadUpdate) {
      const res = await onDownloadUpdate(linkAlvo);
      if (res?.success !== false) return;
    }

    // Fallback: abre no navegador se o download nativo falhar completamente
    setDownloadIniciadoWeb(true);
    const fallbackLink = linkAlvo || 'https://github.com/EmanuellCarvalhoPires/gestorOrcamento/releases/latest';
    if (window.electronAPI?.openExternalUrl) {
      await window.electronAPI.openExternalUrl(fallbackLink);
    } else if (window.apiTurso?.abrirUrlExterna) {
      await window.apiTurso.abrirUrlExterna(fallbackLink);
    } else {
      window.open(fallbackLink, '_blank');
    }
  };

  const handleIgnorar = () => {
    if (onIgnoreVersion && versaoMaisRecente) {
      onIgnoreVersion(versaoMaisRecente);
    }
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(5px)',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg, #545454)',
          borderRadius: '24px',
          width: '92%',
          maxWidth: '560px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
          border: '1px solid var(--border-color, #737373)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-primary, #ffffff)',
        }}
      >
        {/* Topo / Banner com Destaque */}
        <div
          style={{
            background: 'linear-gradient(135deg, #2b2b2b 0%, #1e1e1e 100%)',
            padding: '24px',
            borderBottom: '1px solid var(--border-color, #666666)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 225, 146, 0.15)',
              border: '2px solid var(--accent-color, #ffe192)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              flexShrink: 0,
            }}
          >
            {isNativoDownloaded ? '✨' : isNativoDownloading ? '⏳' : '🚀'}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--accent-color, #ffe192)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '2px',
              }}
            >
              {isNativoDownloaded ? 'Pronto para Instalar' : isNativoDownloading ? 'Baixando em Segundo Plano' : 'Atualização Encontrada'}
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
              {isNativoDownloaded ? 'Download Concluído!' : isNativoDownloading ? `Baixando Atualização... (${progresso}%)` : 'Nova Versão Disponível!'}
            </h3>
          </div>

          {!isNativoDownloading && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #aaaaaa)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                lineHeight: 1,
              }}
              title="Fechar"
            >
              ✕
            </button>
          )}
        </div>

        {/* Corpo do Modal */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Card com Versão Atual vs Nova Versão */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--surface-bg, #3e3e3e)',
              padding: '14px 18px',
              borderRadius: '14px',
              border: '1px solid var(--border-color, #666666)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary, #aaaaaa)' }}>Versão Atual</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#dddddd' }}>
                v{versaoAtual}
              </div>
            </div>

            <div style={{ fontSize: '20px', color: 'var(--accent-color, #ffe192)' }}>➔</div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-color, #ffe192)' }}>Nova Versão</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'var(--accent-color, #ffe192)',
                  backgroundColor: 'rgba(255, 225, 146, 0.12)',
                  padding: '2px 10px',
                  borderRadius: '8px',
                  display: 'inline-block',
                }}
              >
                {versaoMaisRecente?.startsWith('v') ? versaoMaisRecente : `v${versaoMaisRecente}`}
              </div>
            </div>
          </div>

          {/* Destaque do Título da Release */}
          {titulo && !isNativoDownloading && !isNativoDownloaded && (
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary, #ffffff)' }}>
              📌 {titulo}
            </div>
          )}

          {/* Barra de Progresso de Download Nativo */}
          {isNativoDownloading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#dddddd' }}>
                <span>Baixando instalador automaticamente...</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-color, #ffe192)' }}>{progresso}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: '#2b2b2b',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #666666',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progresso}%`,
                    backgroundColor: '#2a9d8f',
                    borderRadius: '8px',
                    transition: 'width 0.3s ease-out',
                  }}
                />
              </div>
            </div>
          )}

          {/* Estado de Download Concluído */}
          {isNativoDownloaded && (
            <div
              style={{
                backgroundColor: 'rgba(42, 157, 143, 0.2)',
                border: '1px solid #2a9d8f',
                color: '#2a9d8f',
                padding: '16px',
                borderRadius: '14px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '26px' }}>🎉</span>
              <div>
                <strong>A nova versão foi baixada com sucesso!</strong>
                <div style={{ fontSize: '12px', color: '#c4f1e9', marginTop: '4px' }}>
                  Clique no botão abaixo para reiniciar o aplicativo e aplicar a atualização imediatamente.
                </div>
              </div>
            </div>
          )}

          {/* Notas de Lançamento (Changelog) */}
          {!isNativoDownloading && !isNativoDownloaded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary, #cccccc)' }}>
                O que há de novo nesta versão:
              </div>
              <div
                style={{
                  backgroundColor: 'var(--surface-bg, #3e3e3e)',
                  border: '1px solid var(--border-color, #666666)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  fontSize: '12.5px',
                  lineHeight: '1.5',
                  color: '#e0e0e0',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                }}
              >
                {notas}
              </div>
            </div>
          )}

          {/* Feedback de Download Iniciado Web */}
          {downloadIniciadoWeb && !isNativoDownloading && !isNativoDownloaded && (
            <div
              style={{
                backgroundColor: 'rgba(42, 157, 143, 0.2)',
                border: '1px solid #2a9d8f',
                color: '#2a9d8f',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '20px' }}>✅</span>
              <div>
                <strong>Download aberto no navegador!</strong>
                <div style={{ fontSize: '11.5px', color: '#c4f1e9', marginTop: '2px' }}>
                  Assim que o download terminar, execute o novo instalador para atualizar.
                </div>
              </div>
            </div>
          )}

          {/* Ações / Botões */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            {!isNativoDownloading && (
              <button
                type="button"
                onClick={handleIgnorar}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #737373)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--surface-hover, #666666)')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
              >
                {isNativoDownloaded ? 'Mais Tarde' : 'Lembrar Mais Tarde'}
              </button>
            )}

            {isNativoDownloaded ? (
              <button
                type="button"
                onClick={onQuitAndInstall}
                style={{
                  flex: 1.4,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#2a9d8f',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                }}
              >
                <span>🔄</span>
                <span>Reiniciar & Aplicar Agora</span>
              </button>
            ) : !isNativoDownloading ? (
              <button
                type="button"
                onClick={handleBaixarAtualizacao}
                style={{
                  flex: 1.4,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color, #ffe192)',
                  color: 'var(--accent-text, #333333)',
                  fontSize: '13.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                  transition: 'transform 0.15s, filter 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.filter = 'brightness(1.08)')}
                onMouseLeave={(e) => (e.target.style.filter = 'none')}
              >
                <span>📥</span>
                <span>Atualizar Agora</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
