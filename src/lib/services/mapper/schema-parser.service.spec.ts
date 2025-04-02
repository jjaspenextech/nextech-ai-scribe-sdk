import { TestBed } from '@angular/core/testing';
import { SchemaParserService, ParsedSchemaNode, SchemaNodeType } from './schema-parser.service';

describe('SchemaParserService', () => {
  let service: SchemaParserService;
  let testSchemas: Record<string, any>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SchemaParserService]
    });

    service = TestBed.inject(SchemaParserService);

    // Setup test schemas
    testSchemas = {
      'TestSchema': {
        'TestSchema': {
          type: 'object',
          description: 'Test schema root object',
          properties: {
            stringProp: {
              type: 'string',
              description: 'String property'
            },
            numberProp: {
              type: 'number',
              description: 'Number property',
              minimum: 0,
              maximum: 100
            },
            booleanProp: {
              type: 'boolean',
              description: 'Boolean property'
            },
            arrayProp: {
              type: 'array',
              description: 'Array property',
              items: {
                type: 'string',
                description: 'Array item'
              }
            },
            objectProp: {
              type: 'object',
              description: 'Object property',
              properties: {
                nestedProp: {
                  type: 'string',
                  description: 'Nested property'
                }
              },
              required: ['nestedProp']
            },
            enumProp: {
              type: 'string',
              description: 'Enum property',
              enum: ['value1', 'value2', 'value3']
            },
            kbEntityProp: {
              type: 'object',
              description: 'KB Entity property',
              kbTableId: 123
            }
          },
          required: ['stringProp', 'numberProp']
        }
      }
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseSchemas', () => {
    it('should parse multiple schemas', () => {
      const additionalSchema = {
        'AnotherSchema': {
          'AnotherSchema': {
            type: 'object',
            properties: {
              prop: { type: 'string' }
            }
          }
        }
      };

      const combinedSchemas = { ...testSchemas, ...additionalSchema };
      
      service.parseSchemas(combinedSchemas);
      
      const parsedSchema1 = service.getParsedSchema('TestSchema');
      const parsedSchema2 = service.getParsedSchema('AnotherSchema');
      
      expect(parsedSchema1).toBeDefined();
      expect(parsedSchema2).toBeDefined();
      expect(parsedSchema1?.rootType).toBe('TestSchema');
      expect(parsedSchema2?.rootType).toBe('AnotherSchema');
    });
  });

  describe('parseSchema', () => {
    it('should correctly parse a schema', () => {
      const schemaData = testSchemas['TestSchema']['TestSchema'];
      const result = service.parseSchema('TestSchema', schemaData);
      
      expect(result.rootType).toBe('TestSchema');
      expect(result.structure.type).toBe(SchemaNodeType.Object);
      expect(result.structure.description).toBe('Test schema root object');
      expect(result.structure.properties).toBeDefined();
      expect(Object.keys(result.structure.properties!).length).toBe(7);
    });
  });

  describe('node parsing', () => {
    it('should correctly parse string properties', () => {
      service.parseSchemas(testSchemas);
      const schema = service.getParsedSchema('TestSchema');
      
      const stringProp = schema?.structure.properties?.['stringProp'];
      expect(stringProp).toBeDefined();
      expect(stringProp?.type).toBe(SchemaNodeType.String);
      expect(stringProp?.description).toBe('String property');
    });

    it('should correctly parse number properties with validations', () => {
      service.parseSchemas(testSchemas);
      const schema = service.getParsedSchema('TestSchema');
      
      const numberProp = schema?.structure.properties?.['numberProp'];
      expect(numberProp).toBeDefined();
      expect(numberProp?.type).toBe(SchemaNodeType.Number);
      expect(numberProp?.validations).toBeDefined();
      expect(numberProp?.validations?.length).toBe(2);
      
      const minValidation = numberProp?.validations?.find(v => v.type === 'minimum');
      const maxValidation = numberProp?.validations?.find(v => v.type === 'maximum');
      
      expect(minValidation).toBeDefined();
      expect(minValidation?.value).toBe(0);
      expect(maxValidation).toBeDefined();
      expect(maxValidation?.value).toBe(100);
    });

    it('should correctly parse boolean properties', () => {
      service.parseSchemas(testSchemas);
      const schema = service.getParsedSchema('TestSchema');
      
      const booleanProp = schema?.structure.properties?.['booleanProp'];
      expect(booleanProp).toBeDefined();
      expect(booleanProp?.type).toBe(SchemaNodeType.Boolean);
    });

    it('should correctly parse array properties', () => {
      service.parseSchemas(testSchemas);
      const schema = service.getParsedSchema('TestSchema');
      
      const arrayProp = schema?.structure.properties?.['arrayProp'];
      expect(arrayProp).toBeDefined();
      expect(arrayProp?.type).toBe(SchemaNodeType.Array);
      expect(arrayProp?.itemType).toBeDefined();
      expect(arrayProp?.itemType?.type).toBe(SchemaNodeType.String);
    });

    it('should correctly parse object properties with nested properties', () => {
      service.parseSchemas(testSchemas);
      const schema = service.getParsedSchema('TestSchema');
      
      const objectProp = schema?.structure.properties?.['objectProp'];
      expect(objectProp).toBeDefined();
      expect(objectProp?.type).toBe(SchemaNodeType.Object);
      expect(objectProp?.properties).toBeDefined();
      expect(objectProp?.properties?.['nestedProp']).toBeDefined();
      expect(objectProp?.required).toContain('nestedProp');
    });

    it('should correctly parse enum properties', () => {
      service.parseSchemas(testSchemas);
      const schema = service.getParsedSchema('TestSchema');
      
      const enumProp = schema?.structure.properties?.['enumProp'];
      expect(enumProp).toBeDefined();
      expect(enumProp?.type).toBe(SchemaNodeType.String);
      expect(enumProp?.enumValues).toBeDefined();
      expect(enumProp?.enumValues?.length).toBe(3);
      expect(enumProp?.enumValues).toContain('value1');
      expect(enumProp?.enumValues).toContain('value2');
      expect(enumProp?.enumValues).toContain('value3');
    });

    it('should correctly parse KB entity properties', () => {
      service.parseSchemas(testSchemas);
      const schema = service.getParsedSchema('TestSchema');
      
      const kbEntityProp = schema?.structure.properties?.['kbEntityProp'];
      expect(kbEntityProp).toBeDefined();
      expect(kbEntityProp?.type).toBe(SchemaNodeType.KbEntity);
      expect(kbEntityProp?.kbTableId).toBe(123);
    });
  });

  describe('edge cases', () => {
    it('should handle schemas without type', () => {
      const schemaWithoutType = {
        'NoType': {
          'NoType': {
            properties: {
              prop: { type: 'string' }
            }
          }
        }
      };
      
      service.parseSchemas(schemaWithoutType);
      const schema = service.getParsedSchema('NoType');
      
      expect(schema).toBeDefined();
      expect(schema?.structure.type).toBe(SchemaNodeType.Object);
    });

    it('should handle unknown types as object', () => {
      const schemaWithUnknownType = {
        'UnknownType': {
          'UnknownType': {
            type: 'unknown',
            properties: {
              prop: { type: 'string' }
            }
          }
        }
      };
      
      service.parseSchemas(schemaWithUnknownType);
      const schema = service.getParsedSchema('UnknownType');
      
      expect(schema).toBeDefined();
      expect(schema?.structure.type).toBe(SchemaNodeType.Object);
    });
  });
}); 