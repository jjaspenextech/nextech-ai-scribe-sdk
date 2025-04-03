export interface ClassificationResult {
  classification: {
    [key: string]: any;
  };
  sections_present: {
    [key: string]: boolean;
  };
} 