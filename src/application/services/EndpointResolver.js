/**
 * Servicio para resolver variables dinámicas en endpoints y bodies
 * Permite construir URLs y cuerpos de requests con datos dinámicos
 */
class EndpointResolver {
  /**
   * Obtiene un valor de un objeto usando notación de punto
   * Ejemplo: getValueFromPath(data, 'assignment.processId') => data.assignment.processId
   * @param {Object} obj - Objeto fuente
   * @param {string} path - Ruta en notación de punto
   * @returns {*} - Valor encontrado o undefined
   */
  getValueFromPath(obj, path) {
    if (!obj || !path) return undefined;

    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) return undefined;
      return current[key];
    }, obj);
  }

  /**
   * Resuelve variables en una URL template
   * Ejemplo: resolveUrl('https://api.com/{documentType}/{documentNumber}', mapping, data)
   * @param {string} template - URL con placeholders {variable}
   * @param {Object} mapping - Mapeo de placeholders a rutas de datos
   * @param {Object} data - Datos fuente
   * @returns {string} - URL resuelta
   */
  resolveUrl(template, mapping, data) {
    if (!template) {
      throw new Error('URL template is required');
    }

    if (!mapping) {
      return template; // Si no hay mapeo, devolver template tal cual
    }

    let resolvedUrl = template;

    // Reemplazar cada placeholder con su valor
    Object.entries(mapping).forEach(([placeholder, dataPath]) => {
      const value = this.getValueFromPath(data, dataPath);

      if (value === undefined || value === null) {
        console.warn(`⚠️  Variable '${placeholder}' not found in data at path '${dataPath}'`);
        return; // No reemplazar si no hay valor
      }

      // Reemplazar {placeholder} con el valor
      const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
      resolvedUrl = resolvedUrl.replace(regex, encodeURIComponent(value));
    });

    return resolvedUrl;
  }

  /**
   * Resuelve variables en un objeto body (recursivo)
   * Ejemplo: resolveBody({user: '{documentNumber}'}, mapping, data)
   * @param {Object} bodyTemplate - Template del body con placeholders
   * @param {Object} mapping - Mapeo de placeholders a rutas de datos
   * @param {Object} data - Datos fuente
   * @returns {Object} - Body resuelto
   */
  resolveBody(bodyTemplate, mapping, data) {
    if (!bodyTemplate) {
      return {};
    }

    if (!mapping) {
      return bodyTemplate; // Si no hay mapeo, devolver template tal cual
    }

    // Clonar el template para no modificar el original
    const resolved = JSON.parse(JSON.stringify(bodyTemplate));

    // Resolver variables recursivamente
    this.replaceVariablesRecursive(resolved, mapping, data);

    return resolved;
  }

  /**
   * Reemplaza variables recursivamente en un objeto
   * Soporta dos sintaxis:
   * 1. Con mapping: {placeholder} → busca en mapping[placeholder] → resuelve con data
   * 2. Path directo: {company.documentNumber} → resuelve directamente desde data
   *
   * @param {Object|Array} obj - Objeto o array a procesar
   * @param {Object} mapping - Mapeo de variables (puede ser null/undefined para paths directos)
   * @param {Object} data - Datos fuente
   */
  replaceVariablesRecursive(obj, mapping, data) {
    if (Array.isArray(obj)) {
      // Si es un array, procesar cada elemento
      obj.forEach((item, index) => {
        if (typeof item === 'string' && item.startsWith('{') && item.endsWith('}')) {
          const placeholder = item.slice(1, -1);

          // Intentar resolver con mapping primero, luego como path directo
          let dataPath = mapping && mapping[placeholder] ? mapping[placeholder] : null;

          // Si no hay mapping o el placeholder no está en el mapping, intentar como path directo
          if (!dataPath && placeholder.includes('.')) {
            dataPath = placeholder; // Usar el placeholder directamente como path
          }

          if (dataPath) {
            const value = this.getValueFromPath(data, dataPath);
            if (value !== undefined && value !== null) {
              obj[index] = value;
            }
          }
        } else if (typeof item === 'object' && item !== null) {
          this.replaceVariablesRecursive(item, mapping, data);
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      // Si es un objeto, procesar cada propiedad
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          // Es una variable: {placeholder}
          const placeholder = value.slice(1, -1);

          // Intentar resolver con mapping primero, luego como path directo
          let dataPath = mapping && mapping[placeholder] ? mapping[placeholder] : null;

          // Si no hay mapping o el placeholder no está en el mapping, intentar como path directo
          if (!dataPath && placeholder.includes('.')) {
            dataPath = placeholder; // Usar el placeholder directamente como path
          }

          if (dataPath) {
            const resolvedValue = this.getValueFromPath(data, dataPath);
            if (resolvedValue !== undefined && resolvedValue !== null) {
              obj[key] = resolvedValue;
            } else {
              console.warn(`⚠️  Variable '${placeholder}' not found in data at path '${dataPath}'`);
            }
          } else if (mapping) {
            // Solo advertir si hay mapping pero el placeholder no está mapeado
            console.warn(`⚠️  Variable '${placeholder}' not found in mapping`);
          }
        } else if (typeof value === 'object' && value !== null) {
          // Es un objeto anidado o array, procesar recursivamente
          this.replaceVariablesRecursive(value, mapping, data);
        }
      }
    }
  }

  /**
   * Resuelve headers personalizados con variables
   * @param {Object} headersTemplate - Template de headers
   * @param {Object} mapping - Mapeo de variables
   * @param {Object} data - Datos fuente
   * @returns {Object} - Headers resueltos
   */
  resolveHeaders(headersTemplate, mapping, data) {
    if (!headersTemplate) {
      return {};
    }

    if (!mapping) {
      return headersTemplate;
    }

    const resolved = JSON.parse(JSON.stringify(headersTemplate));
    this.replaceVariablesRecursive(resolved, mapping, data);

    return resolved;
  }

  /**
   * Valida que todos los placeholders en un template tengan mapeo
   * @param {string} template - Template a validar
   * @param {Object} mapping - Mapeo de variables
   * @returns {Object} - { valid: boolean, missing: string[] }
   */
  validateTemplateMapping(template, mapping) {
    const placeholderRegex = /\{([^}]+)\}/g;
    const placeholders = [];
    let match;

    while ((match = placeholderRegex.exec(template)) !== null) {
      placeholders.push(match[1]);
    }

    const missing = placeholders.filter(placeholder => !mapping || !mapping[placeholder]);

    return {
      valid: missing.length === 0,
      missing,
      placeholders
    };
  }

  /**
   * Obtiene todas las variables disponibles desde un objeto de datos
   * @param {Object} data - Objeto de datos
   * @param {string} prefix - Prefijo para rutas anidadas
   * @returns {Object} - Mapa de variables disponibles
   */
  getAvailableVariables(data, prefix = '') {
    const variables = {};

    if (!data || typeof data !== 'object') {
      return variables;
    }

    for (const [key, value] of Object.entries(data)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        variables[path] = 'null';
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Objeto anidado, recursión
        Object.assign(variables, this.getAvailableVariables(value, path));
      } else if (Array.isArray(value)) {
        variables[path] = 'array';
      } else {
        variables[path] = typeof value;
      }
    }

    return variables;
  }

  /**
   * Documenta las variables disponibles desde diferentes fuentes
   * @returns {Object} - Documentación de variables disponibles
   */
  static getAvailableDataFieldsDocumentation() {
    return {
      from_assignment: {
        'assignment.id': 'ID de la asignación',
        'assignment.processId': 'ID del proceso',
        'assignment.source': 'NIT de la empresa source',
        'assignment.documentNumber': 'Número de documento',
        'assignment.documentType': 'Tipo de documento (CC, NIT, etc)',
        'assignment.claimId': 'ID del claim',
        'assignment.invoiceAmount': 'Monto de la factura',
        'assignment.value': 'Valor de la asignación',
        'assignment.objectionCode': 'Código de objeción',
        'assignment.conceptApplicationCode': 'Código de aplicación',
        'assignment.externalReference': 'Referencia externa',
        'assignment.companyId': 'ID de la empresa',
        'assignment.userId': 'ID del usuario asignado'
      },
      from_user: {
        'user.id': 'ID del usuario',
        'user.name': 'Nombre del usuario',
        'user.dud': 'DUD del usuario',
        'user.companyId': 'ID de la empresa del usuario'
      },
      from_company: {
        'company.id': 'ID de la empresa',
        'company.name': 'Nombre de la empresa',
        'company.documentNumber': 'Número de documento de la empresa',
        'company.documentType': 'Tipo de documento de la empresa',
        'company.type': 'Tipo de empresa (PAYER, PROVIDER)'
      },
      examples: {
        url_template: 'https://api.com/{documentType}/{documentNumber}/claims',
        url_mapping: {
          documentType: 'assignment.documentType',
          documentNumber: 'assignment.documentNumber'
        },
        url_result: 'https://api.com/CC/123456789/claims',
        body_template: {
          assignedUser: '{userDud}',
          claimId: '{claimId}',
          metadata: {
            source: '{source}'
          }
        },
        body_mapping: {
          userDud: 'user.dud',
          claimId: 'assignment.claimId',
          source: 'assignment.source'
        },
        body_result: {
          assignedUser: 'CC1024595369',
          claimId: 'CLM-001',
          metadata: {
            source: '900123456'
          }
        }
      }
    };
  }
}

module.exports = EndpointResolver;
