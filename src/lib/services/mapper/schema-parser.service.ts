import { Injectable, Inject } from '@angular/core';
import { SCRIBE_SCHEMA_DEF } from '../../config/scribe-engine.config';
import { ScribeSchemaDefinition, ParsedSchema, ParsedSchemaNode, SchemaNodeType, SchemaValidation } from '../../models/schema-definition';

@Injectable({
  providedIn: 'root'
})
export class SchemaParserService {
  private parsedSchemas: Map<string, ParsedSchema> = new Map();
  private schemaList: ScribeSchemaDefinition;

  constructor(@Inject(SCRIBE_SCHEMA_DEF) schemaList: ScribeSchemaDefinition) {
    this.schemaList = schemaList;
    for (const schema of this.schemaList) {
      this.parseSchemas(schema);
    }
  }

  parseSchemas(schemas: Record<string, any>): void {
    for (const [schemaName, schema] of Object.entries(schemas)) {
      const parsedSchema = this.parseSchema(schemaName, schema);
      this.parsedSchemas.set(schemaName, parsedSchema);
    }
  }

  getParsedSchema(schemaName: string): ParsedSchema | undefined {
    return this.parsedSchemas.get(schemaName);
  }

  public parseSchema(schemaName: string, schema: any): ParsedSchema {
    return {
      rootType: schemaName,
      structure: this.parseNode(schema)
    };
  }

  private parseNode(node: any): ParsedSchemaNode {
    if (!node) {
      return {
        type: SchemaNodeType.Object
      };
    }
    
    const parsedNode: ParsedSchemaNode = {
      type: this.determineNodeType(node),
      description: node.description
    };

    if (node.kbTableId) {
      parsedNode.type = SchemaNodeType.KbEntity;
      parsedNode.kbTableId = node.kbTableId;
    }

    if (parsedNode.type === SchemaNodeType.Object && node.properties) {
      parsedNode.properties = {};
      parsedNode.required = node.required || [];
      
      for (const [propName, propSchema] of Object.entries(node.properties)) {
        parsedNode.properties[propName] = this.parseNode(propSchema);
      }
    }

    if (parsedNode.type === SchemaNodeType.Array && node.items) {
      parsedNode.itemType = this.parseNode(node.items);
    }

    if (node.enum) {
      parsedNode.enumValues = node.enum;
    }

    parsedNode.validations = this.parseValidations(node);

    return parsedNode;
  }

  private determineNodeType(node: any): SchemaNodeType {
    if (!node || !node.type) {
      return SchemaNodeType.Object;
    }

    switch (node.type) {
      case 'object':
        return SchemaNodeType.Object;
      case 'array':
        return SchemaNodeType.Array;
      case 'string':
        return SchemaNodeType.String;
      case 'number':
        return SchemaNodeType.Number;
      case 'boolean':
        return SchemaNodeType.Boolean;
      default:
        return SchemaNodeType.Object;
    }
  }

  private parseValidations(node: any): SchemaValidation[] {
    if (!node) {
      return [];
    }
    
    const validations: SchemaValidation[] = [];

    if (node.minimum !== undefined) {
      validations.push({ type: 'minimum', value: node.minimum });
    }
    if (node.maximum !== undefined) {
      validations.push({ type: 'maximum', value: node.maximum });
    }

    return validations;
  }
}
