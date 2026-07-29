import React from 'react';
import { createRoot } from 'react-dom/client';
import YearSelector from './components/YearSelector';
import MonthSelector from './components/MonthSelector';
import TransactionTable from './components/TransactionTable';
import DonutChart from './components/DonutChart';
import SummaryCards from './components/SummaryCards';
import AddExpenseModal from './components/AddExpenseModal';
import { BudgetProvider } from './contexts/BudgetContext';

const MainLayout = () => {
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
      {/* 1. Barra Superior de Anos */}
      <YearSelector />

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
        {/* Coluna da Esquerda: Tabela de Lançamentos */}
        <TransactionTable />

        {/* Coluna da Direita: Gráfico de Rosca + Cards de Resumo */}
        <div
          style={{
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <DonutChart />
          <SummaryCards />
        </div>
      </div>

      {/* Modal de Cadastro de Lançamento */}
      <AddExpenseModal />
    </div>
  );
};

const App = () => {
  return (
    <BudgetProvider>
      <MainLayout />
    </BudgetProvider>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);