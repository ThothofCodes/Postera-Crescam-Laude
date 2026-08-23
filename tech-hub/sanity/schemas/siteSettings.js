export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Site Title',
      type: 'string',
      initialValue: 'PCL Tech Hub',
    },
    {
      name: 'description',
      title: 'Site Description',
      type: 'text',
      rows: 3,
      initialValue: 'Empowering Kenya\'s Digital Future — Tech articles, tips, and news',
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
    },
    {
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'platform', title: 'Platform', type: 'string' },
            { name: 'url', title: 'URL', type: 'url' },
          ],
        },
      ],
    },
  ],
  preview: {
    select: { title: 'title' },
  },
};
