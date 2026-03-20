import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'name',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'image',
            title: 'Image',
            type: 'image',
            options: {
                hotspot: true,
            },
            fields: [
                defineField({
                    name: 'alt',
                    title: 'Alt text',
                    type: 'string',
                    validation: (Rule) => Rule.required().max(160),
                }),
            ],
        }),
        defineField({
            name: 'shortBio',
            title: 'Short Bio (English)',
            type: 'text',
            description: 'One-sentence bio shown under author avatar on blog posts. Max 200 chars.',
            rows: 2,
            validation: (Rule) => Rule.max(200),
        }),
        defineField({
            name: 'shortBioVi',
            title: 'Short Bio (Vietnamese)',
            type: 'text',
            description: 'One-sentence bio shown under author avatar on blog posts. Max 250 chars.',
            rows: 2,
            validation: (Rule) => Rule.max(250),
        }),
        defineField({
            name: 'bio',
            title: 'Full Bio (English)',
            type: 'array',
            description: 'Detailed bio for author profile page. Use Portable Text for formatting.',
            of: [
                {
                    title: 'Block',
                    type: 'block',
                    styles: [
                        { title: 'Normal', value: 'normal' },
                        { title: 'H2', value: 'h2' },
                        { title: 'H3', value: 'h3' },
                    ],
                    lists: [{ title: 'Bullet', value: 'bullet' }],
                    marks: {
                        decorators: [
                            { title: 'Strong', value: 'strong' },
                            { title: 'Emphasis', value: 'em' },
                        ],
                        annotations: [
                            {
                                title: 'URL',
                                name: 'link',
                                type: 'object',
                                fields: [
                                    {
                                        title: 'URL',
                                        name: 'href',
                                        type: 'url',
                                        validation: (Rule) =>
                                            Rule.uri({ allowRelative: true }),
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        }),
        defineField({
            name: 'bioVi',
            title: 'Full Bio (Vietnamese)',
            type: 'array',
            description: 'Detailed bio for author profile page. Use Portable Text for formatting.',
            of: [
                {
                    title: 'Block',
                    type: 'block',
                    styles: [
                        { title: 'Normal', value: 'normal' },
                        { title: 'H2', value: 'h2' },
                        { title: 'H3', value: 'h3' },
                    ],
                    lists: [{ title: 'Bullet', value: 'bullet' }],
                    marks: {
                        decorators: [
                            { title: 'Strong', value: 'strong' },
                            { title: 'Emphasis', value: 'em' },
                        ],
                        annotations: [
                            {
                                title: 'URL',
                                name: 'link',
                                type: 'object',
                                fields: [
                                    {
                                        title: 'URL',
                                        name: 'href',
                                        type: 'url',
                                        validation: (Rule) =>
                                            Rule.uri({ allowRelative: true }),
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        }),
        defineField({
            name: 'role',
            title: 'Role / Title',
            type: 'string',
            description: 'e.g. "Senior Frontend Developer"',
            validation: (Rule) => Rule.max(60),
        }),
        defineField({
            name: 'linkedin',
            title: 'LinkedIn URL',
            type: 'url',
            validation: (Rule) => Rule.uri({ allowRelative: false }),
        }),
        defineField({
            name: 'twitter',
            title: 'Twitter/X URL',
            type: 'url',
            validation: (Rule) => Rule.uri({ allowRelative: false }),
        }),
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: 'role',
            media: 'image',
        },
    },
})
