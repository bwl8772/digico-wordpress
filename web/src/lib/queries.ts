import { defineQuery } from 'groq'

const seoFields = /* groq */ `
  seo {
    title,
    description,
    canonicalUrl,
    noIndex,
    socialImage {
      alt,
      asset->{ _id, url }
    }
  }
`

const figureFields = /* groq */ `
  alt,
  caption,
  sourceUrl,
  asset->{ _id, url, metadata { lqip, dimensions } }
`

export const ROUTABLE_CONTENT_BY_PATH_QUERY = defineQuery(/* groq */ `
  *[(_type == "marketingPage" || _type == "post") && path == $path && !(path in $corePaths)][0]{
    _id,
    _type,
    title,
    path,
    excerpt,
    publishedAt,
    "authorName": author->name,
    heroImage { ${figureFields} },
    ${seoFields},
    body
  }
`)

export const POSTS_QUERY = defineQuery(/* groq */ `
  *[_type == "post" && defined(path)] | order(publishedAt desc) {
    _id,
    title,
    path,
    excerpt,
    publishedAt,
    "authorName": author->name,
    heroImage { ${figureFields} }
  }
`)

export const ROUTABLE_CONTENT_PATHS_QUERY = defineQuery(/* groq */ `
  *[(_type == "marketingPage" || _type == "post") && defined(path) && !(path in $corePaths)]{
    _id,
    _type,
    path
  }
`)
