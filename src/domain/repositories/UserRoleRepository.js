/**
 * UserRoleRepository - Repositorio para gestionar la relación N:M entre usuarios y roles
 * Maneja las operaciones de la tabla intermedia user_roles
 */
class UserRoleRepository {
  constructor(database) {
    this.database = database;
  }

  /**
   * Obtener todos los roles de un usuario
   */
  async getUserRoles(userId) {
    const query = `
      SELECT r.id, r.name, r.description, r.isActive, r.createdAt, r.updatedAt,
             ur.assignedAt
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.roleId
      WHERE ur.userId = ? AND r.deletedAt IS NULL
      ORDER BY r.name
    `;

    const roles = await this.database.query(query, [userId]);
    return roles;
  }

  /**
   * Obtener usuarios que tienen un rol específico
   */
  async getUsersByRole(roleId) {
    const query = `
      SELECT u.id, u.name, u.email, u.document_number, u.document_Type
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_Id
      WHERE ur.role_Id = ? 
      ORDER BY u.name
    `;

    const users = await this.database.query(query, [roleId]);
    return users;
  }

  /**
   * Verificar si un usuario tiene un rol específico
   */
  async hasUserRole(userId, roleId) {
    const query = `
      SELECT COUNT(*) as count
      FROM user_roles ur
      INNER JOIN roles r ON ur.roleId = r.id
      WHERE ur.userId = ? AND ur.roleId = ? 
        AND r.deletedAt IS NULL
    `;

    const result = await this.database.query(query, [userId, roleId]);
    return result[0].count > 0;
  }

  /**
   * Asignar un rol a un usuario
   */
  async assignRole(userId, roleId) {
    const assignedAt = new Date().toISOString();

    const query = `
      INSERT INTO user_roles (userId, roleId, assignedAt)
      VALUES (?, ?, ?)
    `;

    const result = await this.database.query(query, [userId, roleId, assignedAt]);

    return {
      userId,
      roleId,
      assignedAt,
      id: result.insertId
    };
  }

  /**
   * Quitar un rol de un usuario
   */
  async removeRole(userId, roleId) {
    const query = `
      DELETE FROM user_roles
      WHERE userId = ? AND roleId = ?
    `;

    const result = await this.database.query(query, [userId, roleId]);
    return result.affectedRows > 0;
  }

  /**
   * Obtener estadísticas de asignación de roles
   */
  async getRoleAssignmentStats() {
    const query = `
      SELECT 
        r.id,
        r.name,
        r.description,
        COUNT(ur.userId) as userCount,
        r.isActive
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.roleId
      WHERE r.deletedAt IS NULL
      GROUP BY r.id, r.name, r.description, r.isActive
      ORDER BY userCount DESC, r.name
    `;

    const stats = await this.database.query(query);
    return stats;
  }

  /**
   * Obtener usuarios sin roles asignados
   */
  async getUsersWithoutRoles() {
    const query = `
      SELECT u.id, u.name, u.email, u.documentNumber, u.documentType
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      WHERE ur.userId IS NULL AND u.deletedAt IS NULL
      ORDER BY u.name
    `;

    const users = await this.database.query(query);
    return users;
  }

  /**
   * Obtener roles no asignados (sin usuarios)
   */
  async getUnassignedRoles() {
    const query = `
      SELECT r.id, r.name, r.description, r.isActive
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.roleId
      WHERE ur.roleId IS NULL AND r.deletedAt IS NULL AND r.isActive = true
      ORDER BY r.name
    `;

    const roles = await this.database.query(query);
    return roles;
  }

