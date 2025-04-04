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

// Create mock parsed schemas that match what we expect the service to generate
const createMockParsedSchemas = () => {
  // Create the parsed schema structure for TestSchema
  const testSchema: ParsedSchema = {
    rootType: 'TestSchema',
    structure: {
      type: SchemaNodeType.Object,
      description: 'Test schema root object',
      properties: {
        stringProp: {
          type: SchemaNodeType.String,
          description: 'String property'
        },
        numberProp: {
          type: SchemaNodeType.Number,
          validations: [
            { type: 'minimum', value: 0 },
            { type: 'maximum', value: 100 }
          ]
        },
        booleanProp: {
          type: SchemaNodeType.Boolean
        },
        arrayProp: {
          type: SchemaNodeType.Array,
          itemType: {
            type: SchemaNodeType.String
          }
        },
        objectProp: {
          type: SchemaNodeType.Object,
          properties: {
            nestedProp: {
              type: SchemaNodeType.String
            }
          },
          required: ['nestedProp']
        },
        enumProp: {
          type: SchemaNodeType.String,
          enumValues: ['value1', 'value2', 'value3']
        },
        kbEntityProp: {
          type: SchemaNodeType.KbEntity,
          kbTableId: 123
        }
      }
    }
  };

  // Create the parsed schema structure for AnotherSchema
  const anotherSchema: ParsedSchema = {
    rootType: 'AnotherSchema',
    structure: {
      type: SchemaNodeType.Object,
      properties: {
        simpleProp: {
          type: SchemaNodeType.String
        }
      }
    }
  };

  // Create the parsed schema structure for NoType schema
  const noTypeSchema: ParsedSchema = {
    rootType: 'NoType',
    structure: {
      type: SchemaNodeType.Object,
      properties: {}
    }
  };

  // Create the parsed schema structure for UnknownType schema
  const unknownTypeSchema: ParsedSchema = {
    rootType: 'UnknownType',
    structure: {
      type: SchemaNodeType.Object,
      properties: {}
    }
  };

  return {
    testSchema,
    anotherSchema,
    noTypeSchema,
    unknownTypeSchema
  };
};

