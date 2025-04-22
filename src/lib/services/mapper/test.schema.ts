import { SchemaNodeType, ParsedSchema } from "../../models/schema-definition";

// Mock parsed schema structure used by SchemaParserService
export const getMockedParsedSchemas = (): { [key: string]: ParsedSchema } => {
  const schemas: { [key: string]: ParsedSchema } = {};

  // ReasonForVisit parsed schema
  schemas['reasonForVisit'] = {
    rootType: 'reasonForVisit',
    structure: {
      type: SchemaNodeType.Object,
      properties: {
        historyOfPresentIllness: {
          type: SchemaNodeType.Object,
          properties: {
            chiefComplaint: {
              type: SchemaNodeType.Array,
              itemType: {
                type: SchemaNodeType.Object,
                properties: {
                  name: {
                    type: SchemaNodeType.KbEntity,
                    kbTableId: 210
                  },
                  severity: {
                    type: SchemaNodeType.KbEntity,
                    kbTableId: 220
                  },
                  quality: {
                    type: SchemaNodeType.KbEntity,
                    kbTableId: 230
                  },
                  duration: {
                    type: SchemaNodeType.KbEntity,
                    kbTableId: 220
                  },
                  course: {
                    type: SchemaNodeType.Array,
                    itemType: {
                      type: SchemaNodeType.String
                    }
                  }
                }
              }
            },
            diabetes: {
              type: SchemaNodeType.Object,
              properties: {
                date: {
                  type: SchemaNodeType.String
                },
                hba1c: {
                  type: SchemaNodeType.Number
                }
              }
            },
            source: {
              type: SchemaNodeType.String
            },
            mentalStatus: {
              type: SchemaNodeType.Boolean
            },
            freeText: {
              type: SchemaNodeType.String
            }
          }
        },
        condition: {
          type: SchemaNodeType.Array,
          itemType: {
            type: SchemaNodeType.Object
          }
        }
      }
    }
  };

  // Plan parsed schema
  schemas['plan'] = {
    rootType: 'plan',
    structure: {
      type: SchemaNodeType.Object,
      properties: {
        physicianImpressions: {
          type: SchemaNodeType.Array,
          itemType: {
            type: SchemaNodeType.Object,
            properties: {
              impression: {
                type: SchemaNodeType.String
              },
              treatments: {
                type: SchemaNodeType.Array,
                itemType: {
                  type: SchemaNodeType.String
                }
              },
              prescriptions: {
                type: SchemaNodeType.Array,
                itemType: {
                  type: SchemaNodeType.String
                }
              },
              laterality: {
                type: SchemaNodeType.String
              },
              advice: {
                type: SchemaNodeType.Array,
                itemType: {
                  type: SchemaNodeType.String
                }
              }
            }
          }
        },
        other_discussions: {
          type: SchemaNodeType.Array,
          itemType: {
            type: SchemaNodeType.Object,
            properties: {
              discussions: {
                type: SchemaNodeType.String
              }
            }
          }
        },
        followup: {
          type: SchemaNodeType.Array,
          itemType: {
            type: SchemaNodeType.Object,
            properties: {
              provider: {
                type: SchemaNodeType.String
              },
              whento: {
                type: SchemaNodeType.String
              },
              type: {
                type: SchemaNodeType.String
              },
              laterality: {
                type: SchemaNodeType.String
              }
            }
          }
        },
        specialty_meds: {
          type: SchemaNodeType.Array,
          itemType: {
            type: SchemaNodeType.Object
          }
        },
        management: {
          type: SchemaNodeType.String
        }
      }
    }
  };

  // Exam parsed schema
  schemas['exam'] = {
    rootType: 'exam',
    structure: {
      type: SchemaNodeType.Object,
      properties: {
        anterior: {
          type: SchemaNodeType.Object,
          properties: {
            general: {
              type: SchemaNodeType.Array,
              itemType: {
                type: SchemaNodeType.Object,
                properties: {
                  laterality: {
                    type: SchemaNodeType.String
                  },
                  location: {
                    type: SchemaNodeType.String
                  },
                  finding: {
                    type: SchemaNodeType.String
                  },
                  severity: {
                    type: SchemaNodeType.String
                  },
                  status: {
                    type: SchemaNodeType.String
                  },
                  category: {
                    type: SchemaNodeType.String
                  }
                }
              }
            },
            lcs: {
              type: SchemaNodeType.Array,
              itemType: {
                type: SchemaNodeType.Object
              }
            },
            cornea: {
              type: SchemaNodeType.Array,
              itemType: {
                type: SchemaNodeType.Object
              }
            },
            anterior_chamber: {
              type: SchemaNodeType.Array,
              itemType: {
                type: SchemaNodeType.Object
              }
            },
            iris: {
              type: SchemaNodeType.Array,
              itemType: {
                type: SchemaNodeType.Object
              }
            },
            lens: {
              type: SchemaNodeType.Array,
              itemType: {
                type: SchemaNodeType.Object
              }
            }
          }
        }
      }
    }
  };

  return schemas;
};
