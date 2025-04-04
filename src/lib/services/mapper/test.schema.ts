export const reasonForVisitSchema = {
    "reasonForVisit": {
      "type": "object",
      "description": "Reason For Visit",
      "properties": {
        "historyOfPresentIllness": {
          "type": "object",
          "description": "History Of Present Illness",
          "properties": {
            "chiefComplaint": {
              "type": "array",
              "description": "Chief Complaint",
              "items": {
                "type": "object",
                "description": "Chief Complaint",
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "Name"
                  },
                  "severity": {
                    "type": "string",
                    "description": "Severity"
                  },
                  "quality": {
                    "type": "string",
                    "description": "Quality"
                  },
                  "duration": {
                    "type": "string",
                    "description": "Duration"
                  },
                  "course": {
                    "type": "string",
                    "description": "Course"
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  export const planSchema = {
    "plan": {
      "type": "object",
      "description": "Plan",
      "properties": {
        "physicianImpressions": {
          "type": "array",
          "description": "Physician Impressions",
          "items": {
            "type": "object",
            "description": "Physician Impression",
            "properties": {
              "impression": {
                "type": "string",
                "description": "Impression"
              },
              "treatments": {
                "type": "array",
                "description": "Treatments",
                "items": {
                  "type": "string",
                  "description": "Treatments"
                }
              },
              "prescriptions": {
                "type": "array",
                "description": "Prescriptions",
                "items": {
                  "type": "string",
                  "description": "Prescriptions"
                }
              },
              "laterality": {
                "type": "string",
                "description": "Laterality",
                "enum": [
                  "OU",
                  "OD",
                  "OS"
                ]
              },
              "advice": {
                "type": "array",
                "description": "Advice",
                "items": {
                  "type": "string",
                  "description": "Advice"
                }
              }
            }
          }
        }
      }
    }
  }

  export const examSchema = {
    "exam": {
      "type": "object",
      "description": "Exam",
      "properties": {
        "anterior": {
          "type": "object",
          "description": "Anterior Section List",
          "properties": {
            "general": {
              "type": "array",
              "description": "General",
              "items": {
                "type": "object",
                "description": "Anterior Section",
                "properties": {
                  "laterality": {
                    "type": "string",
                    "description": "Laterality",
                    "enum": [
                      "OU",
                      "OD",
                      "OS"
                    ]
                  },
                  "location": {
                    "type": "string",
                    "description": "Location"
                  },
                  "finding": {
                    "type": "string",
                    "description": "Finding"
                  },
                  "severity": {
                    "type": "string",
                    "description": "Severity"
                  },
                  "status": {
                    "type": "string",
                    "description": "Status"
                  },
                  "category": {
                    "type": "string",
                    "description": "Category"
                  }
                }
              }
            },
            "lcs": {
              "type": "array",
              "description": "Lcs",
              "items": {
                "type": "object",
                "description": "Anterior Section",
                "properties": {
                  "laterality": {
                    "type": "string",
                    "description": "Laterality",
                    "enum": [
                      "OU",
                      "OD",
                      "OS"
                    ]
                  },
                  "location": {
                    "type": "string",
                    "description": "Location"
                  },
                  "finding": {
                    "type": "string",
                    "description": "Finding"
                  },
                  "severity": {
                    "type": "string",
                    "description": "Severity"
                  },
                  "status": {
                    "type": "string",
                    "description": "Status"
                  },
                  "category": {
                    "type": "string",
                    "description": "Category"
                  }
                }
              }
            },
            "cornea": {
              "type": "array",
              "description": "Cornea",
              "items": {
                "type": "object",
                "description": "Anterior Section",
                "properties": {
                  "laterality": {
                    "type": "string",
                    "description": "Laterality",
                    "enum": [
                      "OU",
                      "OD",
                      "OS"
                    ]
                  },
                  "location": {
                    "type": "string",
                    "description": "Location"
                  },
                  "finding": {
                    "type": "string",
                    "description": "Finding"
                  },
                  "severity": {
                    "type": "string",
                    "description": "Severity"
                  },
                  "status": {
                    "type": "string",
                    "description": "Status"
                  },
                  "category": {
                    "type": "string",
                    "description": "Category"
                  }
                }
              }
            },
            "anterior_chamber": {
              "type": "array",
              "description": "Anterior_chamber",
              "items": {
                "type": "object",
                "description": "Anterior Section",
                "properties": {
                  "laterality": {
                    "type": "string",
                    "description": "Laterality",
                    "enum": [
                      "OU",
                      "OD",
                      "OS"
                    ]
                  },
                  "location": {
                    "type": "string",
                    "description": "Location"
                  },
                  "finding": {
                    "type": "string",
                    "description": "Finding"
                  },
                  "severity": {
                    "type": "string",
                    "description": "Severity"
                  },
                  "status": {
                    "type": "string",
                    "description": "Status"
                  },
                  "category": {
                    "type": "string",
                    "description": "Category"
                  }
                }
              }
            },
            "iris": {
              "type": "array",
              "description": "Iris",
              "items": {
                "type": "object",
                "description": "Anterior Section",
                "properties": {
                  "laterality": {
                    "type": "string",
                    "description": "Laterality",
                    "enum": [
                      "OU",
                      "OD",
                      "OS"
                    ]
                  },
                  "location": {
                    "type": "string",
                    "description": "Location"
                  },
                  "finding": {
                    "type": "string",
                    "description": "Finding"
                  },
                  "severity": {
                    "type": "string",
                    "description": "Severity"
                  },
                  "status": {
                    "type": "string",
                    "description": "Status"
                  },
                  "category": {
                    "type": "string",
                    "description": "Category"
                  }
                }
              }
            },
            "lens": {
              "type": "array",
              "description": "Lens",
              "items": {
                "type": "object",
                "description": "Anterior Section",
                "properties": {
                  "laterality": {
                    "type": "string",
                    "description": "Laterality",
                    "enum": [
                      "OU",
                      "OD",
                      "OS"
                    ]
                  },
                  "location": {
                    "type": "string",
                    "description": "Location"
                  },
                  "finding": {
                    "type": "string",
                    "description": "Finding"
                  },
                  "severity": {
                    "type": "string",
                    "description": "Severity"
                  },
                  "status": {
                    "type": "string",
                    "description": "Status"
                  },
                  "category": {
                    "type": "string",
                    "description": "Category"
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  export const testSchemaDefinition = [
    reasonForVisitSchema,
    planSchema,
    examSchema
  ]
