export interface OntologyResponse {
  command: string;
  recommendCombination: RecommendCombination[];
  recommendTwins: RecommendTwin[];
  detectCheck: DetectCheck;
}

export interface DetectCheck {
  true: False;
  false: False;
}

export interface False {
  keywords: string[];
}

export interface RecommendCombination {
  id: string;
  type: string;
  "ngsi-ld:name": NgsiLdDescription;
  "ngsi-ld:description": NgsiLdDescription;
  keywords: Keywords;
  hasNameTerm: HasNameTerm;
  twinKeywords: Keywords;
  twinSubjects: NgsiLdDescription;
  hasKeywordTerm: HasKeywordTerm;
  isDigitalObjectOf: HasNameTerm;
  detectedKeywords: string[];
  detectedSubjectsCnt: number;
  detectedKeywordsCnt: number;
  detectedCnt: number;
}

export interface HasKeywordTerm {
  type: string;
  object: string[];
}

export interface HasNameTerm {
  type: string;
  object: string;
}

export interface Keywords {
  type: string;
  value: string[];
}

export interface NgsiLdDescription {
  type: string;
  value: string;
}

export interface RecommendTwin {
  id: string;
  type: string;
  "ngsi-ld:name": NgsiLdDescription;
  "ngsi-ld:description": NgsiLdDescription;
  owner: NgsiLdDescription;
  keywords: Keywords;
  subjects: NgsiLdDescription;
  hasKeywordTerm: HasKeywordTerm;
  hasSubjectTerm: HasNameTerm;
}
