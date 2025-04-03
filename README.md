# Scribe Engine Library

This library provides a set of services and interfaces for interacting with the Scribe API and processing conversation transcriptions.

## Architecture

The Scribe Engine library is designed with the following architecture:

1. **Configuration**: Uses Angular's dependency injection tokens to provide configurable values:
   - `SCRIBE_API_URL`: URL for the Scribe API
   - `SCRIBE_API_KEY`: API Key for authentication
   - `SCRIBE_SCHEMA_DEF`: Schema definition for the medical chart

2. **Services**:
   - `ScribeApiService`: Handles API communication with the Scribe backend
   - `SchemaParserService`: Parses schema definitions into a usable format
   - `GenericMappingService`: Maps API response data to application models

3. **Models**:
   - Schema definitions for medical chart data
   - Request/response interfaces for API communication
   - Chart models for structured data representation

## Installation

```bash
npm install scribe-engine-lib
```

## Usage

To use the Scribe Engine in your application:

1. **Provide configuration tokens** in your app module:

```typescript
import { SCRIBE_API_URL, SCRIBE_API_KEY, SCRIBE_SCHEMA_DEF } from 'scribe-engine-lib';

@NgModule({
  providers: [
    { provide: SCRIBE_API_URL, useValue: 'https://your-api-url.com/api/' },
    { provide: SCRIBE_API_KEY, useValue: 'your-api-key' },
    { provide: SCRIBE_SCHEMA_DEF, useValue: yourSchemaDefinition }
  ]
})
export class AppModule {}
```

2. **Use the services** in your components:

```typescript
import { ScribeApiService, GenericMappingService } from 'scribe-engine-lib';

@Component({...})
export class YourComponent {
  scribeService: ScribeService = inject(ScribeService);
  private destroy$ = new Subject<void>();
  isListening$ = this.scribeService.isListening$;
  recordingDuration$ = this.scribeService.recordingDuration$;
  public medicalChart$ = (this.scribeService.classificationData$ as Observable<MedicalChart>);
  constructor(
  ) {}
  }
}
```

## Schema Definition

The schema definition should follow the structure defined in `ScribeSchemaDefinition` interface:

```typescript
export interface ScribeSchemaNode {
  name: string;
  type: string; // 'object', 'array', 'string', 'number', 'boolean'
  description?: string;
  properties?: Record<string, ScribeSchemaProperty>;
  // ... other properties
}

export type ScribeSchemaDefinition = Record<string, ScribeSchemaNode>;
```

## Extending the Module

To extend functionality:

1. **Register custom mappers** in the `GenericMappingService`:

```typescript
mappingService.registerMapper({
  canHandle: (node) => node.type === 'custom-type',
  map: (data, node, context) => {
    // Custom mapping logic
    return transformedData;
  }
});
```

2. **Create specialized services** that build on the core services for specific use cases.
