import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'post',
    title: 'Post',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title (English)',
            type: 'string',
            validation: (Rule) => Rule.required().max(80),
        }),
        defineField({
            name: 'titleVi',
            title: 'Title (Vietnamese)',
            type: 'string',
            validation: (Rule) => Rule.required().max(120),
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
            name: 'author',
            title: 'Author',
            type: 'reference',
            to: { type: 'author' },
        }),
        defineField({
            name: 'mainImage',
            title: 'Main image',
            type: 'image',
            options: {
                hotspot: true,
            },
            fields: [
                defineField({
                    name: 'alt',
                    title: 'Alt text',
                    type: 'string',
                    description: 'SEO alt text for the main image. Describes what is shown in the image.',
                    validation: (Rule) => Rule.required().max(160),
                }),
                defineField({
                    name: 'caption',
                    title: 'Caption',
                    type: 'string',
                    description: 'Optional caption displayed below the image.',
                    validation: (Rule) => Rule.max(200),
                }),
            ],
        }),
        defineField({
            name: 'categories',
            title: 'Categories',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'category' } }],
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published at',
            type: 'datetime',
        }),
        defineField({
            name: 'excerpt',
            title: 'Excerpt (English)',
            type: 'text',
            description: 'Short summary shown in blog listings and social previews. Max 300 chars.',
            rows: 3,
            validation: (Rule) => Rule.max(300),
        }),
        defineField({
            name: 'excerptVi',
            title: 'Excerpt (Vietnamese)',
            type: 'text',
            description: 'Short summary shown in blog listings and social previews. Max 400 chars.',
            rows: 3,
            validation: (Rule) => Rule.max(400),
        }),
        defineField({
            name: 'body',
            title: 'Body (English)',
            type: 'array',
            of: [
                { type: 'block' },
                {
                    type: 'image',
                    options: { hotspot: true },
                    fields: [
                        defineField({
                            name: 'alt',
                            title: 'Alt text',
                            type: 'string',
                            validation: (Rule) => Rule.required().max(160),
                        }),
                        defineField({
                            name: 'caption',
                            title: 'Caption',
                            type: 'string',
                        }),
                    ],
                },
            ],
        }),
        defineField({
            name: 'bodyVi',
            title: 'Body (Vietnamese)',
            type: 'array',
            of: [
                { type: 'block' },
                {
                    type: 'image',
                    options: { hotspot: true },
                    fields: [
                        defineField({
                            name: 'alt',
                            title: 'Alt text',
                            type: 'string',
                            validation: (Rule) => Rule.required().max(160),
                        }),
                        defineField({
                            name: 'caption',
                            title: 'Caption',
                            type: 'string',
                        }),
                    ],
                },
            ],
        }),
    ],
    preview: {
        select: {
            title: 'title',
            titleVi: 'titleVi',
            author: 'author.name',
            media: 'mainImage',
        },
        prepare(selection) {
            const { author, titleVi } = selection
            return {
                ...selection,
                title: titleVi ?? selection.title,
                subtitle: author && `by ${author}`,
            }
        },
    },
    orderings: [
        {
            title: 'Published Date (newest first)',
            name: 'publishedAtDesc',
            by: [{ field: 'publishedAt', direction: 'desc' }],
        },
        {
            title: 'Published Date (oldest first)',
            name: 'publishedAtAsc',
            by: [{ field: 'publishedAt', direction: 'asc' }],
        },
    ],
})
