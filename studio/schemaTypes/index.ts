import { defineArrayMember, defineField, defineType } from 'sanity'

const CORE_PAGE_PATHS = ['/', '/blog', '/404'] as const
const ROUTABLE_DOCUMENT_TYPES = ['marketingPage', 'post', 'category'] as const

function normalizePath(path: string) {
  if (path === '/') return path
  return `/${path.replace(/^\/+|\/+$/g, '')}`
}

function pathField(title = 'Original site path') {
  return defineField({
    name: 'path',
    title,
    type: 'string',
    description: 'Canonical path beginning with /. Do not add a trailing slash.',
    validation: (rule) =>
      rule
        .required()
        .regex(/^\/(?:[^/?#]+(?:\/[^/?#]+)*)?$/, { name: 'canonical site path' })
        .custom(async (value, context) => {
          if (!value || typeof value !== 'string') return true

          const path = normalizePath(value)
          if (context.document?._type === 'marketingPage' && CORE_PAGE_PATHS.includes(path as (typeof CORE_PAGE_PATHS)[number])) {
            return `${path} is owned by Astro. Add or edit that page in web/src/pages instead.`
          }

          const documentId = context.document?._id?.replace(/^drafts\./, '')
          if (!documentId) return true

          const client = context.getClient({ apiVersion: '2026-11-09' })
          const duplicateId = await client.fetch<string | null>(
            `*[\n              _type in $types &&\n              path == $path &&\n              !(_id in [$draftId, $publishedId])\n            ][0]._id`,
            {
              types: [...ROUTABLE_DOCUMENT_TYPES],
              path,
              draftId: `drafts.${documentId}`,
              publishedId: documentId,
            },
          )

          return duplicateId ? `${path} is already used by another routable document.` : true
        }),
  })
}

const seo = defineType({
  name: 'seo', title: 'Search and social', type: 'object',
  fields: [
    defineField({ name: 'title', title: 'SEO title', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
    defineField({ name: 'canonicalUrl', title: 'Canonical URL', type: 'url' }),
    defineField({ name: 'socialImage', title: 'Social image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'noIndex', title: 'Hide from search engines', type: 'boolean', initialValue: false }),
  ],
})

const figure = defineType({
  name: 'figure', title: 'Image', type: 'image', options: { hotspot: true },
  fields: [
    defineField({ name: 'alt', title: 'Alternative text', type: 'string', description: 'Describe the image; leave empty only when it is decorative.' }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'sourceUrl', title: 'Original WordPress media URL', type: 'url' }),
  ],
})

const video = defineType({
  name: 'videoEmbed', title: 'Video', type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'url', title: 'Video or embed URL', type: 'url', validation: rule => rule.required() }),
    defineField({ name: 'poster', title: 'Poster image', type: 'figure' }),
    defineField({ name: 'captionUrl', title: 'Captions URL', type: 'url' }),
  ],
  preview: { select: { title: 'title', subtitle: 'url' } },
})

const richText = defineType({
  name: 'richText', title: 'Rich text', type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      marks: {
        annotations: [defineArrayMember({
          name: 'link', type: 'object', title: 'Link',
          fields: [defineField({ name: 'href', title: 'URL or site path', type: 'string', validation: rule => rule.required() })],
        })],
      },
    }),
    defineArrayMember({ type: 'figure' }),
    defineArrayMember({ type: 'videoEmbed' }),
  ],
})

const sharedFields = [
  defineField({ name: 'title', title: 'Title', type: 'string', validation: rule => rule.required() }),
  pathField(),
  defineField({ name: 'wordpressId', title: 'WordPress ID', type: 'number', readOnly: true }),
  defineField({ name: 'sourceUrl', title: 'Original WordPress URL', type: 'url', readOnly: true }),
  defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
]

const marketingPage = defineType({
  name: 'marketingPage', title: 'Marketing landing page', type: 'document',
  description: 'Campaign and marketing pages rendered by Astro from Sanity content. Core website pages live in the Astro codebase.',
  fields: [
    ...sharedFields,
    defineField({ name: 'body', title: 'Content', type: 'richText' }),
  ],
  preview: { select: { title: 'title', subtitle: 'path' } },
})

const author = defineType({
  name: 'author', title: 'Author', type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'bio', title: 'Biography', type: 'text' }),
    defineField({ name: 'image', title: 'Photo', type: 'figure' }),
    defineField({ name: 'wordpressId', title: 'WordPress ID', type: 'number', readOnly: true }),
  ],
})

const category = defineType({
  name: 'category', title: 'Category', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: rule => rule.required() }),
    pathField('Archive path'),
    defineField({ name: 'wordpressId', title: 'WordPress ID', type: 'number', readOnly: true }),
  ],
})

const post = defineType({
  name: 'post', title: 'Blog post', type: 'document',
  fields: [
    ...sharedFields,
    defineField({ name: 'publishedAt', title: 'Original publication date', type: 'datetime' }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }] }),
    defineField({ name: 'categories', title: 'Categories', type: 'array', of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })] }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'heroImage', title: 'Featured image', type: 'figure' }),
    defineField({ name: 'body', title: 'Article', type: 'richText' }),
  ],
  preview: { select: { title: 'title', subtitle: 'path', media: 'heroImage' } },
})

export const schemaTypes = [seo, figure, video, richText, marketingPage, author, category, post]
