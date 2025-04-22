/**
 * Test data for SchemaParserService tests
 */

// Main test schema with all property types
export const getTestSchemas = (): Record<string, any> => ({
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
});

// Additional schema for multiple schema parsing test
export const getAdditionalSchema = (): Record<string, any> => ({
  'AnotherSchema': {
    'AnotherSchema': {
      type: 'object',
      properties: {
        prop: { type: 'string' }
      }
    }
  }
});

// Schema without type property
export const getSchemaWithoutType = (): Record<string, any> => ({
  'NoType': {
    'NoType': {
      properties: {
        prop: { type: 'string' }
      }
    }
  }
});

// Schema with unknown type
export const getSchemaWithUnknownType = (): Record<string, any> => ({
  'UnknownType': {
    'UnknownType': {
      type: 'unknown',
      properties: {
        prop: { type: 'string' }
      }
    }
  }
}); 