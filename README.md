# Scribe Engine Library

This library provides a set of services and interfaces for interacting with the Scribe API and processing conversation transcriptions.

## Architecture

The Scribe Engine library is designed with the following architecture:

1. **Configuration**: Uses Angular's dependency injection tokens to provide configurable values:
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
npm install nextech-ai-scribe-sdk
```

## Usage

To use the Scribe Engine in your application:

1. **Implement the ScribeAPIClient** in your application:
Example:
```typescript
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ScribeAPIClient } from 'nextech-ai-scribe-sdk';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})  
export class ApiService implements ScribeAPIClient {
  constructor(private http: HttpClient) {}

  get(url: string, options?: any): Observable<any> {
    url = environment.apiUrl + url;    
    options.headers = options.headers
      .set('api-key', environment.apiKey);
    return this.http.get(url, options);
  }

  post(url: string, body: any, options?: any): Observable<any> {
    url = environment.apiUrl + url;
    options.headers = options.headers
      .set('api-key', environment.apiKey);
    return this.http.post(url, body, options);
  }
}
```

2. **Create schema definition based on your UI models**:

```typescript
export interface yourSchemaDefinition {
  // Define your medical chart properties here
}
```
Note: You can use the schema definition package passing in the file with your UI models to generate the schema definition.

3. **Provide configuration tokens** in your app module:

```typescript
import { SCRIBE_SCHEMA_DEF, SCRIBE_API_CLIENT } from 'nextech-ai-scribe-sdk';

@NgModule({
  providers: [
    { provide: SCRIBE_SCHEMA_DEF, useValue: yourSchemaDefinition },
    { provide: SCRIBE_API_CLIENT, useClass: ApiService }
  ]
})
export class AppModule {}
```

4. **Include Microsoft Azure Cognitive Services Speech SDK scripts** in your project:
```html
  <script src="https://aka.ms/csspeech/jsbrowserpackageraw"></script>
```

5. **Use the scribe service** in your components:
Example:
```typescript
import { ScribeService } from 'nextech-ai-scribe-sdk';

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
import { GenericMappingService } from 'nextech-ai-scribe-sdk';
mappingService.registerMapper({
  canHandle: (node) => node.type === 'custom-type',
  map: (data, node, context) => {
    // Custom mapping logic
    return transformedData;
  }
});
```

2. **Create specialized services** that build on the core services for specific use cases.
