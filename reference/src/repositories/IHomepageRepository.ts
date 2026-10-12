import { HomepageData, Recipe, HeroSectionData, BlogPost } from '../types';

export interface IHomepageRepository {
  getHomepageData(): Promise<HomepageData>;
  getRecipes(): Promise<Recipe[]>;
  getHeroData(): Promise<HeroSectionData>;
  getLatestBlogPost(): Promise<BlogPost>;
}
