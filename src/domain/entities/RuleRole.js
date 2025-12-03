class RuleRole {
    constructor(id, ruleId, roleId, createdAt) {
        this.id = id;
        this.ruleId = ruleId;
        this.roleId = roleId;
        this.createdAt = createdAt || new Date();

        this.validate();
    }

    validate() {
        if (!this.ruleId) {
            throw new Error('Rule ID is required');
        }

        if (!this.roleId) {
            throw new Error('Role ID is required');
        }
    }

    // Método para obtener información básica de la relación
    getBasicInfo() {
        return {
            id: this.id,
            ruleId: this.ruleId,
            roleId: this.roleId,
            createdAt: this.createdAt
        };
    }
}

module.exports = RuleRole;
