// CV types and interfaces

export interface CvData {
  id: string;
  rawCvText: string;
  inputMethod: 'text' | 'form' | 'pdf';
  parsedSkills?: string[];
  parsedRoles?: string[];
  parsedTools?: string[];
  experienceYears?: number;
  seniority?: string;
  isActive?: boolean;
  version?: number;
  createdAt: string;
}

export type View = 'active' | 'edit' | 'versions';
