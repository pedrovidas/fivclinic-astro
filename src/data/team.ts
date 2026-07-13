import content from '../content/our-team.json';

export interface Person {
  name: string;
  photo: string;
  roles: string[];
  spec: string[];
  social: { linkedin?: string; x?: string; doctoralia?: string };
}
export interface Dept { name: string; people: Person[]; }

export const medicalTeam: Dept[] = content.medicalTeam as Dept[];
export const nursingTeam: Dept[] = content.nursingTeam as Dept[];
export const adminTeam: Dept[] = content.adminTeam as Dept[];
