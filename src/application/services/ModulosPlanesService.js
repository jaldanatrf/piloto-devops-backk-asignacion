const httpClient = require('../../shared/resilience/httpClient');
const API_MODULOS_PLANES = process.env.API_MODULOS_PLANES;

class ModulesPlansService {
  // Gets the token using concatenated docType and doc
  async getToken(docType, doc) {
    const username = `${docType}${doc}`;
    const url = `${API_MODULOS_PLANES}/JWT/registro`;
    try {
      const response = await httpClient.post(url, { username });
      if (response.data && response.data.esExitoso && response.data.token) {
        return response.data.token;
      }
      throw new Error(response.data?.msg || 'Could not obtain token');
    } catch (error) {
      console.error(`Error in getToken: ${error.message}`);
      throw new Error(`Error obtaining token: ${error.message}`);
    }
  }

  // Queries company by NIT using the obtained token
  async getCompanyByNit(nit, token) {
    const url = `${API_MODULOS_PLANES}/empresas?nit=${encodeURIComponent(nit)}`;
    try {
      const response = await httpClient.get(url, {
        headers: {
          Authorization: token
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error in getCompanyByNit: ${error.message}`);
      throw new Error(`Error querying company: ${error.message}`);
    }
  }
}

module.exports = new ModulesPlansService();
