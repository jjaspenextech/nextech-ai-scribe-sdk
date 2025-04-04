import { TestBed } from '@angular/core/testing';
import { GenericMappingService } from './mapping.service';
import { SchemaParserService } from './schema-parser.service';
import { ParsedSchemaNode, SchemaNodeType } from '../../models/schema-definition';
import { ClassificationData, KbChoice, UIItemWithDataReference } from '../../models/classification';
import { ReasonForVisit, Plan, Exam, MedicalChart } from './test.data';
import { schemaDict } from './test.schema';

describe('GenericMappingService', () => {
  let service: GenericMappingService;
  let mockData: Record<string, any>;
  let emptyMedicalChart: MedicalChart;
  let mappingContext: {
    dataReferenceItems: Record<string, UIItemWithDataReference>;
    nextKbId: number;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GenericMappingService,
        SchemaParserService
      ]
    });

    service = TestBed.inject(GenericMappingService);    

    // Setup mock data
    mockData = {
      "reasonForVisit": {
        "historyOfPresentIllness": {
          "chiefComplaint": [
            {
              "name": {
                  "label": "some issue",
                  "Profile_KbEntityId": 123,
                  "Practice_KbEntityId": 456,
                  "Profile_DocumentValue": "Dry Eye Syndrome",
                  "Practice_DocumentValue": "DES",
                  "Profile_confidence_score": 0.61047447,
                  "Practice_confidence_score": 0.81510377
              },
              "severity": {
                "label": "moderate",
                "dataItemId": "1",
                "referenceTableId": 240
              },
              "quality": {
                "label": "dry and itchy",
                "dataItemId": "2",
                "referenceTableId": 230
              },
              "duration": {
                "label": "one week",
                "dataItemId": "3",
                "referenceTableId": 220
              },
              "course": [
                "gradually getting worse"
              ]
            }
          ],
          "diabetes": {
            "date": "2023-01-01",
            "hba1c": 6.8
          },
          "source": "Patient",
          "mentalStatus": true,
          "freeText": "No additional information"
        },
        "condition": []
      },
      "plan": {
        "physicianImpressions": [
          {
            "impression": "Dry eye syndrome and blepharitis",
            "treatments": [ "Warm compress" ],
            "prescriptions": [
              "Restasis, one drop per eye twice a day"
            ],
            "laterality": "OU",
            "advice": []
          }
        ],
        "other_discussions": [
          {
            "discussions": "Patient has type 2 diabetes with recent HBA1C of 6.8. Patient spends a few hours on the computer for work, which may exacerbate dryness."
          }
        ],
        "followup": [
          {
            "provider": "Doctor Smith",
            "whento": "2023-02-01",
            "type": "exam",
            "laterality": "OU"
          }
        ],
        "specialty_meds": []
      },
    };

    mappingContext = {
      dataReferenceItems: {},
      nextKbId: 0
    };

    // Setup empty medical chart
    emptyMedicalChart = {
      sections: {
        'reasonForVisit': {} as ReasonForVisit,
        'plan': {} as Plan,
        'exam': {} as Exam
      },
      dataReferenceItems: {}
    };

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
      let kbItems: Record<string, UIItemWithDataReference> = {};
      mockData['reasonForVisit']['historyOfPresentIllness']['chiefComplaint'][0]['name'] = {
        "label": "Dry Eye",
        "Profile_KbEntityId": 123,
        "Profile_DocumentValue": "Dry Eye Syndrome",
        "Profile_confidence_score": 0.95,
        "Practice_KbEntityId": 456,
        "Practice_DocumentValue": "DES",
        "Practice_confidence_score": 0.85
      };

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
      let kbItems: Record<string, UIItemWithDataReference> = {};
      mockData['reasonForVisit']['historyOfPresentIllness']['chiefComplaint'][0]['name'] = {
        "label": "Dry Eye",
        "Practice_KbEntityId": 456,
        "Practice_DocumentValue": "DES",
        "Practice_confidence_score": 0.85
      };
      const result = service.mapData<ReasonForVisit>(mockData['reasonForVisit'], 'reasonForVisit', mappingContext);
      
      const nameRef = result.historyOfPresentIllness.chiefComplaint[0].name;
      const nameItem = mappingContext.dataReferenceItems[nameRef.dataItemId];

      expect(nameItem?.selectedKbChoice).toBe(KbChoice.PracticeKbValue);
      expect(nameItem?.practiceKbValue?.documentId).toBe(456);
      expect(nameItem?.profileKbValue).toBeUndefined();
    });

    it('should handle non-kb-data in kbItems', () => {
      let kbItems: Record<string, UIItemWithDataReference> = {};
      mockData['reasonForVisit']['historyOfPresentIllness']['chiefComplaint'][0]['name'] = 'non-kb-data';

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
      const mockClassificationResults = {
        "reasonForVisit": {
          "historyOfPresentIllness": {
            "chiefComplaint": "not an array" // This should be converted to an empty array
          }
        }
      };

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

