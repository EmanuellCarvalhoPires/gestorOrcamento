# 💰 Simple Finances

<div align="center">

![Simple Finances Logo](images/app_icon.png)

### **Gestão Financeira Pessoal & Corporativa com Sincronização em Nuvem**
*Um aplicativo desktop moderno, intuitivo e poderoso para gerenciar suas contas, transações, metas e previsões financeiras.*

[![Electron](https://img.shields.io/badge/Electron-34.x%20%7C%2043.x-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[📥 Baixar Última Versão](https://github.com/EmanuellCarvalhoPires/gestorOrcamento/releases/latest) • [✨ Funcionalidades](#-funcionalidades) • [🚀 Como Rodar](#-como-executar-em-desenvolvimento) • [📦 Gerar Executável](#-como-gerar-o-executável-exe) • [🛡️ Segurança](#-arquitetura--segurança)

</div>

---

## 🌟 Funcionalidades

### 💼 Multi-Contas & Carteiras
- Gerencie múltiplas contas bancárias, carteiras físicas, cartões e contas corporativas.
- Saldo consolidado e transferências organizadas por conta.
- Suporte a perfil pessoal e perfil comercial/empresarial (`isComercial`).

### 💰 Lançamentos de Receitas & Despesas
- Registro ágil de receitas e despesas com categorização e etiquetas personalizadas.
- **Recorrência Inteligente**: Despesas fixas mensais, semanais ou anuais com criação automatizada.
- **Parcelamento Inteligente**: Lançamento de compras parceladas com controle de parcelas restantes e quitação antecipada.

### 🏦 Caixinha de Economia & Reserva de Lucros
- Defina metas financeiras com acompanhamento visual de progresso.
- Cálculo de aportes mensais necessários para atingir objetivos em datas específicas.
- Histórico completo de depósitos e resgates.

### 💳 Importação de Faturas Nubank (CSV)
- Importe faturas e extratos de cartão de crédito Nubank via arquivo `.csv` em segundos.
- Detecção automática de duplicidades e sugestão de categorias.

### 📊 Dashboard & Gráficos Interativos
- Resumo financeiro em tempo real (Total de Receitas, Despesas, Balanço e Saldo em Caixa).
- **Gráfico Donut** com detalhamento por categorias e proporção de gastos.
- Projeção de fluxo de caixa para os próximos meses com base em lançamentos fixos e parcelados.

### 🏷️ Categorias & Etiquetas (Tags)
- Crie categorias e subcategorias com cores e ícones customizados.
- Reordene por prioridade de exibição.
- Modal de detalhamento e análise aprofundada de gastos por categoria.

### 📄 Exportação de Relatórios
- **PDF**: Relatórios estruturados e diagramados para prestação de contas e declarações.
- **CSV / Planilhas**: Exportação tabular compatível com Excel, Google Sheets e LibreOffice.

### 🎨 Personalização de Temas & Cores
- Seletor de paletas de cores modernas (*Dark Obsidian, Emerald Gold, Midnight Blue, Sunset Rose, Cyber Neon*, etc.).
- Editor de paleta personalizada com preview em tempo real.

### 🔐 Autenticação & Segurança
- Login seguro por e-mail e senha com hash `bcrypt`.
- **Google OAuth 2.0** integrado nativamente.
- Verificação de e-mail com código de 6 dígitos e recuperação de senha segura.
- Controle de acesso baseado em funções (Usuário Padrão e Painel de Administrador).

### 🚀 Atualizador Automático (Auto-Updater)
- Consulta periódica e não-intrusiva a novas versões no GitHub Releases.
- Notificação na tela com notas de lançamento (*Changelog*).
- Download e instalação automática em segundo plano com um único clique.

---

## 🏗️ Tecnologias Utilizadas

| Camada | Tecnologias |
| :--- | :--- |
| **Desktop / Shell** | [Electron](https://www.electronjs.org/), [Electron-Builder](https://www.electron.build/), [Electron Forge](https://www.electronforge.io/) |
| **Frontend UI** | [React 18](https://react.dev/), [Vite](https://vitejs.dev/), [Lucide React](https://lucide.dev/), Canvas-Confetti, CSS Variables |
| **Backend API** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), JWT (Access & Refresh Tokens), [Helmet](https://helmetjs.github.io/), Rate Limit |
| **Banco de Dados** | [PostgreSQL](https://www.postgresql.org/) (Nuvem Oracle Cloud / Turso) |
| **Envio de E-mails**| [Nodemailer](https://nodemailer.com/) com suporte a SMTP / Gmail / Brevo |
| **CI / CD** | [GitHub Actions](https://github.com/features/actions) com build automatizado Windows NSIS |

---

## 🚀 Como Executar em Desenvolvimento

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- [Git](https://git-scm.com/)

### 1. Clonar o Repositório
```bash
git clone https://github.com/EmanuellCarvalhoPires/gestorOrcamento.git
cd gestorOrcamento
```

### 2. Instalar as Dependências
```bash
# Instala as dependências do app Desktop
npm install

# Instala as dependências do servidor Backend
cd server
npm install
cd ..
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz ou na pasta `server/` baseado no modelo:
```env
# Servidor Backend
PORT=3000
JWT_SECRET=seu_segredo_jwt_super_seguro
JWT_REFRESH_SECRET=seu_segredo_refresh_super_seguro

# Banco de Dados PostgreSQL
PG_HOST=seu_host_postgresql
PG_PORT=5432
PG_DATABASE=gestor_orcamento
PG_USER=postgres
PG_PASSWORD=sua_senha

# Configuração SMTP (E-mails de Verificação e Recuperação)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_aplicativo

# Google OAuth 2.0
GOOGLE_CLIENT_ID=seu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

### 4. Iniciar o Aplicativo
```bash
# Inicia a aplicação Desktop Electron com Hot-Reload do Vite
npm start
```

---

## 📦 Como Gerar o Executável (.exe)

Para compilar o projeto e gerar o instalador executável oficial do Windows:

```bash
npm run build:nsis
# ou
npm run dist
```

Os binários compilados estarão disponíveis na pasta:
* **Instalador NSIS:** `dist_installer/Simple Finances Setup <versao>.exe`
* **Executável Portátil:** `dist_installer/win-unpacked/Simple Finances.exe`

---

## 🔄 Fluxo de CI/CD & Novas Releases

O repositório está configurado com **GitHub Actions** para entrega contínua:

1. Atualize a versão no arquivo `package.json` (ex: de `"1.1.6"` para `"1.1.7"`).
2. Faça o commit e envie para o branch principal:
   ```bash
   git add .
   git commit -m "release: v1.1.7"
   git push origin main
   ```
3. O GitHub Actions iniciará automaticamente uma máquina virtual Windows, compilará o aplicativo e publicará a nova **Release Oficial** com o instalador `.exe` pronto para download!

---

## 🛡️ Arquitetura & Segurança

- **Isolamento de Processos:** O Electron utiliza `contextIsolation: true` e comunicação segura via `preload.js` através de canais IPC validados.
- **Autenticação em Duas Camadas:** O cliente autentica requisições via JWT com renovação automática por Refresh Token em memória segura.
- **Proteção do Banco de Dados:** O cliente não possui acesso direto ao banco. Todas as operações passam pela API REST com validação rígida de propriedade (`usuario_id = req.user.id`) e consultas preparadas contra SQL Injection.
- **Proteção de Rede:** Proteção com Helmet para cabeçalhos HTTP, CORS restrito e Rate Limiting contra ataques de força bruta.

---

## 📄 Licença

Este projeto está licenciado sob a licença **MIT** - consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
Desenvolvido por <strong>Emanuell Carvalho Pires</strong> 🚀
</div>
