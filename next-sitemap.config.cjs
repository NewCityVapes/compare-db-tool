/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://compare.newcityvapes.com',
    generateRobotsTxt: true,
    exclude: ['/verdict-editor'], // optional, if you want to hide the CMS
    robotsTxtOptions: {
      policies: [
        { userAgent: '*', allow: '/' },
      ],
    },
    additionalPaths: async (config) => {
      const res = await fetch('https://your-vercel-api-or-supabase-endpoint-to-get-all-slugs');
      const slugs = await res.json(); // Example: ['stlth-vs-vice-box-2', ...]
  
      return slugs.map((slug) => ({
        loc: `/compare/${slug}`,
        changefreq: 'weekly',
        priority: 0.7,
      }));
    },
  };
  