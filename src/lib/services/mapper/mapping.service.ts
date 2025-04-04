import { Injectable, inject } from "@angular/core";
import { ClassificationData, UIItemWithDataReference, KbChoice } from "../../models/classification";
import { ParsedSchemaNode, SchemaNodeType } from "../../models/schema-definition";
import { SchemaParserService } from "./schema-parser.service";

interface EntityMapper<T> {
    canHandle(node: ParsedSchemaNode): boolean;
    map(data: any, node: ParsedSchemaNode, context?: MappingContext): T;
}

// Add a context interface to track KB items during mapping
interface MappingContext {
    dataReferenceItems: Record<string, UIItemWithDataReference>;
    nextKbId: number;
}

@Injectable({
    providedIn: 'root'
})
export class GenericMappingService {
    private entityMappers: EntityMapper<any>[] = [];
    
    constructor(
        private schemaParserService: SchemaParserService
    ) {
        this.registerDefaultMappers();
    }

    private registerDefaultMappers(): void {
        // Register primitive mapper
        this.entityMappers.push({
            canHandle: (node: ParsedSchemaNode) => 
                [SchemaNodeType.String, SchemaNodeType.Number, SchemaNodeType.Boolean].includes(node.type),
            map: (data: any) => data
        });

        function mapKbChoice(data: any) {
            if (data['Profile_KbEntityId']) {
                return KbChoice.ProfileKbValue;
            }
            if (data['Practice_KbEntityId']) {
                return KbChoice.PracticeKbValue;
            }

            return KbChoice.RawValue;
        }

        // Updated KB entity mapper
        this.entityMappers.push({
            canHandle: (node: ParsedSchemaNode) => node.type === SchemaNodeType.KbEntity,
            map: (data: any, node: ParsedSchemaNode, context: MappingContext) => {
                const kbId = `${context.nextKbId++}`;
                
                // Create the KB item
                const kbItem: UIItemWithDataReference = {
                    dataItemId: kbId,
                    selectedKbChoice: mapKbChoice(data),
                    isAccepted: false,
                    rawValue: { label: data['label'] ?? data },
                    profileKbValue: data['Profile_KbEntityId'] ? ({
                        label: data['Profile_DocumentValue'],
                        confidence_score: data['Profile_confidence_score'],
                        documentId: data['Profile_KbEntityId']
                    }) : undefined,
                    practiceKbValue: data['Practice_KbEntityId'] ? ({
                        label: data['Practice_DocumentValue'],
                        confidence_score: data['Practice_confidence_score'],
                        documentId: data['Practice_KbEntityId']
                    }) : undefined,
                };

                // Store the KB item in the context
                context.dataReferenceItems[kbId] = kbItem;

                // Return the reference
                return {
                    dataItemId: kbId,
                    dataTableId: node.kbTableId
                };
            }
        });

        // Register array mapper
        this.entityMappers.push({
            canHandle: (node: ParsedSchemaNode) => node.type === SchemaNodeType.Array,
            map: (data: any[], node: ParsedSchemaNode, context: MappingContext) => {
                if (!Array.isArray(data)) {
                    data = [];
                }
                return data.map(item => this.mapValue(item, node.itemType!, context));
            }
        });

        // Register object mapper
        this.entityMappers.push({
            canHandle: (node: ParsedSchemaNode) => node.type === SchemaNodeType.Object,
            map: (data: any, node: ParsedSchemaNode, context: MappingContext) => {
                const result: any = {};
                if (node.properties) {
                    for (const [key, propNode] of Object.entries(node.properties)) {
                        if (data[key] !== undefined) {
                            result[key] = this.mapValue(data[key], propNode, context);
                        } else if (propNode.type === SchemaNodeType.Array) {
                            result[key] = [];
                        }
                    }
                }
                return result;
            }
        });
    }

    public mapAllData(result: Record<string, any>, existingMedicalChart: ClassificationData): ClassificationData {
        const keys = Object.keys(result);
        const context: MappingContext = {
            dataReferenceItems: { ...existingMedicalChart.dataReferenceItems },
            nextKbId: Object.keys(existingMedicalChart.dataReferenceItems).length
        };
        
        let updatedChart = { 
            sections: { ...existingMedicalChart.sections },
            dataReferenceItems: { ...existingMedicalChart.dataReferenceItems }
         };
        
        for (const key of keys) {
            if (key in updatedChart.sections) {
                updatedChart.sections[key as keyof ClassificationData['sections']] = {
                    ...updatedChart.sections[key as keyof ClassificationData['sections']],
                    ...this.mapData(result[key], key, context)
                };
            }
        }

        // Update the KB items in the chart
        updatedChart.dataReferenceItems = context.dataReferenceItems;

        return updatedChart;
    }

    public mapData<T>(data: any, schemaName: string, context: MappingContext): T {
        const parsedSchema = this.schemaParserService.getParsedSchema(schemaName);
        if (!parsedSchema) {
            throw new Error(`Schema not found: ${schemaName}`);
        }

        if (parsedSchema.structure.type === SchemaNodeType.Array && !Array.isArray(data)) {
            data = [];
        }

        return this.mapValue(data, parsedSchema.structure, context) as T;
    }

    private mapValue(data: any, node: ParsedSchemaNode, context: MappingContext): any {
        const mapper = this.entityMappers.find(m => m.canHandle(node));
        if (!mapper) {
            throw new Error(`No mapper found for node type: ${node.type}`);
        }

        return mapper.map(data, node, context);
    }

    public registerMapper(mapper: EntityMapper<any>): void {
        this.entityMappers.unshift(mapper);
    }
}