  /**
   * Contar roles de un usuario
   */
  async countUserRoles(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM user_roles ur
      INNER JOIN roles r ON ur.roleId = r.id
      WHERE ur.userId = ? AND r.deletedAt IS NULL
    `;

    const result = await this.database.query(query, [userId]);
    return result[0].count;
  }

  /**
   * Contar usuarios de un rol
   */
  async countRoleUsers(roleId) {
    const query = `
      SELECT COUNT(*) as count
      FROM user_roles ur
      INNER JOIN users u ON ur.userId = u.id
      WHERE ur.roleId = ? AND u.deletedAt IS NULL
    `;

    const result = await this.database.query(query, [roleId]);
    return result[0].count;
  }

  /**
   * Obtener historial de asignaciones de un usuario
   */
  async getUserRoleHistory(userId) {
    // Nota: Esto requeriría una tabla de auditoría para un historial completo
    // Por ahora retornamos las asignaciones actuales con fecha
    const query = `
      SELECT r.id, r.name, r.description, ur.assignedAt,
             'ASSIGNED' as action
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.roleId
      WHERE ur.userId = ? AND r.deletedAt IS NULL
      ORDER BY ur.assignedAt DESC
    `;

    const history = await this.database.query(query, [userId]);
    return history;
  }

  /**
   * Buscar asignaciones por criterios
   */
  async searchAssignments(filters = {}) {
    let query = `
      SELECT 
        u.id as userId,
        u.name as userName,
        u.email as userEmail,
        r.id as roleId,
        r.name as roleName,
        r.description as roleDescription,
        ur.assignedAt
      FROM user_roles ur
      INNER JOIN users u ON ur.userId = u.id
      INNER JOIN roles r ON ur.roleId = r.id
      WHERE u.deletedAt IS NULL AND r.deletedAt IS NULL
    `;

    const params = [];

    if (filters.userId) {
      query += ' AND u.id = ?';
      params.push(filters.userId);
    }

    if (filters.roleId) {
      query += ' AND r.id = ?';
      params.push(filters.roleId);
    }

    if (filters.userName) {
      query += ' AND u.name LIKE ?';
      params.push(`%${filters.userName}%`);
    }

    if (filters.roleName) {
      query += ' AND r.name LIKE ?';
      params.push(`%${filters.roleName}%`);
    }

    if (filters.isActive !== undefined) {
      query += ' AND r.isActive = ?';
      params.push(filters.isActive);
    }

    query += ' ORDER BY ur.assignedAt DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const assignments = await this.database.query(query, params);
    return assignments;
  }

  /**
   * Verificar integridad de las asignaciones
   */
  async checkIntegrity() {
    const issues = [];

    // Verificar asignaciones con usuarios inexistentes
    const orphanUserRoles = await this.database.query(`
      SELECT ur.*, 'ORPHAN_USER' as issue
      FROM user_roles ur
      LEFT JOIN users u ON ur.userId = u.id
      WHERE u.id IS NULL OR u.deletedAt IS NOT NULL
    `);

    issues.push(...orphanUserRoles);

    // Verificar asignaciones con roles inexistentes
    const orphanRoleAssignments = await this.database.query(`
      SELECT ur.*, 'ORPHAN_ROLE' as issue
      FROM user_roles ur
      LEFT JOIN roles r ON ur.roleId = r.id
      WHERE r.id IS NULL OR r.deletedAt IS NOT NULL
    `);

    issues.push(...orphanRoleAssignments);

    return issues;
  }

  /**
   * Limpiar asignaciones huérfanas
   */
  async cleanOrphanAssignments() {
    // Eliminar asignaciones con usuarios inexistentes o eliminados
    const cleanUsersQuery = `
      DELETE ur FROM user_roles ur
      LEFT JOIN users u ON ur.userId = u.id
      WHERE u.id IS NULL OR u.deletedAt IS NOT NULL
    `;

    const usersResult = await this.database.query(cleanUsersQuery);

    // Eliminar asignaciones con roles inexistentes o eliminados
    const cleanRolesQuery = `
      DELETE ur FROM user_roles ur
      LEFT JOIN roles r ON ur.roleId = r.id
      WHERE r.id IS NULL OR r.deletedAt IS NOT NULL
    `;

    const rolesResult = await this.database.query(cleanRolesQuery);

    return {
      orphanUserAssignments: usersResult.affectedRows,
      orphanRoleAssignments: rolesResult.affectedRows,
      totalCleaned: usersResult.affectedRows + rolesResult.affectedRows
    };
  }
}

module.exports = UserRoleRepository;
