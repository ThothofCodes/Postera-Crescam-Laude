export default {
  name: 'fact',
  title: 'Tech Fact',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    },
    {
      name: 'fact',
      title: 'Fact',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().max(500),
    },
    {
      name: 'source',
      title: 'Source',
      type: 'string',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'History', value: 'history' },
          { title: 'Innovation', value: 'innovation' },
          { title: 'Internet', value: 'internet' },
          { title: 'Gaming', value: 'gaming' },
          { title: 'Space Tech', value: 'space' },
          { title: 'General', value: 'general' },
        ],
      },
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    },
  ],
};
