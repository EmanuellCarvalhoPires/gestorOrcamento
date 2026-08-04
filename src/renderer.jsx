import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import YearSelector from './components/YearSelector';
import MonthSelector from './components/MonthSelector';
import TransactionTable from './components/TransactionTable';
import CaixinhaDashboard from './components/CaixinhaDashboard';
import CaixinhaChart from './components/CaixinhaChart';
import DonutChart from './components/DonutChart';
import SummaryCards from './components/SummaryCards';
import AddExpenseModal from './components/AddExpenseModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import AuthView from './components/AuthView';
import UserProfileHeader from './components/UserProfileHeader';
import { BudgetProvider, useBudget } from './contexts/BudgetContext';
import appIcon from '../images/app_icon.jpg';

// Error Boundary para capturar e exibir qualquer erro de runtime
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRASH CAPTURADO PELO ERROR BOUNDARY:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '32px',
            backgroundColor: '#2b1d1d',
            color: '#ff8585',
            fontFamily: 'monospace',
            minHeight: '100vh',
            boxSizing: 'border-box',
          }}
        >
          <h2 style={{ color: '#ff4d4d', marginTop: 0 }}>⚠️ Ocorreu um erro no aplicativo!</h2>
          <div style={{ backgroundColor: '#1a1010', padding: '16px', borderRadius: '8px', border: '1px solid #ff4d4d' }}>
            <strong>Erro:</strong> {this.state.error?.toString()}
          </div>
          <details style={{ marginTop: '16px', color: '#cccccc', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 'bold' }}>Ver detalhes da pilha (Stack Trace)</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '10px' }}>
              {this.state.errorInfo?.componentStack || this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#e76f51',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🔄 Limpar Cache e Reiniciar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = () => {
  const { usuarioLogado, anoSelecionado } = useBudget();

  // Se não houver usuário logado, exibe a tela de Login / Registro
  if (!usuarioLogado) {
    return <AuthView />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        minHeight: '100vh',
        backgroundColor: '#3a3a3a',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* Topo do App: Logo Centralizada na Moldura + Anos (Esquerda) + Perfil (Direita) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Logo com Emblema Perfeitamente Centralizado e Ampliado na Moldura */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #ffe192',
              boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1e1e1e',
            }}
          >
            <img
              src={appIcon}
              alt="Gestor de Orçamento"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          <YearSelector />
        </div>

        <UserProfileHeader />
      </div>

      {/* 2. Barra de Seleção de Meses */}
      <MonthSelector />

      {/* 3. Área Principal Dividida em 2 Colunas */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flex: 1,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Coluna da Esquerda: Tabela de Lançamentos ou Dashboard da Caixinha */}
        {anoSelecionado === 'caixinha' ? <CaixinhaDashboard /> : <TransactionTable />}

        {/* Coluna da Direita: Gráfico e Cards */}
        <div
          style={{
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {anoSelecionado === 'caixinha' ? (
            <CaixinhaChart />
          ) : (
            <>
              <DonutChart />
              <SummaryCards />
            </>
          )}
        </div>
      </div>

      {/* Modal de Cadastro de Lançamento */}
      <AddExpenseModal />

      {/* Modal de Gerenciamento de Categorias */}
      <CategoryManagerModal />
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <BudgetProvider>
        <MainLayout />
      </BudgetProvider>
    </ErrorBoundary>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);