const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');
const crypto = require('crypto');
const zlib = require('zlib');
const { logger } = require('./logger');

class BackupManager {
  constructor(supabase, config) {
    this.supabase = supabase;
    this.config = config;
    this.backupDir = config.storage?.path || './backups';
    this.isRunning = false;
    
    this.initializeBackupSystem();
  }

  async initializeBackupSystem() {
    try {
      // Criar diretório de backup se não existir
      await this.ensureBackupDirectory();
      
      // Carregar configurações de backup do banco
      await this.loadBackupConfigs();
      
      // Agendar backups automáticos
      this.scheduleBackups();
      
      logger.info('Sistema de backup inicializado');
    } catch (error) {
      logger.error('Erro ao inicializar sistema de backup', error);
    }
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info(`Diretório de backup criado: ${this.backupDir}`);
    }
  }

  async loadBackupConfigs() {
    try {
      const { data: configs, error } = await this.supabase
        .from('backup_configs')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      this.backupConfigs = configs || [];
      logger.info(`Carregadas ${this.backupConfigs.length} configurações de backup`);
    } catch (error) {
      logger.error('Erro ao carregar configurações de backup', error);
      this.backupConfigs = [];
    }
  }

  scheduleBackups() {
    this.backupConfigs.forEach(config => {
      try {
        cron.schedule(config.schedule, async () => {
          await this.executeBackup(config);
        }, {
          scheduled: true,
          timezone: 'America/Sao_Paulo'
        });
        
        logger.info(`Backup agendado: ${config.name} - ${config.schedule}`);
      } catch (error) {
        logger.error(`Erro ao agendar backup ${config.name}`, error);
      }
    });
  }

  async executeBackup(config) {
    if (this.isRunning) {
      logger.warn(`Backup ${config.name} pulado - outro backup em execução`);
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      logger.info(`Iniciando backup: ${config.name}`);
      
      // Registrar início do backup
      const backupRecord = await this.createBackupRecord(config.id, 'running');
      
      // Executar backup das tabelas
      const backupData = await this.backupTables(config.tables_to_backup);
      
      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${config.name.replace(/\s+/g, '_')}_${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);
      
      // Salvar dados
      let finalData = JSON.stringify(backupData, null, 2);
      let fileSize = Buffer.byteLength(finalData, 'utf8');
      
      // Comprimir se configurado
      if (this.config.compressionLevel > 0) {
        finalData = await this.compressData(finalData);
        fileSize = finalData.length;
      }
      
      // Criptografar se configurado
      if (this.config.encryptBackups) {
        finalData = await this.encryptData(finalData);
        fileSize = finalData.length;
      }
      
      // Salvar arquivo
      await fs.writeFile(filepath, finalData);
      
      // Atualizar registro do backup
      await this.updateBackupRecord(backupRecord.id, {
        status: 'completed',
        backup_file: filename,
        file_size: fileSize,
        completed_at: new Date().toISOString()
      });
      
      // Atualizar configuração
      await this.updateBackupConfig(config.id);
      
      // Limpar backups antigos
      await this.cleanupOldBackups(config);
      
      const duration = Date.now() - startTime;
      logger.info(`Backup concluído: ${config.name} (${duration}ms, ${this.formatFileSize(fileSize)})`);
      
    } catch (error) {
      logger.error(`Erro no backup ${config.name}`, error);
      
      // Registrar erro
      if (backupRecord) {
        await this.updateBackupRecord(backupRecord.id, {
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        });
      }
    } finally {
      this.isRunning = false;
    }
  }

  async backupTables(tables) {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {}
    };

    for (const tableName of tables) {
      try {
        logger.info(`Fazendo backup da tabela: ${tableName}`);
        
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*');

        if (error) {
          logger.error(`Erro ao fazer backup da tabela ${tableName}`, error);
          continue;
        }

        backupData.tables[tableName] = {
          count: data?.length || 0,
          data: data || []
        };

        logger.info(`Tabela ${tableName}: ${data?.length || 0} registros`);
      } catch (error) {
        logger.error(`Erro ao processar tabela ${tableName}`, error);
      }
    }

    return backupData;
  }

  async compressData(data) {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, { level: this.config.compressionLevel }, (error, compressed) => {
        if (error) reject(error);
        else resolve(compressed);
      });
    });
  }

  async encryptData(data) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('InnovateChat-Backup', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm
    });
  }

  async decryptData(encryptedData) {
    const { encrypted, iv, authTag, algorithm } = JSON.parse(encryptedData);
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('InnovateChat-Backup', 'utf8'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async createBackupRecord(configId, status) {
    const { data, error } = await this.supabase
      .from('backup_history')
      .insert({
        config_id: configId,
        status: status,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateBackupRecord(recordId, updates) {
    const { error } = await this.supabase
      .from('backup_history')
      .update(updates)
      .eq('id', recordId);

    if (error) throw error;
  }

  async updateBackupConfig(configId) {
    const nextBackup = this.calculateNextBackup();
    
    const { error } = await this.supabase
      .from('backup_configs')
      .update({
        last_backup_at: new Date().toISOString(),
        next_backup_at: nextBackup
      })
      .eq('id', configId);

    if (error) throw error;
  }

  calculateNextBackup() {
    // Calcular próximo backup baseado no cron schedule
    // Implementação simplificada - retorna próxima execução em 24h
    const next = new Date();
    next.setDate(next.getDate() + 1);
    return next.toISOString();
  }

  async cleanupOldBackups(config) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.retention_days);

      // Buscar backups antigos
      const { data: oldBackups, error } = await this.supabase
        .from('backup_history')
        .select('*')
        .eq('config_id', config.id)
        .lt('started_at', cutoffDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      // Remover arquivos e registros
      for (const backup of oldBackups || []) {
        try {
          // Remover arquivo
          const filepath = path.join(this.backupDir, backup.backup_file);
          await fs.unlink(filepath);
          
          // Remover registro
          await this.supabase
            .from('backup_history')
            .delete()
            .eq('id', backup.id);
          
          logger.info(`Backup antigo removido: ${backup.backup_file}`);
        } catch (error) {
          logger.error(`Erro ao remover backup ${backup.backup_file}`, error);
        }
      }

      if (oldBackups?.length > 0) {
        logger.info(`Limpeza concluída: ${oldBackups.length} backups antigos removidos`);
      }
    } catch (error) {
      logger.error('Erro na limpeza de backups antigos', error);
    }
  }

  // Backup manual
  async createManualBackup(tables, name = 'Manual Backup') {
    if (this.isRunning) {
      throw new Error('Outro backup está em execução');
    }

    const config = {
      id: 'manual',
      name: name,
      tables_to_backup: tables,
      retention_days: 7
    };

    await this.executeBackup(config);
  }

  // Restaurar backup
  async restoreBackup(backupFile, options = {}) {
    try {
      logger.info(`Iniciando restauração do backup: ${backupFile}`);
      
      const filepath = path.join(this.backupDir, backupFile);
      let data = await fs.readFile(filepath);

      // Descriptografar se necessário
      if (this.config.encryptBackups) {
        data = await this.decryptData(data.toString());
      }

      // Descomprimir se necessário
      if (this.config.compressionLevel > 0) {
        data = await this.decompressData(data);
      }

      const backupData = JSON.parse(data);
      
      // Validar estrutura do backup
      if (!backupData.tables) {
        throw new Error('Estrutura de backup inválida');
      }

      // Restaurar tabelas
      for (const [tableName, tableData] of Object.entries(backupData.tables)) {
        if (options.tables && !options.tables.includes(tableName)) {
          continue;
        }

        await this.restoreTable(tableName, tableData.data, options);
      }

      logger.info(`Restauração concluída: ${backupFile}`);
    } catch (error) {
      logger.error(`Erro na restauração do backup ${backupFile}`, error);
      throw error;
    }
  }

  async restoreTable(tableName, data, options = {}) {
    try {
      logger.info(`Restaurando tabela: ${tableName} (${data.length} registros)`);

      if (options.truncate) {
        // Limpar tabela antes de restaurar
        await this.supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      }

      // Inserir dados em lotes
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const { error } = await this.supabase
          .from(tableName)
          .insert(batch);

        if (error && !options.ignoreErrors) {
          throw error;
        }
      }

      logger.info(`Tabela ${tableName} restaurada com sucesso`);
    } catch (error) {
      logger.error(`Erro ao restaurar tabela ${tableName}`, error);
      if (!options.ignoreErrors) {
        throw error;
      }
    }
  }

  async decompressData(data) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(data, (error, decompressed) => {
        if (error) reject(error);
        else resolve(decompressed.toString());
      });
    });
  }

  // Listar backups disponíveis
  async listBackups(configId = null) {
    let query = this.supabase
      .from('backup_history')
      .select(`
        *,
        backup_configs(name)
      `)
      .eq('status', 'completed')
      .order('started_at', { ascending: false });

    if (configId) {
      query = query.eq('config_id', configId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }

  // Verificar integridade do backup
  async verifyBackup(backupFile) {
    try {
      const filepath = path.join(this.backupDir, backupFile);
      const stats = await fs.stat(filepath);
      
      if (stats.size === 0) {
        return { valid: false, error: 'Arquivo vazio' };
      }

      let data = await fs.readFile(filepath);

      // Tentar descriptografar e descomprimir
      if (this.config.encryptBackups) {
        data = await this.decryptData(data.toString());
      }

      if (this.config.compressionLevel > 0) {
        data = await this.decompressData(data);
      }

      const backupData = JSON.parse(data);

      // Validar estrutura
      if (!backupData.timestamp || !backupData.tables) {
        return { valid: false, error: 'Estrutura inválida' };
      }

      return {
        valid: true,
        timestamp: backupData.timestamp,
        version: backupData.version,
        tableCount: Object.keys(backupData.tables).length,
        totalRecords: Object.values(backupData.tables).reduce((sum, table) => sum + table.count, 0)
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Estatísticas de backup
  async getBackupStats() {
    const { data, error } = await this.supabase
      .from('backup_history')
      .select('status, file_size, started_at, completed_at')
      .order('started_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const stats = {
      total: data.length,
      successful: data.filter(b => b.status === 'completed').length,
      failed: data.filter(b => b.status === 'failed').length,
      totalSize: data.reduce((sum, b) => sum + (b.file_size || 0), 0),
      lastBackup: data[0]?.started_at,
      averageSize: 0,
      averageDuration: 0
    };

    const completedBackups = data.filter(b => b.status === 'completed' && b.file_size);
    if (completedBackups.length > 0) {
      stats.averageSize = stats.totalSize / completedBackups.length;
      
      const durations = completedBackups
        .filter(b => b.completed_at)
        .map(b => new Date(b.completed_at) - new Date(b.started_at));
      
      if (durations.length > 0) {
        stats.averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      }
    }

    return stats;
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Parar sistema de backup
  async stop() {
    this.isRunning = false;
    logger.info('Sistema de backup parado');
  }
}

module.exports = BackupManager;
