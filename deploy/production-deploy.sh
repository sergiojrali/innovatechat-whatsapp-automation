#!/bin/bash

# Script de Deploy para Produção - InnovateChat
# Autor: Sistema InnovateChat
# Data: Janeiro 2025

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_NAME="innovatechat"
DEPLOY_USER="deploy"
DEPLOY_PATH="/var/www/innovatechat"
BACKUP_PATH="/var/backups/innovatechat"
LOG_FILE="/var/log/innovatechat-deploy.log"
NODE_VERSION="18"
PM2_APP_NAME="innovatechat"

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    echo "[ERROR] $1" >> $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
    echo "[WARNING] $1" >> $LOG_FILE
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
    echo "[INFO] $1" >> $LOG_FILE
}

# Verificar se está rodando como root ou com sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script deve ser executado como root ou com sudo"
    fi
}

# Verificar dependências do sistema
check_dependencies() {
    log "Verificando dependências do sistema..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js não está instalado"
    fi
    
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt "$NODE_VERSION" ]; then
        error "Node.js versão $NODE_VERSION ou superior é necessária (atual: v$(node -v))"
    fi
    
    # PM2
    if ! command -v pm2 &> /dev/null; then
        warning "PM2 não está instalado. Instalando..."
        npm install -g pm2
    fi
    
    # Git
    if ! command -v git &> /dev/null; then
        error "Git não está instalado"
    fi
    
    # PostgreSQL client (para backups)
    if ! command -v pg_dump &> /dev/null; then
        warning "PostgreSQL client não está instalado"
    fi
    
    log "Dependências verificadas com sucesso"
}

# Criar usuário de deploy se não existir
create_deploy_user() {
    if ! id "$DEPLOY_USER" &>/dev/null; then
        log "Criando usuário de deploy: $DEPLOY_USER"
        useradd -m -s /bin/bash $DEPLOY_USER
        usermod -aG sudo $DEPLOY_USER
    fi
}

# Criar diretórios necessários
create_directories() {
    log "Criando diretórios necessários..."
    
    mkdir -p $DEPLOY_PATH
    mkdir -p $BACKUP_PATH
    mkdir -p /var/log/innovatechat
    mkdir -p /etc/innovatechat
    
    # Definir permissões
    chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH
    chown -R $DEPLOY_USER:$DEPLOY_USER $BACKUP_PATH
    chown -R $DEPLOY_USER:$DEPLOY_USER /var/log/innovatechat
    
    chmod 755 $DEPLOY_PATH
    chmod 755 $BACKUP_PATH
    chmod 755 /var/log/innovatechat
}

# Fazer backup da versão atual
backup_current_version() {
    if [ -d "$DEPLOY_PATH/current" ]; then
        log "Fazendo backup da versão atual..."
        
        local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
        cp -r $DEPLOY_PATH/current $BACKUP_PATH/$backup_name
        
        # Manter apenas os últimos 5 backups
        cd $BACKUP_PATH
        ls -t | tail -n +6 | xargs -r rm -rf
        
        log "Backup criado: $BACKUP_PATH/$backup_name"
    fi
}

# Clonar ou atualizar código
deploy_code() {
    log "Fazendo deploy do código..."
    
    cd $DEPLOY_PATH
    
    # Se é o primeiro deploy
    if [ ! -d "current" ]; then
        log "Primeiro deploy - clonando repositório..."
        git clone https://github.com/seu-usuario/innovatechat.git current
    else
        log "Atualizando código existente..."
        cd current
        git fetch origin
        git reset --hard origin/main
    fi
    
    cd $DEPLOY_PATH/current
    
    # Verificar se o deploy foi bem-sucedido
    if [ ! -f "package.json" ]; then
        error "Deploy falhou - package.json não encontrado"
    fi
    
    log "Código atualizado com sucesso"
}

# Instalar dependências
install_dependencies() {
    log "Instalando dependências..."
    
    cd $DEPLOY_PATH/current
    
    # Instalar dependências do backend
    npm ci --production --silent
    
    # Instalar dependências do frontend e fazer build
    npm run build
    
    log "Dependências instaladas com sucesso"
}

