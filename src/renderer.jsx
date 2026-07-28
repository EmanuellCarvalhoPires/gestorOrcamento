import React from 'react';
import { createRoot } from 'react-dom/client';
import Button from './components/Button';
import MonthSelector from './components/monthSelector';
import YearSelector from './components/YearSelector';

const app = () => {
  return (

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', gap: '16px' }}>
        <YearSelector />
        <MonthSelector />
        

      </div>
  );
}

const container = document.getElementById('root');

const root = createRoot(container);

root.render(app());