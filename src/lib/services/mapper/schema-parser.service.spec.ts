import { TestBed } from '@angular/core/testing';
import { SchemaParserService } from './schema-parser.service';
import { SchemaNodeType, ParsedSchema, ParsedSchemaNode } from '../../models/schema-definition';
import { SCRIBE_SCHEMA_DEF } from '../../config/scribe-engine.config';
import { 
  getTestSchemas, 
  getAdditionalSchema, 
  getSchemaWithoutType, 
  getSchemaWithUnknownType 
} from './schema-parser-test.data';

describe('SchemaParserService', () => {
  let service: SchemaParserService;
  let testSchemas: Record<string, any>;

  beforeEach(() => {
    // Get test schemas from test data file
    testSchemas = getTestSchemas();

    TestBed.configureTestingModule({
      providers: [
        SchemaParserService,
        { provide: SCRIBE_SCHEMA_DEF, useValue: [] }
      ]
    });
    
    // Inject the service
    service = TestBed.inject(SchemaParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    it('should parse schemas provided in the constructor', () => {
      // Create a new service with schemas in the constructor
      const localService = new SchemaParserService([testSchemas]);
      
      // Check that schemas were parsed and stored
      const parsedSchema = localService.getParsedSchema('TestSchema');
      expect(parsedSchema).toBeDefined();
      expect(parsedSchema?.rootType).toBe('TestSchema');
    });
  });

  describe('parseSchemas', () => {
    it('should parse multiple schemas', () => {
      // Parse test schemas
      service.parseSchemas(testSchemas['TestSchema']);
      
      // Parse additional schemas
      const additionalSchema = getAdditionalSchema();
      service.parseSchemas(additionalSchema['AnotherSchema']);
      
      // Test getParsedSchema method
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
      expect(result.structure.required).toContain('stringProp');
      expect(result.structure.required).toContain('numberProp');
    });
  });

  describe('parseNode', () => {
    it('should handle null or undefined nodes', () => {
      // Call the private method via any typecasting
      const result = (service as any).parseNode(null);
      expect(result.type).toBe(SchemaNodeType.Object);
    });

    it('should correctly parse string properties', () => {
      const stringNode = {
        type: 'string',
        description: 'String property'
      };
      
      const result = (service as any).parseNode(stringNode);
      
      expect(result.type).toBe(SchemaNodeType.String);
      expect(result.description).toBe('String property');
    });

    it('should correctly parse number properties with validations', () => {
      const numberNode = {
        type: 'number',
        description: 'Number property',
        minimum: 0,
        maximum: 100
      };
      
      const result = (service as any).parseNode(numberNode);
      
      expect(result.type).toBe(SchemaNodeType.Number);
      expect(result.description).toBe('Number property');
      expect(result.validations).toBeDefined();
      expect(result.validations.length).toBe(2);
      
      const minValidation = result.validations.find(v => v.type === 'minimum');
      const maxValidation = result.validations.find(v => v.type === 'maximum');
      
      expect(minValidation).toBeDefined();
      expect(minValidation?.value).toBe(0);
      expect(maxValidation).toBeDefined();
      expect(maxValidation?.value).toBe(100);
    });

    it('should correctly parse boolean properties', () => {
      const booleanNode = {
        type: 'boolean',
        description: 'Boolean property'
      };
      
      const result = (service as any).parseNode(booleanNode);
      
      expect(result.type).toBe(SchemaNodeType.Boolean);
      expect(result.description).toBe('Boolean property');
    });

    it('should correctly parse array properties', () => {
      const arrayNode = {
        type: 'array',
        description: 'Array property',
        items: {
          type: 'string',
          description: 'Array item'
        }
      };
      
      const result = (service as any).parseNode(arrayNode);
      
      expect(result.type).toBe(SchemaNodeType.Array);
      expect(result.description).toBe('Array property');
      expect(result.itemType).toBeDefined();
      expect(result.itemType?.type).toBe(SchemaNodeType.String);
      expect(result.itemType?.description).toBe('Array item');
    });

    it('should correctly parse object properties with nested properties', () => {
      const objectNode = {
        type: 'object',
        description: 'Object property',
        properties: {
          nestedProp: {
            type: 'string',
            description: 'Nested property'
          }
        },
        required: ['nestedProp']
      };
      
      const result = (service as any).parseNode(objectNode);
      
      expect(result.type).toBe(SchemaNodeType.Object);
      expect(result.description).toBe('Object property');
      expect(result.properties).toBeDefined();
      expect(result.properties?.['nestedProp']).toBeDefined();
      expect(result.properties?.['nestedProp']?.type).toBe(SchemaNodeType.String);
      expect(result.required).toContain('nestedProp');
    });

    it('should correctly parse enum properties', () => {
      const enumNode = {
        type: 'string',
        description: 'Enum property',
        enum: ['value1', 'value2', 'value3']
      };
      
      const result = (service as any).parseNode(enumNode);
      
      expect(result.type).toBe(SchemaNodeType.String);
      expect(result.description).toBe('Enum property');
      expect(result.enumValues).toBeDefined();
      expect(result.enumValues?.length).toBe(3);
      expect(result.enumValues).toContain('value1');
      expect(result.enumValues).toContain('value2');
      expect(result.enumValues).toContain('value3');
    });

    it('should correctly parse KB entity properties', () => {
      const kbEntityNode = {
        type: 'object',
        description: 'KB Entity property',
        kbTableId: 123
      };
      
      const result = (service as any).parseNode(kbEntityNode);
      
      expect(result.type).toBe(SchemaNodeType.KbEntity);
      expect(result.description).toBe('KB Entity property');
      expect(result.kbTableId).toBe(123);
    });
  });

  describe('determineNodeType', () => {
    it('should return Object type for null or undefined nodes', () => {
      const result = (service as any).determineNodeType(null);
      expect(result).toBe(SchemaNodeType.Object);
    });

    it('should return Object type for nodes without type', () => {
      const result = (service as any).determineNodeType({});
      expect(result).toBe(SchemaNodeType.Object);
    });

    it('should return correct type for each possible type', () => {
      expect((service as any).determineNodeType({ type: 'object' })).toBe(SchemaNodeType.Object);
      expect((service as any).determineNodeType({ type: 'array' })).toBe(SchemaNodeType.Array);
      expect((service as any).determineNodeType({ type: 'string' })).toBe(SchemaNodeType.String);
      expect((service as any).determineNodeType({ type: 'number' })).toBe(SchemaNodeType.Number);
      expect((service as any).determineNodeType({ type: 'boolean' })).toBe(SchemaNodeType.Boolean);
    });

    it('should return Object type for unknown types', () => {
      const result = (service as any).determineNodeType({ type: 'unknown' });
      expect(result).toBe(SchemaNodeType.Object);
    });
  });

  describe('parseValidations', () => {
    it('should return empty array for null or undefined nodes', () => {
      const result = (service as any).parseValidations(null);
      expect(result).toEqual([]);
    });

    it('should parse minimum and maximum validations', () => {
      const node = { 
        minimum: 0,
        maximum: 100
      };
      
      const result = (service as any).parseValidations(node);
      
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ type: 'minimum', value: 0 });
      expect(result[1]).toEqual({ type: 'maximum', value: 100 });
    });

    it('should handle nodes without validations', () => {
      const result = (service as any).parseValidations({});
      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle schemas without type', () => {
      const schemaWithoutType = getSchemaWithoutType();
      const schemaData = schemaWithoutType['NoType']['NoType'];
      
      const result = service.parseSchema('NoType', schemaData);
      
      expect(result.rootType).toBe('NoType');
      expect(result.structure.type).toBe(SchemaNodeType.Object);
    });

    it('should handle unknown types as object', () => {
      const schemaWithUnknownType = getSchemaWithUnknownType();
      const schemaData = schemaWithUnknownType['UnknownType']['UnknownType'];
      
      const result = service.parseSchema('UnknownType', schemaData);
      
      expect(result.rootType).toBe('UnknownType');
      expect(result.structure.type).toBe(SchemaNodeType.Object);
    });
  });
}); 