export default {
  name: 'news',
  title: 'Tech News',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required().max(200),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    },
    {
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().max(500),
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'source',
      title: 'Source Name',
      type: 'string',
    },
    {
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    },
  ],
  orderings: [
    { title: 'Published (newest first)', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
};
