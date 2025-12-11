# Guía de Limpieza de Backups

## Uso Manual del Script

### 1. Dar permisos de ejecución
```bash
chmod +x scripts/cleanup-backups.sh
```

### 2. Ejecutar en modo prueba (DRY RUN)
```bash
# Ver qué se eliminaría sin borrar nada
DRY_RUN=true BACKUP_PATH=/var/backups ./scripts/cleanup-backups.sh 30
```

### 3. Ejecutar limpieza real
```bash
# Eliminar backups más antiguos de 30 días
BACKUP_PATH=/var/backups ./scripts/cleanup-backups.sh 30

# Eliminar backups más antiguos de 7 días
BACKUP_PATH=/var/backups ./scripts/cleanup-backups.sh 7
```

## Programar Limpieza Automática con Cron

### Opción 1: Limpieza Semanal (Recomendado)
```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar cada domingo a las 3 AM
# Mantiene backups de los últimos 30 días
0 3 * * 0 BACKUP_PATH=/var/backups /ruta/al/proyecto/scripts/cleanup-backups.sh 30 >> /var/log/backup-cleanup.log 2>&1
```

### Opción 2: Limpieza Diaria
```bash
# Ejecutar cada día a las 2 AM
# Mantiene backups de los últimos 7 días
0 2 * * * BACKUP_PATH=/var/backups /ruta/al/proyecto/scripts/cleanup-backups.sh 7 >> /var/log/backup-cleanup.log 2>&1
```

### Opción 3: Limpieza Mensual
```bash
# Ejecutar el primer día de cada mes a la 1 AM
# Mantiene backups de los últimos 90 días
0 1 1 * * BACKUP_PATH=/var/backups /ruta/al/proyecto/scripts/cleanup-backups.sh 90 >> /var/log/backup-cleanup.log 2>&1
```

## Recomendaciones por Entorno

| Entorno | Frecuencia | Días a Mantener | Comando Cron |
|---------|------------|-----------------|--------------|
| **Desarrollo** | Diaria | 7 días | `0 2 * * * ...cleanup-backups.sh 7` |
| **Preproducción** | Semanal | 30 días | `0 3 * * 0 ...cleanup-backups.sh 30` |
| **Producción** | Semanal | 60 días | `0 3 * * 0 ...cleanup-backups.sh 60` |

## Verificar Logs de Limpieza

```bash
# Ver últimas ejecuciones
tail -f /var/log/backup-cleanup.log

# Ver cuánto espacio se ha liberado
grep "Freed approximately" /var/log/backup-cleanup.log
```

## Ejemplo Completo de Configuración

```bash
# 1. Dar permisos
chmod +x /var/www/back-asignaciones/scripts/cleanup-backups.sh

# 2. Crear directorio de logs
sudo mkdir -p /var/log
sudo touch /var/log/backup-cleanup.log
sudo chmod 666 /var/log/backup-cleanup.log

# 3. Configurar cron
crontab -e

# 4. Agregar esta línea (ajustar rutas según tu servidor)
0 3 * * 0 BACKUP_PATH=/var/backups /var/www/back-asignaciones/scripts/cleanup-backups.sh 30 >> /var/log/backup-cleanup.log 2>&1

# 5. Verificar que se agregó correctamente
crontab -l
```

## Solución de Problemas

### El script no encuentra los backups
- Verificar que `BACKUP_PATH` apunte al directorio correcto
- Verificar permisos: `ls -la /var/backups`

### No se pueden eliminar archivos
- Verificar permisos del usuario que ejecuta el cron
- Ejecutar con sudo si es necesario

### Quiero recuperar espacio inmediatamente
```bash
# Eliminar backups más antiguos de 3 días
BACKUP_PATH=/var/backups ./scripts/cleanup-backups.sh 3
```
