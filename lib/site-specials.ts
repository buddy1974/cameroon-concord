/**
 * Site Specials — temporary editorial verticals.
 *
 * Each special has an `active` flag. When set to false:
 *  - The nav tab is hidden (or demoted, depending on the component)
 *  - The homepage section is hidden
 *  - The landing page at /world-cup remains accessible (do not delete)
 *
 * To archive after the tournament: set active to false. No code deletion needed.
 */

export const siteSpecials = {
  worldCup: {
    /** Master switch — set false to retire section after tournament */
    active: true,
    /** Display label in navigation and section headers */
    label: 'World Cup',
    /** Landing page URL */
    href: '/world-cup',
    /** Show tab in top navigation */
    showInNav: true,
    /** Show section block on homepage */
    showOnHomepage: true,
    /** DB category slug used to tag articles */
    categorySlug: 'world-cup',
    /** Number of articles shown on homepage section */
    homepageArticleCount: 4,
    /** Page meta */
    metaTitle: 'World Cup Special | Cameroon Concord',
    metaDesc:
      "Follow Cameroon Concord's World Cup special coverage focused on African teams, Cameroon angles, diaspora football stories, match updates, analysis, and the politics of football.",
  },
} as const

export type SiteSpecials = typeof siteSpecials
