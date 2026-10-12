/**
 * Homepage Data Access Repository
 * Implements IHomepageRepository interface
 * 
 * Future Admin/CMS integration:
 * This class abstracts data retrieval. When switching to a real backend / database / GraphQL / REST API,
 * only this file needs to point to the remote endpoint. All UI components remain untouched.
 */

import { initialHomepageData } from '../content/initial-data.js';

export class HomepageRepository {
  constructor(apiBaseUrl = null) {
    this.apiBaseUrl = apiBaseUrl;
    this.cachedData = null;
  }

  /**
   * Retrieves complete homepage content
   * @returns {Promise<import('../types').HomepageData>}
   */
  async getHomepageData() {
    try {
      if (this.apiBaseUrl) {
        const response = await fetch(`${this.apiBaseUrl}/api/homepage`);
        if (!response.ok) {
          throw new Error(`Failed to fetch from API: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        this.cachedData = data;
        return data;
      }
      
      // Fallback / initial static data
      this.cachedData = initialHomepageData;
      return initialHomepageData;
    } catch (error) {
      console.warn('HomepageRepository: Fetch error, falling back to static schema data.', error);
      return initialHomepageData;
    }
  }

  /**
   * Retrieves recipe items
   * @returns {Promise<import('../types').Recipe[]>}
   */
  async getRecipes() {
    const data = await this.getHomepageData();
    return data.recipes?.recipes || [];
  }

  /**
   * Retrieves hero section configuration
   * @returns {Promise<import('../types').HeroSectionData>}
   */
  async getHeroData() {
    const data = await this.getHomepageData();
    return data.hero;
  }

  /**
   * Retrieves latest blog article
   * @returns {Promise<import('../types').BlogPost>}
   */
  async getLatestBlogPost() {
    const data = await this.getHomepageData();
    return data.blog;
  }
}

export const homepageRepository = new HomepageRepository();
export default homepageRepository;
