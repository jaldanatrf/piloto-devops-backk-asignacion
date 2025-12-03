const express = require('express');
const router = express.Router();
  /**
   * @swagger
   * /api/rules/with-roles:
   *   get:
   *     summary: Obtener reglas y los roles asociados por companyId
   *     tags: [Rules]
   *     parameters:
   *       - in: query
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la compañía
   *     responses:
   *       200:
   *         description: Reglas y roles obtenidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *                       type:
   *                         type: string
   *                       minimumAmount:
   *                         type: number
   *                       maximumAmount:
   *                         type: number
   *                       nitAssociatedCompany:
   *                         type: string
   *                       roles:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             id:
   *                               type: integer
   *                             name:
   *                               type: string
   *                             description:
   *                               type: string
   *                 count:
   *                   type: integer
   *       400:
   *         description: companyId es requerido
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  /**
   * @swagger
   * /api/rules/with-roles:
   *   get:
   *     summary: Obtener reglas y los roles asociados por companyId
   *     tags: [Rules]
   *     parameters:
   *       - in: query
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la compañía
   *     responses:
   *       200:
   *         description: Reglas y roles obtenidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *                       type:
   *                         type: string
   *                       minimumAmount:
   *                         type: number
   *                       maximumAmount:
   *                         type: number
   *                       nitAssociatedCompany:
   *                         type: string
   *                       roles:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             id:
   *                               type: integer
   *                             name:
   *                               type: string
   *                             description:
   *                               type: string
   *                 count:
   *                   type: integer
   *       400:
   *         description: companyId es requerido
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // router.get('/rules/with-roles', ...) // Ruta movida a index.js para exponer /api/rules/with-roles
/**
 * @swagger
 * /api/companies/import-user/{documentType}/{documentNumber}/{dud}:
 *   post:
 *     summary: Importar usuario desde API externa usando documento de la compañía y DUD
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: documentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NIT, CC, CE, RUT]
 *         description: Tipo de documento de la empresa (usado como NIT para API externa)
 *       - in: path
 *         name: documentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de documento de la empresa (NIT)
 *       - in: path
 *         name: dud
 *         required: true
 *         schema:
 *           type: string
 *         description: DUD del usuario a importar
 *     responses:
 *       201:
 *         description: Usuario importado y creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: Empresa o usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: El usuario ya existe en el sistema local
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */


/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Crear una nueva empresa
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyInput'
 *     responses:
 *       201:
 *         description: Empresa creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Company'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   get:
 *     summary: Obtener todas las empresas
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de empresa
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CORPORATION, LLC, PARTNERSHIP, SOLE_PROPRIETORSHIP, NON_PROFIT, GOVERNMENT, OTHER]
 *         description: Filtrar por tipo de empresa
 *       - in: query
 *         name: includeRules
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir reglas asociadas a cada empresa
 *     responses:
 *       200:
 *         description: Lista de empresas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Company'
 *                     count:
 *                       type: integer
 *                       description: Número total de empresas
 *                     includesRules:
 *                       type: boolean
 *                       description: Indica si las reglas están incluidas en la respuesta
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/companies/active:
 *   get:
 *     summary: Obtener todas las empresas activas
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: includeRules
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir reglas asociadas a cada empresa
 *     responses:
 *       200:
 *         description: Lista de empresas activas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Company'
 *                     count:
 *                       type: integer
 *                       description: Número total de empresas activas
 *                     includesRules:
 *                       type: boolean
 *                       description: Indica si las reglas están incluidas
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Obtener empresa por ID
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa
 *       - in: query
 *         name: includeRules
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir reglas asociadas
 *     responses:
 *       200:
 *         description: Empresa encontrada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Company'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Actualizar empresa
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyInput'
 *     responses:
 *       200:
 *         description: Empresa actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Company'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Eliminar empresa
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa
 *     responses:
 *       200:
 *         description: Empresa eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Company deleted successfully"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/companies/document/{documentType}/{documentNumber}:
 *   get:
 *     summary: Obtener empresa por tipo y número de documento
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: documentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NIT, CC, CE, RUT]
 *         description: Tipo de documento de la empresa
 *       - in: path
 *         name: documentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de documento de la empresa
 *       - in: query
 *         name: includeRules
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir reglas asociadas a la empresa
 *     responses:
 *       200:
 *         description: Empresa encontrada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Company'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Actualizar empresa por tipo y número de documento
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: documentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NIT, CC, CE, RUT]
 *         description: Tipo de documento de la empresa
 *       - in: path
 *         name: documentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de documento de la empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyInput'
 *     responses:
 *       200:
 *         description: Empresa actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Company'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */


