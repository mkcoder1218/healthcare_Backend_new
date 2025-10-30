export interface UserAttributes {
  id: string;
  role: string;
  role_id: string;
  email?: string;
  name?: string;
  // add any other user fields
}

export interface UserInstance extends UserAttributes {
  // If you need Sequelize methods like save, update, etc.
  save: () => Promise<this>;
  update: (values: Partial<UserAttributes>) => Promise<this>;
  destroy: () => Promise<void>;
}
