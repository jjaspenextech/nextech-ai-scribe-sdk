import { ClassificationData, DataReference } from "../../models/models";

export interface ReasonForVisit {
  historyOfPresentIllness: HistoryOfPresentIllness;
}

export interface HistoryOfPresentIllness {
  chiefComplaint: ChiefComplaint[];
}

export interface ChiefComplaint {
  name: DataReference;
  severity: DataReference;
  quality: DataReference;
  duration: DataReference;
  course: string;
}


export type LATERALITIES = 'OU' | 'OD' | 'OS';

export interface Plan {
  physicianImpressions: PhysicianImpression[];
}

export interface PhysicianImpression {
  impression: string;
  treatments: Treatment[];
  prescriptions: Prescriptions[];
  laterality: LATERALITIES;
  advice: string[];
}

export type Treatment = string;

export type Prescriptions = string;

export interface Exam {
  anterior: AnteriorSectionList;
}

export interface AnteriorSectionList {
  general: AnteriorSection[];
  lcs: AnteriorSection[];
  cornea: AnteriorSection[];
  anterior_chamber: AnteriorSection[];
  iris: AnteriorSection[];
  lens: AnteriorSection[];
}

export interface AnteriorSection {
  laterality: LATERALITIES;
  location: string;
  finding: string;
  severity: string;
  status: string;
  category: string;
}

export interface MedicalChart extends ClassificationData {
  sections: {
    "reasonForVisit": ReasonForVisit;
    "plan": Plan;
    "exam": Exam;
  };
}