// Función para crear las rutas de compañías
function createCompanyRoutes(companyController) {
  // Endpoint para importar usuario desde API externa usando documento de la compañía y DUD
    /**
     * @swagger
     * /api/companies/import-users/{documentType}/{documentNumber}:
     *   post:
     *     summary: Importar usuarios desde API externa (VERSIÓN PROTEGIDA - REQUIERE JWT)
     *     description: |
     *       **NOTA:** Esta es la versión protegida del endpoint que requiere autenticación JWT.
     *       Para la versión pública sin autenticación, usar el endpoint definido en index.js.
     *       
     *       Importa usuarios desde API externa de módulos y planes para una empresa específica.
     *     tags: [Companies]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: documentType
     *         required: true
     *         schema:
     *           type: string
     *           enum: [NIT, CC, CE, RUT]
     *         description: Tipo de documento de la empresa (usado como NIT para API externa)
     *       - in: path
     *         name: documentNumber
     *         required: true
     *         schema:
     *           type: string
     *         description: Número de documento de la empresa (NIT)
     *     responses:
     *       201:
     *         description: Usuarios importados y creados exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 created:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/User'
     *                 existing:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/User'
     *       404:
     *         description: Empresa no encontrada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    router.post('/import-users/:documentType/:documentNumber', async (req, res, next) => {
      try {
        const { documentType, documentNumber } = req.params;
        const modulesPlansService = require('../../../application/services/ModulosPlanesService');
        const token = await modulesPlansService.getToken(documentType, documentNumber);
        const companies = await modulesPlansService.getCompanyByNit(documentNumber, token);
        if (!Array.isArray(companies) || companies.length === 0) {
          return res.status(404).json({ success: false, message: 'Empresa no encontrada en el API externo', data: null });
        }
        const companyExt = companies[0];
        const companyRepository = req.app.get('companyRepository');
        const companyLocal = await companyRepository.findByDocumentNumber(documentNumber);
        if (!companyLocal) {
          return res.status(404).json({ success: false, message: 'Empresa no encontrada en el sistema local', data: null });
        }
        const userUseCases = req.app.get('userUseCases');
        const created = [];
        const existing = [];
        const errors = [];

        // Helper para limpiar tildes y caracteres especiales
        const cleanName = (str) => {
          if (!str) return '';
          return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
            .replace(/[^a-zA-Z .-]/g, ' ') // Solo letras, espacio, punto, guion
            .replace(/\s+/g, ' ') // Unifica espacios
            .trim();
        };

        for (const userExt of companyExt.usersAssociated || []) {
          try {
            const dud = userExt.userName;

            // Usar findByDUD primero para evitar intentar crear duplicados
            let user = await userUseCases.userRepository.findByDUD(dud);

            if (user) {
              existing.push(user);
            } else {
              // Intentar crear usuario
              const userData = {
                name: cleanName(userExt.Nombres),
                dud: userExt.userName,
                companyId: companyLocal.id,
                isActive: true,
                roles: []
              };

              try {
                const newUser = await userUseCases.createUser(userData);
                created.push(newUser);
              } catch (createError) {
                // Si falla por duplicado, verificar si fue creado por otro proceso concurrente
                if (createError.message && createError.message.includes('DUD already exists')) {
                  const retryUser = await userUseCases.userRepository.findByDUD(dud);
                  if (retryUser) {
                    existing.push(retryUser);
                  } else {
                    throw createError;
                  }
                } else {
                  throw createError;
                }
              }
            }
          } catch (userError) {
            errors.push({
              dud: userExt.userName,
              name: userExt.Nombres,
              error: userError.message
            });
          }
        }

        return res.status(201).json({
          success: errors.length === 0,
          message: `Importación finalizada: ${created.length} usuarios creados, ${existing.length} ya existían${errors.length > 0 ? `, ${errors.length} errores` : ''}`,
          created,
          existing,
          errors: errors.length > 0 ? errors : undefined
        });
      } catch (error) {
        next(error);
      }
    });
  // Rutas básicas CRUD
  router.post('/', (req, res, next) => companyController.create(req, res, next));
  router.get('/', (req, res, next) => companyController.getAll(req, res, next));
  router.get('/active', (req, res, next) => companyController.getActive(req, res, next));
  
  router.get('/:id', (req, res, next) => companyController.getById(req, res, next));
  router.get('/:id/with-rules', (req, res, next) => companyController.getWithRules(req, res, next));
  router.put('/:id', (req, res, next) => companyController.update(req, res, next));
  router.delete('/:id', (req, res, next) => companyController.delete(req, res, next));
  
  // Nueva ruta: buscar por tipo y número de documento
  router.get('/document/:documentType/:documentNumber', (req, res, next) => companyController.getByDocumentTypeAndNumber(req, res, next));
  router.get('/document/:documentType/:documentNumber/with-rules', (req, res, next) => companyController.getByDocumentTypeAndNumberWithRules(req, res, next));
  router.put('/document/:documentType/:documentNumber', (req, res, next) => companyController.updateByDocument(req, res, next));
  
  // Ruta legacy: buscar solo por número de documento (deprecada)
  router.get('/document/:documentNumber', (req, res, next) => companyController.getByDocumentNumber(req, res, next));
  
  
  /**
   * @swagger
   * /api/companies/{id}/with-rules:
   *   get:
   *     summary: Obtener reglas de la empresa por ID con paginación
   *     tags: [Companies]
   *     parameters:
   *       - in: header
   *         name: Authorization
   *         required: true
   *         schema:
   *           type: string
   *         description: Token JWT para autenticación
   *         example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la empresa
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Cantidad de reglas por página
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Offset de paginación
   *     responses:
   *       200:
   *         description: Reglas de la empresa obtenidas exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Rule'
   *                 count:
   *                   type: integer
   *                   description: Cantidad de reglas en la página
   *                 total:
   *                   type: integer
   *                   description: Total de reglas
   *                 limit:
   *                   type: integer
   *                 offset:
   *                   type: integer
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */

  /**
   * @swagger
   * /api/companies/document/{documentType}/{documentNumber}/with-rules:
   *   get:
   *     summary: Obtener empresa por tipo y número de documento con reglas incluidas
   *     tags: [Companies]
   *     parameters:
   *       - in: path
   *         name: documentType
   *         required: true
   *         schema:
   *           type: string
   *           enum: [NIT, CC, CE, RUT]
   *         description: Tipo de documento de la empresa
   *         example: NIT
   *       - in: path
   *         name: documentNumber
   *         required: true
   *         schema:
   *           type: string
   *         description: Número de documento de la empresa
   *         example: "900123456-7"
   *     responses:
   *       200:
   *         description: Empresa encontrada con reglas incluidas
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       allOf:
   *                         - $ref: '#/components/schemas/Company'
   *                         - type: object
   *                           properties:
   *                             rules:
   *                               type: array
   *                               items:
   *                                 $ref: '#/components/schemas/Rule'
   *                               description: Lista de reglas asociadas a la empresa
   *                     includesRules:
   *                       type: boolean
   *                       example: true
   *                       description: Confirma que las reglas están incluidas
   *             examples:
   *               empresa_con_reglas:
   *                 summary: Empresa con reglas
   *                 value:
   *                   success: true
   *                   data:
   *                     id: 4
   *                     name: "Empresa Test"
   *                     description: "Empresa de prueba para testing"
   *                     documentNumber: "900123456-7"
   *                     documentType: "NIT"
   *                     type: "PROVIDER"
   *                     isActive: true
   *                     createdAt: "2025-08-19T15:18:56.984Z"
   *                     rules: [
   *                       {
   *                         id: 1,
   *                         name: "Regla de acceso básico",
   *                         description: "Regla para acceso a recursos básicos",
   *                         type: "AMOUNT",
   *                         minimumAmount: 1000.00,
   *                         maximumAmount: 50000.00,
   *                         nitAssociatedCompany: "900123456-7"
   *                       }
   *                     ]
   *                   includesRules: true
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */

  return router;
}

module.exports = createCompanyRoutes;
