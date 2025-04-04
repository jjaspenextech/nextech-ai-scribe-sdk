import { ClassificationData, DataReference, UIItemWithDataReference } from "../../models/classification";

// Enhanced mock interfaces for testing
export interface ReasonForVisit {
  historyOfPresentIllness: {
    chiefComplaint: Array<{
      name: any;
      severity: any;
      quality: any;
      duration: any;
      course: string[];
    }>;
    diabetes?: {
      date: string;
      hba1c: number;
    };
    source?: string;
    mentalStatus?: boolean;
    freeText?: string;
  };
  condition?: any[];
}

export interface Plan {
  physicianImpressions: Array<{
    impression: string;
    treatments: string[];
    prescriptions: string[];
    laterality: string;
    advice: any[];
  }>;
  other_discussions: Array<{
    discussions: string;
  }>;
  followup: Array<{
    provider: string;
    whento: string;
    type: string;
    laterality: string;
  }>;
  specialty_meds: any[];
  management?: string;
}

export interface Exam {
  anterior: {
    general: Array<{
      laterality: string;
      location: string;
      finding: string;
      severity: string;
      status: string;
      category: string;
    }>;
    lcs: any[];
    cornea: any[];
    anterior_chamber: any[];
    iris: any[];
    lens: any[];
  };
}

export interface MedicalChart extends ClassificationData {
  sections: {
    "reasonForVisit": ReasonForVisit;
    "plan": Plan;
    "exam": Exam;
  };
}

// Mock data for tests
export const getMockData = () => ({
  reasonForVisit: {
    historyOfPresentIllness: {
      chiefComplaint: [
        {
          name: {
            "label": "some issue",
            "Profile_KbEntityId": 123,
            "Profile_DocumentValue": "Dry Eye Syndrome",
            "Profile_confidence_score": 0.61047447,
            "Practice_KbEntityId": 456,
            "Practice_DocumentValue": "DES",
            "Practice_confidence_score": 0.81510377
          },
          severity: {
            "label": "moderate",
            "dataItemId": "2",
            "referenceTableId": 220
          },
          quality: {
            "label": "burning",
            "dataItemId": "3",
            "referenceTableId": 230
          },
          duration: {
            "label": "one week",
            "dataItemId": "3",
            "referenceTableId": 220
          },
          course: [
            "gradually getting worse"
          ]
        }
      ],
      diabetes: {
        date: "2023-01-01",
        hba1c: 6.8
      },
      source: "Patient",
      mentalStatus: true,
      freeText: "No additional information"
    },
    condition: []
  },
  plan: {
    physicianImpressions: [
      {
        impression: "Dry eye syndrome and blepharitis",
        treatments: ["Warm compress"],
        prescriptions: [
          "Restasis, one drop per eye twice a day"
        ],
        laterality: "OU",
        advice: []
      }
    ],
    other_discussions: [
      {
        discussions: "Patient has type 2 diabetes with recent HBA1C of 6.8. Patient spends a few hours on the computer for work, which may exacerbate dryness."
      }
    ],
    followup: [
      {
        provider: "Doctor Smith",
        whento: "2023-02-01",
        type: "exam",
        laterality: "OU"
      }
    ],
    specialty_meds: [],
    management: "Test management plan"
  }
});

// Setup empty medical chart
export const getEmptyMedicalChart = (): ClassificationData => ({
  sections: {
    'reasonForVisit': {} as any,
    'plan': {} as any,
    'exam': {} as any
  },
  dataReferenceItems: {}
});

// Mock classification results for array handling tests
export const getMockClassificationResults = () => ({
  reasonForVisit: {
    historyOfPresentIllness: {
      chiefComplaint: "not an array" // This should be converted to an empty array
    }
  }
});

// Mock KB entity data for testing
export const getKbEntityMockData = () => ({
  standardKbEntity: {
    "label": "Dry Eye",
    "Profile_KbEntityId": 123,
    "Profile_DocumentValue": "Dry Eye Syndrome",
    "Profile_confidence_score": 0.95,
    "Practice_KbEntityId": 456,
    "Practice_DocumentValue": "DES",
    "Practice_confidence_score": 0.85
  },
  practiceOnlyKbEntity: {
    "label": "Dry Eye",
    "Practice_KbEntityId": 456,
    "Practice_DocumentValue": "DES",
    "Practice_confidence_score": 0.85
  },
  nonKbData: 'non-kb-data'
});
