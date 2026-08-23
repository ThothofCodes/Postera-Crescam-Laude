export default {
  name: 'techTip',
  title: 'Tech Tip',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(150),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    },
    {
      name: 'tip',
      title: 'Tip Content',
      type: 'text',
      rows: 6,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Windows', value: 'windows' },
          { title: 'macOS', value: 'macos' },
          { title: 'Linux', value: 'linux' },
          { title: 'Mobile', value: 'mobile' },
          { title: 'Browser', value: 'browser' },
          { title: 'General', value: 'general' },
        ],
      },
    },
    {
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
      },
      initialValue: 'beginner',
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
