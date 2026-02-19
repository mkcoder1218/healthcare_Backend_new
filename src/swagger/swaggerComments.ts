/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: Hairsalon API
 *   version: 1.0.0
 *   description: Complete API documentation for Hairsalon
 *
 * tags:
 *   - name: User
 *     description: User management
 *   - name: Role
 *     description: Role management
 *   - name: AccessRule
 *     description: Access rule management with role assignments
 *   - name: Payment
 *     description: AddisPay payment gateway integration
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         role_id:
 *           type: string
 *         point:
 *           type: integer
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role_id
 *         - point
 *
 *     Role:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         access_rules:
 *           type: array
 *           items:
 *             type: string
 *           description: List of access rule IDs assigned to this role
 *       required:
 *         - name
 *         - description
 *
 *     AccessRule:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the permission
 *         description:
 *           type: string
 *           description: Optional description
 *         role_ids:
 *           type: array
 *           description: Role IDs associated with this access rule
 *           items:
 *             type: string
 *       required:
 *         - name
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * paths:
 *   /user:
 *     get:
 *       summary: Get all users
 *       tags: [User]
 *       responses:
 *         200:
 *           description: List of users
 *     post:
 *       summary: Create a new user
 *       tags: [User]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       responses:
 *         201:
 *           description: User created successfully
 *
 *   /user/{id}:
 *     get:
 *       summary: Get a user by ID
 *       tags: [User]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: User fetched successfully
 *     put:
 *       summary: Update a user
 *       tags: [User]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       responses:
 *         200:
 *           description: User updated successfully
 *     delete:
 *       summary: Delete a user
 *       tags: [User]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: User deleted successfully
 *
 *   /role:
 *     get:
 *       summary: Get all roles
 *       tags: [Role]
 *       responses:
 *         200:
 *           description: List of roles
 *     post:
 *       summary: Create a new role
 *       tags: [Role]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       responses:
 *         201:
 *           description: Role created successfully
 *
 *   /role/{id}:
 *     get:
 *       summary: Get a role by ID
 *       tags: [Role]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Role fetched successfully
 *     put:
 *       summary: Update a role
 *       tags: [Role]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       responses:
 *         200:
 *           description: Role updated successfully
 *     delete:
 *       summary: Delete a role
 *       tags: [Role]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Role deleted successfully
 *
 *   /role/bulk-delete:
 *     post:
 *       summary: Bulk delete roles
 *       tags: [Role]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 where:
 *                   type: object
 *                   description: Conditions to match roles for deletion
 *               required:
 *                 - where
 *       responses:
 *         200:
 *           description: Bulk delete executed successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   deletedCount:
 *                     type: integer
 *
 *   /accessrule:
 *     get:
 *       summary: Get all access rules
 *       tags: [AccessRule]
 *       responses:
 *         200:
 *           description: List of access rules
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AccessRule'
 *     post:
 *       summary: Create a new access rule
 *       tags: [AccessRule]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccessRule'
 *       responses:
 *         201:
 *           description: Access rule created successfully
 *
 *   /accessrule/{id}:
 *     get:
 *       summary: Get an access rule by ID
 *       tags: [AccessRule]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Access rule fetched successfully
 *     put:
 *       summary: Update an access rule
 *       tags: [AccessRule]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccessRule'
 *       responses:
 *         200:
 *           description: Access rule updated successfully
 *     delete:
 *       summary: Delete an access rule
 *       tags: [AccessRule]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Access rule deleted successfully
 *
 *   /accessrule/bulk-delete:
 *     post:
 *       summary: Bulk delete access rules
 *       tags: [AccessRule]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 where:
 *                   type: object
 *                   description: Conditions to match access rules for deletion
 *               required:
 *                 - where
 *       responses:
 *         200:
 *           description: Bulk delete executed successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   deletedCount:
 *                     type: integer
 *
 *   /accessrule/my-rules:
 *     get:
 *       summary: Get access rules assigned to the current user
 *       tags: [AccessRule]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: List of access rules user can access
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AccessRule'
 */
