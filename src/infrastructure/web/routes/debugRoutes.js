const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/debug/json-test:
 *   post:
 *     summary: Test JSON parsing (Debug endpoint)
 *     description: Endpoint para probar la validación de JSON
 *     tags: [Debug]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           example:
 *             test: "value"
 *             number: 123
 *     responses:
 *       200:
 *         description: JSON válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 receivedData:
 *                   type: object
 *       400:
 *         description: JSON inválido
 */
router.post('/json-test', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'JSON recibido correctamente',
      receivedData: req.body,
      dataType: typeof req.body,
      keys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/debug/rule-example:
 *   get:
 *     summary: Get rule creation example
 *     description: Obtiene ejemplos de JSON válidos para crear reglas
 *     tags: [Debug]
 *     responses:
 *       200:
 *         description: Ejemplos de reglas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/rule-example', (req, res) => {
  const examples = {
    amountRule: {
      name: "Payment Amount Rule",
      description: "Validation rule for payment amounts between specific limits",
      type: "AMOUNT",
      minimumAmount: 1000.00,
      maximumAmount: 50000.00,
      isActive: true
    },
    companyRule: {
      name: "Company Validation Rule",
      description: "Rule for validating associated companies",
      type: "COMPANY",
      nitAssociatedCompany: "800456789",
      isActive: true
    },
    companyAmountRule: {
      name: "Company-Amount Validation Rule",
      description: "Rule for validating company and amounts",
      type: "COMPANY-AMOUNT",
      minimumAmount: 5000.00,
      maximumAmount: 100000.00,
      nitAssociatedCompany: "900987654",
      isActive: true
    },
    legacyRule: {
      name: "Legacy Security Rule",
      description: "Traditional security rule",
      type: "SECURITY",
      isActive: true
    }
  };

  res.json({
    success: true,
    message: "Ejemplos de reglas válidas",
    examples: examples,
    note: "Usa estos ejemplos como base para crear reglas. Asegúrate de que el JSON esté bien formado."
  });
});

module.exports = router;
