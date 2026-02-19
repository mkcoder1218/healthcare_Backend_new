export type CrudAction = "create" | "read" | "update" | "delete";

export type FieldType =
  | {
      type: "STRING" | "INTEGER" | "BOOLEAN" | "TEXT" | "DATE" | "UUID";
      allowNull?: boolean;
      unique?: boolean;
      default?: any;
    }
  | {
      type: "ENUM";
      allowNull?: boolean;
      default?: any;
      values: string[];
      unique?: boolean;
    }
  | {
      type: "ARRAY";
      allowNull?: boolean;
      of: "STRING" | "INTEGER" | "UUID";
      unique?: boolean;
      default?: any;
    }
  | {
      type: "JSON";
      allowNull?: boolean;
      default?: any;
      unique?: boolean;
    };

export type Relation = {
  type: "hasOne" | "hasMany" | "belongsTo" | "belongsToMany";
  model: string;
  options?: any;
};

export type ModelDefinition = {
  fields: Record<string, FieldType>;
  relations?: Relation[];
  routes: string[];
  auth?: Partial<Record<CrudAction, boolean>>;
};

export const GLOBAL_STATUS = ["Pending", "Idle", "Failed", "Success"] as const;

export type GlobalStatus = (typeof GLOBAL_STATUS)[number];
