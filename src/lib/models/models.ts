

export interface DataReference {
  dataItemId: string;
  dataTableId: number | string;
}

export interface ParentDataReference<T> extends DataReference {
  details: T;
}

export interface UIItemWithDataReference {
  dataItemId: string;
  selectedKbChoice: KbChoice;
  isAccepted: boolean;
  rawValue?: DataReferenceValue;
  profileKbValue?: DataReferenceValue;
  practiceKbValue?: DataReferenceValue;
}

export interface DataReferenceValue {
  label: string;
  confidence_score?: number;
  documentId?: string | number;
}

export enum KbChoice {
  RawValue = 'rawValue',
  ProfileKbValue = 'profileKbValue',
  PracticeKbValue = 'practiceKbValue'
} 

export interface ClassificationData {
  sections: {
    [key: string]: any;
  };
  dataReferenceItems: Record<string, UIItemWithDataReference>;
}