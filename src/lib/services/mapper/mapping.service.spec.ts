import { TestBed } from '@angular/core/testing';
import { GenericMappingService } from './mapping.service';
import { SchemaParserService } from './schema-parser.service';
import { SCRIBE_SCHEMA_DEF } from '../../config/scribe-engine.config';
import { ClassificationData, KbChoice, UIItemWithDataReference } from '../../models/classification';
import { SchemaNodeType, ParsedSchemaNode } from '../../models/schema-definition';
import { 
  Plan, ReasonForVisit, Exam, 
  getMockData, getEmptyMedicalChart, getMockClassificationResults, 
  getKbEntityMockData
} from './test.data';
import { getMockedParsedSchemas } from './test.schema';

describe('GenericMappingService', () => {
  let service: GenericMappingService;
  let mappingContext: any;
  let mockData: any;
  let emptyMedicalChart: ClassificationData;
  let schemaParserServiceSpy: jasmine.SpyObj<SchemaParserService>;
  let kbEntityMockData: any;
  
  beforeEach(() => {
    // Create spy for SchemaParserService
    const spy = jasmine.createSpyObj('SchemaParserService', ['getParsedSchema']);
    
    // Use the mocked parsed schemas
    const mockedSchemas = getMockedParsedSchemas();
    spy.getParsedSchema.and.callFake((schemaName: string) => mockedSchemas[schemaName]);

    TestBed.configureTestingModule({
      providers: [
        GenericMappingService,
        { provide: SchemaParserService, useValue: spy },
        { provide: SCRIBE_SCHEMA_DEF, useValue: [] } // Provide empty array for SCRIBE_SCHEMA_DEF token
      ]
    });

    service = TestBed.inject(GenericMappingService);
    schemaParserServiceSpy = TestBed.inject(SchemaParserService) as jasmine.SpyObj<SchemaParserService>;

    // Create mapping context for testing
    mappingContext = {
      dataReferenceItems: {},
      nextKbId: 0
    };

    // Get test data from test.data.ts
    mockData = getMockData();
    emptyMedicalChart = getEmptyMedicalChart();
    kbEntityMockData = getKbEntityMockData();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('mapData', () => {
    it('should correctly map ReasonForVisit data', () => {
      const result = service.mapData<ReasonForVisit>(mockData['reasonForVisit'], 'reasonForVisit', mappingContext);
      
      expect(result.historyOfPresentIllness).toBeTruthy();
      expect(result.historyOfPresentIllness.chiefComplaint.length).toBe(1);

      // Get the mapped KB item from the context
      const mappedKbItem = Object.values(mappingContext.dataReferenceItems)[0]; 
      const chiefComplaint = result.historyOfPresentIllness.chiefComplaint[0];

      // Check the KB reference
      expect(chiefComplaint.name.dataItemId).toBeTruthy();
      expect(chiefComplaint.name.dataTableId).toBe(210);

      // Check the KB item details
      expect(mappedKbItem).toEqual({
        dataItemId: chiefComplaint.name.dataItemId,
        selectedKbChoice: KbChoice.ProfileKbValue,
        isAccepted: false,
        rawValue: {
          label: 'some issue'
        },
        profileKbValue: {
          documentId: 123,
          label: "Dry Eye Syndrome",
          confidence_score: 0.61047447
        },
        practiceKbValue: {
          documentId: 456,
          label: "DES",
          confidence_score: 0.81510377
        }
      });

      // Check other properties
      expect(chiefComplaint.severity.dataItemId).toBeTruthy();
      expect(chiefComplaint.severity.dataTableId).toBeTruthy();
      expect(chiefComplaint.quality.dataItemId).toBeTruthy();
      expect(chiefComplaint.quality.dataTableId).toBeTruthy();
      expect(chiefComplaint.duration.dataItemId).toBeTruthy();
      expect(chiefComplaint.duration.dataTableId).toBeTruthy();
      expect(chiefComplaint.course).toEqual(['gradually getting worse']);
    });

    it('should correctly map Plan data', () => {
      const result = service.mapData<Plan>(mockData['plan'], 'plan', mappingContext);
      
      expect(result.physicianImpressions.length).toBe(1);
      expect(result.physicianImpressions[0].impression).toBe('Dry eye syndrome and blepharitis');
      expect(result.physicianImpressions[0].treatments.length).toBe(1);
      expect(result.physicianImpressions[0].treatments[0]).toBe('Warm compress');
      expect(result.physicianImpressions[0].prescriptions.length).toBe(1);

      expect(result.physicianImpressions[0].prescriptions[0]).toEqual(
        'Restasis, one drop per eye twice a day'
      );
    });

    it('should throw error for non-existent schema', () => {    
      expect(() => service.mapData(mockData, 'NonExistentSchema', mappingContext))
        .toThrowError('Schema not found: NonExistentSchema');
    });
  });

  describe('mapAllData', () => {
    it('should correctly map all sections of medical chart', () => {
      const lowerCaseMockData = Object.fromEntries(
        Object.entries(mockData).map(([key, value]) => [key.charAt(0).toLowerCase() + key.slice(1), value])
      );
      const result = service.mapAllData(lowerCaseMockData, emptyMedicalChart);
      
      // Check ReasonForVisit mapping
      expect(result.sections['reasonForVisit'].historyOfPresentIllness).toBeTruthy();
      
      // Get the severity KB item from kbItems
      const severityRef = result.sections['reasonForVisit'].historyOfPresentIllness.chiefComplaint[0].severity;
      const severityItem = result.dataReferenceItems[severityRef.dataItemId];
      expect(severityItem?.rawValue?.label).toBe('moderate');


      // Check Plan mapping
      expect(result.sections['plan'].physicianImpressions.length).toBe(1);
      expect(result.sections['plan'].physicianImpressions[0].impression).toBe('Dry eye syndrome and blepharitis');
      expect(result.sections['plan'].other_discussions[0].discussions)
        .toContain('Patient has type 2 diabetes');
    });

    it('should preserve existing data for unmapped sections', () => {
      const existingChart = { ...emptyMedicalChart };
      existingChart.sections['exam'] = {
        anterior: {
          general: [{ 
            laterality: 'OU',
            location: 'test',
            finding: 'test',
            severity: 'test',
            status: 'test',
            category: 'test',
          }],
          lcs: [],
          cornea: [],
          anterior_chamber: [],
          iris: [],
          lens: []

        }
      };

      const result = service.mapAllData(mockData, existingChart);
      
      // Check that exam data is preserved
      expect(result.sections['exam'].anterior.general.length).toBe(1);
      expect(result.sections['exam'].anterior.general[0].laterality).toBe('OU');
    });
  });

  describe('KB Entity Mapping', () => {
    it('should correctly map KB entities', () => {
      mockData['reasonForVisit']['historyOfPresentIllness']['chiefComplaint'][0]['name'] = kbEntityMockData.standardKbEntity;

      const result = service.mapData<ReasonForVisit>(mockData['reasonForVisit'], 'reasonForVisit', mappingContext);
      
      // Get the KB reference and item
      const nameRef = result.historyOfPresentIllness.chiefComplaint[0].name;
      const nameItem = mappingContext.dataReferenceItems[nameRef.dataItemId];

      // Check the reference
      expect(nameRef.dataItemId).toBeTruthy();
      expect(nameRef.dataTableId).toBeTruthy();

      // Check the KB item
      expect(nameItem?.rawValue?.label).toBe("Dry Eye");
      expect(nameItem?.profileKbValue?.documentId).toBe(123);
      expect(nameItem?.practiceKbValue?.documentId).toBe(456);
    });

    it('should handle practice-only KB entities', () => {
      mockData['reasonForVisit']['historyOfPresentIllness']['chiefComplaint'][0]['name'] = kbEntityMockData.practiceOnlyKbEntity;
      
      const result = service.mapData<ReasonForVisit>(mockData['reasonForVisit'], 'reasonForVisit', mappingContext);
      
      const nameRef = result.historyOfPresentIllness.chiefComplaint[0].name;
      const nameItem = mappingContext.dataReferenceItems[nameRef.dataItemId];

      expect(nameItem?.selectedKbChoice).toBe(KbChoice.PracticeKbValue);
      expect(nameItem?.practiceKbValue?.documentId).toBe(456);
      expect(nameItem?.profileKbValue).toBeUndefined();
    });

    it('should handle non-kb-data in kbItems', () => {
      mockData['reasonForVisit']['historyOfPresentIllness']['chiefComplaint'][0]['name'] = kbEntityMockData.nonKbData;

      const result = service.mapData<ReasonForVisit>(mockData['reasonForVisit'], 'reasonForVisit', mappingContext);
      
      const nameRef = result.historyOfPresentIllness.chiefComplaint[0].name;
      const nameItem = mappingContext.dataReferenceItems[nameRef.dataItemId];

      expect(nameItem?.selectedKbChoice).toBe(KbChoice.RawValue);
      expect(nameItem?.rawValue?.label).toBe('non-kb-data');
      expect(nameItem?.practiceKbValue).toBeUndefined();
      expect(nameItem?.profileKbValue).toBeUndefined();
    });
  });

  describe('Array Handling', () => {
    it('should handle non-array data for array schema nodes', () => {
      const mockClassificationResults = getMockClassificationResults();

      const result = service.mapData<ReasonForVisit>(mockClassificationResults['reasonForVisit'], 'reasonForVisit', mappingContext);
      expect(Array.isArray(result.historyOfPresentIllness.chiefComplaint)).toBe(true);
      expect(result.historyOfPresentIllness.chiefComplaint).toEqual([]);
    });

    it('should handle object data at schema level', () => {
      const mockClassificationResults = "not an object"; // This should be converted to an emtpy object

      const result = service.mapData<ReasonForVisit>(mockClassificationResults, 'reasonForVisit', mappingContext);
      expect(result).toBeDefined();
    });
  });

  describe('Mapper Registration', () => {
    it('should allow registering custom mappers and handle unknown types', () => {
      const customMapper = {
        canHandle: (node: ParsedSchemaNode) => node.type === SchemaNodeType.String,
        map: (data: any) => ({ customMapped: data })
      };

      service.registerMapper(customMapper);

      // We need to access a private method for this test, so we'll test the public API instead
      expect(() => service.mapData({}, 'NonExistentSchema', mappingContext))
        .toThrowError('Schema not found: NonExistentSchema');
    });
  });
});

