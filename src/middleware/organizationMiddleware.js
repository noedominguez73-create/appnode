/**
 * Organization Context Middleware
 * Extracts organization_id from authenticated user token
 */

const { User } = require('../models');

/**
 * Get organization ID from request
 * Extracts from JWT token or user record
 */
async function getOrganizationId(req) {
    // Super admin can access all orgs (return null = no filter)
    if (req.user && req.user.role === 'super_admin') {
        return null;
    }

    // Try to get from JWT payload first
    if (req.user && req.user.organization_id) {
        return req.user.organization_id;
    }

    // Fallback: Query user record
    if (req.user && req.user.user_id) {
        const user = await User.findByPk(req.user.user_id);
        if (user && user.organization_id) {
            return user.organization_id;
        }
    }

    // Default: Demo Salon (org 1) for backward compatibility
    return 1;
}

/**
 * Middleware to inject organization_id into req object
 */
async function injectOrganizationId(req, res, next) {
    try {
        req.organizationId = await getOrganizationId(req);
        next();
    } catch (error) {
        console.error('Error injecting organization_id:', error);
        req.organizationId = 1; // Fallback
        next();
    }
}

module.exports = {
    getOrganizationId,
    injectOrganizationId
};