# Configurar variáveis de ambiente
setup_environment() {
    log "Configurando variáveis de ambiente..."
    
    local env_file="$DEPLOY_PATH/current/.env"
    
    if [ ! -f "$env_file" ]; then
        warning "Arquivo .env não encontrado. Criando a partir do template..."
        cp $DEPLOY_PATH/current/.env.example $env_file
        
        error "Configure o arquivo .env em $env_file antes de continuar"
    fi
    
    # Verificar variáveis obrigatórias
    local required_vars=("VITE_SUPABASE_URL" "SUPABASE_SERVICE_ROLE" "NODE_ENV")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" $env_file; then
            error "Variável obrigatória $var não encontrada no .env"
        fi
    done
    
    # Definir NODE_ENV como production
    sed -i 's/NODE_ENV=.*/NODE_ENV=production/' $env_file
    
    log "Variáveis de ambiente configuradas"
}

# Executar migrações do banco
run_migrations() {
    log "Executando migrações do banco de dados..."
    
    cd $DEPLOY_PATH/current
    
    # Verificar se há migrações para executar
    if [ -d "supabase/migrations" ]; then
        info "Migrações encontradas em supabase/migrations"
        info "Execute as migrações manualmente no Supabase Dashboard"
        info "ou use a CLI do Supabase: supabase db push"
    fi
    
    log "Migrações verificadas"
}

# Configurar PM2
setup_pm2() {
    log "Configurando PM2..."
    
    cd $DEPLOY_PATH/current
    
    # Criar arquivo de configuração do PM2
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '${PM2_APP_NAME}-server',
      script: 'server/index.js',
      cwd: '${DEPLOY_PATH}/current',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '/var/log/innovatechat/server-error.log',
      out_file: '/var/log/innovatechat/server-out.log',
      log_file: '/var/log/innovatechat/server.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'whatsapp-sessions'],
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: '${PM2_APP_NAME}-processor',
      script: 'server/campaignProcessor.js',
      cwd: '${DEPLOY_PATH}/current',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/innovatechat/processor-error.log',
      out_file: '/var/log/innovatechat/processor-out.log',
      log_file: '/var/log/innovatechat/processor.log',
      time: true,
      max_memory_restart: '512M',
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF
    
    # Definir permissões
    chown $DEPLOY_USER:$DEPLOY_USER ecosystem.config.js
    
    log "Configuração do PM2 criada"
}

# Configurar Nginx
setup_nginx() {
    log "Configurando Nginx..."
    
    # Verificar se Nginx está instalado
    if ! command -v nginx &> /dev/null; then
        warning "Nginx não está instalado. Instalando..."
        apt-get update
        apt-get install -y nginx
    fi
    
    # Criar configuração do site
    cat > /etc/nginx/sites-available/innovatechat << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (configure with your certificates)
    # ssl_certificate /path/to/your/certificate.crt;
    # ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend (React build)
    location / {
        root ${DEPLOY_PATH}/current/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Webhook endpoints
    location /webhook/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:4000;
        access_log off;
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
    
    # Logs
    access_log /var/log/nginx/innovatechat-access.log;
    error_log /var/log/nginx/innovatechat-error.log;
}
EOF
    
    # Habilitar site
    ln -sf /etc/nginx/sites-available/innovatechat /etc/nginx/sites-enabled/
    
    # Remover site padrão
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    nginx -t
    
    log "Nginx configurado com sucesso"
}

# Configurar firewall
setup_firewall() {
    log "Configurando firewall..."
    
    # UFW (Ubuntu Firewall)
    if command -v ufw &> /dev/null; then
        ufw --force enable
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow ssh
        ufw allow 'Nginx Full'
        ufw allow 80
        ufw allow 443
        
        log "Firewall configurado com UFW"
    else
        warning "UFW não está disponível. Configure o firewall manualmente"
    fi
}

# Configurar logrotate
setup_logrotate() {
    log "Configurando rotação de logs..."
    
    cat > /etc/logrotate.d/innovatechat << EOF
/var/log/innovatechat/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $DEPLOY_USER $DEPLOY_USER
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/innovatechat-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF
    
    log "Logrotate configurado"
}

