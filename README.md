# InnovateChat - Sistema Completo de Automação WhatsApp

Sistema completo de automação e gerenciamento de campanhas WhatsApp com integração WhatsApp Web.js, interface React moderna e backend robusto.

## 🚀 Características Principais

- **Gerenciamento de Sessões WhatsApp**: Conexão múltipla com QR Code
- **Campanhas Automatizadas**: Criação, agendamento e monitoramento
- **Gerenciamento de Contatos**: Listas, importação e segmentação
- **Chat em Tempo Real**: Monitoramento de conversas
- **Dashboard Analytics**: Estatísticas e relatórios detalhados
- **Sistema de Usuários**: Autenticação e controle de acesso
- **Webhooks**: Integração com sistemas externos

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Interface de usuário
- **Tailwind CSS** - Estilização moderna
- **Vite** - Build tool otimizado
- **React Router** - Navegação
- **Supabase Client** - Banco de dados em tempo real

### Backend
- **Node.js + Express** - Servidor API
- **WhatsApp Web.js** - Integração WhatsApp
- **Supabase** - Banco de dados PostgreSQL
- **Node-cron** - Agendamento de tarefas
- **Puppeteer** - Automação do navegador

## 📋 Pré-requisitos

- Node.js 18+ 
- NPM ou Yarn
- Conta Supabase (gratuita)
- Chrome/Chromium (para WhatsApp Web.js)

## ⚙️ Instalação e Configuração

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/innovatechat.git
cd innovatechat
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do Supabase
VITE_SUPABASE_URL=https://ktzeaycutqvwrvdkphrz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0emVheWN1dHF2d3J2ZGtwaHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDEzMjEsImV4cCI6MjA2OTY3NzMyMX0.5KHK2YdZWAQwKT3e6Q859gg6Vm17avegxntIb1UnV9w
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0emVheWN1dHF2d3J2ZGtwaHJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDEwMTMyMSwiZXhwIjoyMDY5Njc3MzIxfQ.DclP-poWSeq6yQHJGzOOSp1c5yjGnVcSSX07S7FvvvI

# Configurações do Servidor Backend
PORT=4000
NODE_ENV=development

