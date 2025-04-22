// Parsed schema interfaces used by the mapping service
export interface ParsedSchema {
  rootType: string;  // e.g., 'ReasonForVisit', 'Allergies'
  structure: ParsedSchemaNode;
}

export interface ParsedSchemaNode {
  type: SchemaNodeType;
  description?: string;
  properties?: Record<string, ParsedSchemaNode>;  // for objects
  itemType?: ParsedSchemaNode;  // for arrays
  kbTableId?: number;  // for kb entities
  required?: string[];  // required properties for objects
  validations?: SchemaValidation[];
  enumValues?: string[];  // for enums
}

export enum SchemaNodeType {
  Object = 'object',
  Array = 'array',
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  KbEntity = 'kb-entity'
}

export interface SchemaValidation {
  type: string;
  value: any;
}

// The following interfaces define how applications define their schema to the engine
export interface ScribeSchemaProperty {
  type: string; // 'object', 'array', 'string', 'number', 'boolean'
  description?: string;
  properties?: Record<string, ScribeSchemaProperty>; // For type 'object'
  items?: ScribeSchemaProperty; // For type 'array'
  kbTableId?: number; // For KbEntity references
  enum?: string[]; // For enumerated values
  minimum?: number; // Validation for numbers
  maximum?: number; // Validation for numbers
}

export interface ScribeSchemaNode extends ScribeSchemaProperty {
  [key: string]: any; // Top-level section name
}

export interface ScribeSchemaSection {
  [key: string]: ScribeSchemaNode;
}

export type ScribeSchemaDefinition = {[key: string]: ScribeSchemaSection}[]; 