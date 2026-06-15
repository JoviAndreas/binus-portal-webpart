import { IResolvedCategory } from './categorize';

export interface IAppLink {
  id: number;
  title: string;
  url: string;
  thumbnail?: string;
  category: IResolvedCategory;
}