# Configurações do WhatsApp Web.js
WHATSAPP_SESSION_PATH=./whatsapp-sessions
WHATSAPP_PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-accelerated-2d-canvas,--no-first-run,--no-zygote,--single-process,--disable-gpu
```

### 4. Configure o Banco de Dados

As migrações do Supabase já estão incluídas em `supabase/migrations/`. O banco será configurado automaticamente com:

- Tabelas de usuários, sessões, campanhas, contatos
- Funções RPC para estatísticas e logs
- Políticas RLS para segurança
- Dados de exemplo para teste

### 5. Execute o Sistema

#### Opção 1: Executar Tudo Simultaneamente
```bash
npm run dev:all
```

#### Opção 2: Executar Separadamente

**Terminal 1 - Frontend:**
```bash
npm start
```

**Terminal 2 - Backend API:**
```bash
npm run server
```

**Terminal 3 - Processador de Campanhas:**
```bash
npm run campaign-processor
```

## 🌐 Acesso ao Sistema

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

### Credenciais de Teste

**Administrador:**
- Email: `sergioasj93@gmail.com`
- Senha: `Abreu1993@`

**Usuário Regular:**
- Email: `user@innovatechat.com`
- Senha: `user123456`

## 📱 Como Usar

### 1. Gerenciar Sessões WhatsApp

1. Acesse **WhatsApp Sessions** no menu
2. Clique em **Nova Sessão**
3. Escaneie o QR Code com seu WhatsApp
4. Aguarde a conexão ser estabelecida

### 2. Criar Campanhas

1. Vá para **Gerenciar Contatos** e crie uma lista
2. Importe ou adicione contatos manualmente
3. Acesse **Criar Campanha**
4. Configure mensagem, lista e agendamento
5. Execute ou agende a campanha

### 3. Monitorar Resultados

1. **Dashboard**: Visão geral das métricas
2. **Monitorar Campanhas**: Status detalhado
3. **Chat ao Vivo**: Conversas em tempo real

## 🔧 Estrutura do Projeto

```
innovatechat/
├── src/                          # Frontend React
│   ├── components/              # Componentes reutilizáveis
│   ├── pages/                   # Páginas da aplicação
│   ├── services/               # Serviços de API
│   ├── contexts/               # Contextos React
│   └── utils/                  # Utilitários
├── server/                      # Backend Node.js
│   ├── routes/                 # Rotas da API
│   ├── whatsappManager.js      # Gerenciador WhatsApp
│   ├── campaignProcessor.js    # Processador de campanhas
│   └── index.js               # Servidor principal
├── supabase/                   # Configurações do banco
│   └── migrations/            # Migrações SQL
└── public/                    # Arquivos estáticos
```

## 🔌 API Endpoints

### WhatsApp Sessions
- `GET /api/whatsapp/sessions` - Listar sessões
- `POST /api/whatsapp/sessions` - Criar sessão
- `POST /api/whatsapp/sessions/:id/connect` - Conectar
- `POST /api/whatsapp/sessions/:id/disconnect` - Desconectar
- `GET /api/whatsapp/sessions/:id/qr` - Obter QR Code
- `POST /api/whatsapp/sessions/:id/send-message` - Enviar mensagem

### Campanhas
- `POST /api/campaigns/:id/process` - Processar campanha
- `POST /api/campaigns/:id/pause` - Pausar campanha
- `POST /api/campaigns/:id/resume` - Retomar campanha
- `GET /api/campaigns/:id/stats` - Estatísticas

### Webhooks
- `POST /webhook/whatsapp` - Eventos WhatsApp
- `POST /webhook/system` - Eventos do sistema
- `POST /webhook/integration/:service` - Integrações externas

## 🔄 Jobs Automatizados

O sistema executa jobs automáticos para:

- **Campanhas Agendadas**: Verifica a cada minuto
- **Reconexão de Sessões**: Verifica a cada 5 minutos
- **Limpeza de Dados**: Executa diariamente às 2:00
- **Atualização de Estatísticas**: Executa a cada hora

## 🛡️ Segurança

- **Row Level Security (RLS)** no Supabase
- **Autenticação JWT** via Supabase Auth
- **Validação de entrada** em todas as APIs
- **Rate limiting** para proteção contra spam
- **Logs de auditoria** para todas as ações

## 🚀 Deploy em Produção

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy da pasta dist/
```

### Backend (Railway/Heroku)
```bash
# Configure as variáveis de ambiente
# Deploy do diretório server/
```

### Banco de Dados
- Use o Supabase em produção
- Configure backups automáticos
- Monitore performance

## 🔧 Troubleshooting

### Problemas Comuns

**QR Code não aparece:**
- Verifique se o backend está rodando
- Confirme as configurações do Puppeteer
- Verifique logs do servidor

**Mensagens não enviam:**
- Confirme se a sessão está conectada
- Verifique limites diários do WhatsApp
- Analise logs de erro

**Erro de conexão com banco:**
- Confirme credenciais do Supabase
- Verifique conectividade de rede
- Analise políticas RLS

### Logs e Monitoramento

```bash
# Logs do backend
tail -f server/logs/app.log

# Logs do processador
tail -f server/logs/campaign.log

# Status das sessões
curl http://localhost:4000/health
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Email**: sergioasj93@gmail.com
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/innovatechat/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/seu-usuario/innovatechat/wiki)

## 🎯 Roadmap

- [ ] Integração com mais plataformas de mensagem
- [ ] Dashboard avançado com BI
- [ ] API para integrações externas
- [ ] App mobile React Native
- [ ] Chatbots com IA
- [ ] Análise de sentimento
- [ ] Relatórios PDF automatizados

---

**InnovateChat** - Transformando a comunicação empresarial através da automação inteligente do WhatsApp.