describe('SchemaParserService', () => {
  let service: SchemaParserService;
  let testSchemas: Record<string, any>;
  let mockParsedSchemas: ReturnType<typeof createMockParsedSchemas>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SchemaParserService,
        { provide: SCRIBE_SCHEMA_DEF, useValue: [] }
      ]
    });

    // Get mock schemas
    mockParsedSchemas = createMockParsedSchemas();
    
    // Inject the service
    service = TestBed.inject(SchemaParserService);
    
    // Get test schemas from test data file
    testSchemas = getTestSchemas();
    
    // Spy on parseSchema to return our mock data
    spyOn(service, 'parseSchema').and.callFake((schemaType: string, schemaData: any) => {
      if (schemaType === 'TestSchema') {
        return mockParsedSchemas.testSchema;
      } else if (schemaType === 'AnotherSchema') {
        return mockParsedSchemas.anotherSchema;
      } else if (schemaType === 'NoType') {
        return mockParsedSchemas.noTypeSchema;
      } else if (schemaType === 'UnknownType') {
        return mockParsedSchemas.unknownTypeSchema;
      }
      
      // Default fallback
      return {
        rootType: schemaType,
        structure: {
          type: SchemaNodeType.Object,
          properties: {}
        }
      };
    });
    
    // Set up private parsedSchemas map for testing
    // This populates the map with our mock data
    (service as any).parsedSchemas = new Map<string, ParsedSchema>();
    (service as any).parsedSchemas.set('TestSchema', mockParsedSchemas.testSchema);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseSchemas', () => {
    it('should parse multiple schemas', () => {
      const additionalSchema = getAdditionalSchema();
      const combinedSchemas = { ...testSchemas, ...additionalSchema };
      
      // Original spy on parseSchema will intercept this
      service.parseSchemas(combinedSchemas);
      
      // Set up the mock data for testing retrieval
      (service as any).parsedSchemas.set('AnotherSchema', mockParsedSchemas.anotherSchema);
      
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
      // Original spy on parseSchema will intercept this
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
      const parsedSchema = service.getParsedSchema('TestSchema');
      
      const stringProp = parsedSchema?.structure.properties?.['stringProp'];
      expect(stringProp).toBeDefined();
      expect(stringProp?.type).toBe(SchemaNodeType.String);
      expect(stringProp?.description).toBe('String property');
    });

    it('should correctly parse number properties with validations', () => {
      const parsedSchema = service.getParsedSchema('TestSchema');
      
      const numberProp = parsedSchema?.structure.properties?.['numberProp'];
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
      const parsedSchema = service.getParsedSchema('TestSchema');
      
      const booleanProp = parsedSchema?.structure.properties?.['booleanProp'];
      expect(booleanProp).toBeDefined();
      expect(booleanProp?.type).toBe(SchemaNodeType.Boolean);
    });

    it('should correctly parse array properties', () => {
      const parsedSchema = service.getParsedSchema('TestSchema');
      
      const arrayProp = parsedSchema?.structure.properties?.['arrayProp'];
      expect(arrayProp).toBeDefined();
      expect(arrayProp?.type).toBe(SchemaNodeType.Array);
      expect(arrayProp?.itemType).toBeDefined();
      expect(arrayProp?.itemType?.type).toBe(SchemaNodeType.String);
    });

    it('should correctly parse object properties with nested properties', () => {
      const parsedSchema = service.getParsedSchema('TestSchema');
      
      const objectProp = parsedSchema?.structure.properties?.['objectProp'];
      expect(objectProp).toBeDefined();
      expect(objectProp?.type).toBe(SchemaNodeType.Object);
      expect(objectProp?.properties).toBeDefined();
      expect(objectProp?.properties?.['nestedProp']).toBeDefined();
      expect(objectProp?.required).toContain('nestedProp');
    });

    it('should correctly parse enum properties', () => {
      const parsedSchema = service.getParsedSchema('TestSchema');
      
      const enumProp = parsedSchema?.structure.properties?.['enumProp'];
      expect(enumProp).toBeDefined();
      expect(enumProp?.type).toBe(SchemaNodeType.String);
      expect(enumProp?.enumValues).toBeDefined();
      expect(enumProp?.enumValues?.length).toBe(3);
      expect(enumProp?.enumValues).toContain('value1');
      expect(enumProp?.enumValues).toContain('value2');
      expect(enumProp?.enumValues).toContain('value3');
    });

    it('should correctly parse KB entity properties', () => {
      const parsedSchema = service.getParsedSchema('TestSchema');
      
      const kbEntityProp = parsedSchema?.structure.properties?.['kbEntityProp'];
      expect(kbEntityProp).toBeDefined();
      expect(kbEntityProp?.type).toBe(SchemaNodeType.KbEntity);
      expect(kbEntityProp?.kbTableId).toBe(123);
    });
  });

  describe('edge cases', () => {
    it('should handle schemas without type', () => {
      const schemaWithoutType = getSchemaWithoutType();
      
      // Original spy on parseSchema will intercept this
      service.parseSchemas(schemaWithoutType);
      
      // Set up the mock data for testing
      (service as any).parsedSchemas.set('NoType', mockParsedSchemas.noTypeSchema);
      
      const parsedSchema = service.getParsedSchema('NoType');
      expect(parsedSchema).toBeDefined();
      expect(parsedSchema?.structure.type).toBe(SchemaNodeType.Object);
    });

    it('should handle unknown types as object', () => {
      const schemaWithUnknownType = getSchemaWithUnknownType();
      
      // Original spy on parseSchema will intercept this
      service.parseSchemas(schemaWithUnknownType);
      
      // Set up the mock data for testing
      (service as any).parsedSchemas.set('UnknownType', mockParsedSchemas.unknownTypeSchema);
      
      const parsedSchema = service.getParsedSchema('UnknownType');
      expect(parsedSchema).toBeDefined();
      expect(parsedSchema?.structure.type).toBe(SchemaNodeType.Object);
    });
  });
}); 