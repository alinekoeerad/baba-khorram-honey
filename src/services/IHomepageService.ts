import { HomepageData, Recipe } from '../types';

export interface IHomepageService {
  loadHomepage(): Promise<HomepageData>;
  getFeaturedRecipes(): Promise<Recipe[]>;
  sanitizeString(input: string): string;
}