# Configurar cron jobs
setup_cron() {
    log "Configurando cron jobs..."
    
    # Backup diário
    (crontab -u $DEPLOY_USER -l 2>/dev/null; echo "0 2 * * * cd $DEPLOY_PATH/current && npm run backup") | crontab -u $DEPLOY_USER -
    
    # Limpeza de logs antigos
    (crontab -u $DEPLOY_USER -l 2>/dev/null; echo "0 3 * * 0 find /var/log/innovatechat -name '*.log' -mtime +30 -delete") | crontab -u $DEPLOY_USER -
    
    # Health check
    (crontab -u $DEPLOY_USER -l 2>/dev/null; echo "*/5 * * * * curl -f http://localhost:4000/health > /dev/null 2>&1 || pm2 restart $PM2_APP_NAME-server") | crontab -u $DEPLOY_USER -
    
    log "Cron jobs configurados"
}

# Iniciar serviços
start_services() {
    log "Iniciando serviços..."
    
    cd $DEPLOY_PATH/current
    
    # Parar processos existentes
    su - $DEPLOY_USER -c "pm2 delete all" 2>/dev/null || true
    
    # Iniciar aplicação
    su - $DEPLOY_USER -c "cd $DEPLOY_PATH/current && pm2 start ecosystem.config.js"
    
    # Salvar configuração do PM2
    su - $DEPLOY_USER -c "pm2 save"
    
    # Configurar PM2 para iniciar no boot
    su - $DEPLOY_USER -c "pm2 startup" | tail -n 1 | bash
    
    # Reiniciar Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    log "Serviços iniciados com sucesso"
}

# Verificar se deploy foi bem-sucedido
verify_deployment() {
    log "Verificando deployment..."
    
    # Aguardar serviços iniciarem
    sleep 10
    
    # Verificar se PM2 está rodando
    if ! su - $DEPLOY_USER -c "pm2 list" | grep -q "online"; then
        error "Aplicação não está rodando no PM2"
    fi
    
    # Verificar se API está respondendo
    if ! curl -f http://localhost:4000/health > /dev/null 2>&1; then
        error "API não está respondendo"
    fi
    
    # Verificar se Nginx está rodando
    if ! systemctl is-active --quiet nginx; then
        error "Nginx não está rodando"
    fi
    
    log "Deployment verificado com sucesso!"
}

# Mostrar informações pós-deploy
show_post_deploy_info() {
    log "=== DEPLOY CONCLUÍDO COM SUCESSO ==="
    info ""
    info "Aplicação: InnovateChat"
    info "Versão: $(cd $DEPLOY_PATH/current && git rev-parse --short HEAD)"
    info "Deploy Path: $DEPLOY_PATH/current"
    info "Logs: /var/log/innovatechat/"
    info ""
    info "Comandos úteis:"
    info "  - Ver logs: pm2 logs"
    info "  - Status: pm2 status"
    info "  - Restart: pm2 restart all"
    info "  - Monitorar: pm2 monit"
    info ""
    info "URLs:"
    info "  - Frontend: https://yourdomain.com"
    info "  - API: https://yourdomain.com/api"
    info "  - Health: https://yourdomain.com/health"
    info ""
    warning "IMPORTANTE:"
    warning "1. Configure SSL/TLS certificates no Nginx"
    warning "2. Configure as variáveis de ambiente em $DEPLOY_PATH/current/.env"
    warning "3. Execute as migrações do banco de dados"
    warning "4. Configure backup automático"
    warning "5. Configure monitoramento (opcional)"
}

# Função principal
main() {
    log "Iniciando deploy de produção do InnovateChat..."
    
    check_permissions
    check_dependencies
    create_deploy_user
    create_directories
    backup_current_version
    deploy_code
    install_dependencies
    setup_environment
    run_migrations
    setup_pm2
    setup_nginx
    setup_firewall
    setup_logrotate
    setup_cron
    start_services
    verify_deployment
    show_post_deploy_info
    
    log "Deploy concluído com sucesso!"
}

# Executar função principal
main "$@"
