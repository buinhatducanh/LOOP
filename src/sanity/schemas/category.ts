import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'category',
    title: 'Category',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title (English)',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'titleVi',
            title: 'Title (Vietnamese)',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'Description (English)',
            type: 'text',
            description: 'Short description shown in category listings. Max 200 chars.',
            rows: 2,
            validation: (Rule) => Rule.max(200),
        }),
        defineField({
            name: 'descriptionVi',
            title: 'Description (Vietnamese)',
            type: 'text',
            description: 'Short description shown in category listings. Max 250 chars.',
            rows: 2,
            validation: (Rule) => Rule.max(250),
        }),
        defineField({
            name: 'seoTitle',
            title: 'SEO Title Override',
            type: 'string',
            description: 'Overrides the page <title> for this category. Leave blank to use the title.',
            validation: (Rule) => Rule.max(70),
        }),
        defineField({
            name: 'seoTitleVi',
            title: 'SEO Title Override (Vietnamese)',
            type: 'string',
            description: 'Overrides the page <title> for this category in Vietnamese.',
            validation: (Rule) => Rule.max(80),
        }),
        defineField({
            name: 'seoDescription',
            title: 'SEO Meta Description (English)',
            type: 'text',
            description: 'Shown in search results. Max 160 chars.',
            rows: 3,
            validation: (Rule) => Rule.max(160),
        }),
        defineField({
            name: 'seoDescriptionVi',
            title: 'SEO Meta Description (Vietnamese)',
            type: 'text',
            description: 'Shown in search results. Max 200 chars.',
            rows: 3,
            validation: (Rule) => Rule.max(200),
        }),
        defineField({
            name: 'order',
            title: 'Sort Order',
            type: 'number',
            description: 'Lower numbers appear first in category listings.',
            initialValue: 99,
        }),
    ],
    orderings: [
        {
            title: 'Sort Order (ascending)',
            name: 'orderAsc',
            by: [{ field: 'order', direction: 'asc' }],
        },
        {
            title: 'Title (A–Z)',
            name: 'titleAsc',
            by: [{ field: 'title', direction: 'asc' }],
        },
    ],
    preview: {
        select: {
            title: 'title',
            titleVi: 'titleVi',
            subtitle: 'description',
        },
        prepare(selection) {
            return {
                ...selection,
                title: `[${selection.titleVi}] ${selection.title}`,
            }
        },
    },
})
