export interface IAppLink {
  id: number;
  title: string;
  url: string;
  thumbnail?: string;
  category: AppCategory;
}

export type AppCategory =
  | 'Academic'
  | 'Student'
  | 'Faculty & Staff'
  | 'Finance'
  | 'Library'
  | 'Schools'
  | 'BINUS Group'
  | 'Tools'
  | 'Other';

export interface IHeroItem {
  title: string;
  description: string;
  category: string;
  href: string;
  image?: string;
}
