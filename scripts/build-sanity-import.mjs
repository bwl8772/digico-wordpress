import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseFragment, serialize } from '../web/node_modules/parse5/dist/index.js'

const root = resolve(import.meta.dirname, '..')
const pageDirectory = resolve(root, 'migration/wordpress-export/pages')
const postDirectory = resolve(root, 'migration/wordpress-export/posts')
const output = resolve(root, 'migration/sanity/import.ndjson')

function walk(node, visitor) {
  visitor(node)
  for (const child of node.childNodes ?? []) walk(child, visitor)
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value ?? ''
}

function setAttribute(node, name, value) {
  node.attrs ??= []
  const existing = node.attrs.find((item) => item.name === name)
  if (existing) existing.value = value
  else node.attrs.push({ name, value })
}

function removeAttribute(node, name) {
  if (node.attrs) node.attrs = node.attrs.filter((item) => item.name !== name)
}

function sanitizeHtml(html = '') {
  const fragment = parseFragment(html)

  function clean(node) {
    if (node.childNodes) {
      node.childNodes = node.childNodes.filter((child) => {
        if (!child.tagName) return true
        return !['script', 'noscript', 'form'].includes(child.tagName)
      })
      for (const child of node.childNodes) clean(child)
    }

    if (!node.tagName) return
    for (const attr of [...(node.attrs ?? [])]) {
      if (attr.name.startsWith('on')) removeAttribute(node, attr.name)
    }

    if (node.tagName === 'a') {
      const linkText = plainText(serialize(node))
      const href = attribute(node, 'href').trim()

      if (/^https?:\/\/command\s+academy\/?$/i.test(href)) {
        setAttribute(node, 'href', '/digital-academy')
      } else if (href === '#' && linkText === 'Digital Command') {
        setAttribute(node, 'href', '/')
      }

      if (/^https:\/\/(?:www\.)?digitalcommand\.co(?:\/|$)/.test(href)) {
        const url = new URL(href)
        setAttribute(node, 'href', `${url.pathname}${url.search}${url.hash}`)
      }
    }
  }

  clean(fragment)
  return serialize(fragment).trim()
}

function plainText(html = '') {
  const fragment = parseFragment(html)
  let value = ''
  walk(fragment, (node) => {
    if (node.nodeName === '#text') value += node.value
  })
  return value.replace(/\s+/g, ' ').trim()
}

function sitePath(link) {
  const pathname = new URL(link).pathname.replace(/\/+$/, '')
  return pathname || '/'
}

function documentId(type, id) {
  return `wordpress.${type}.${id}`
}

const pageFiles = (await readdir(pageDirectory)).filter((name) => name.endsWith('.json')).sort()
const postFiles = (await readdir(postDirectory)).filter((name) => name.endsWith('.json')).sort()
const documents = []
const authors = new Map()
const categories = new Map()

for (const file of pageFiles) {
  const page = JSON.parse(await readFile(resolve(pageDirectory, file), 'utf8'))
  documents.push({
    _id: documentId('page', page.id),
    _type: 'marketingPage',
    title: plainText(page.title),
    path: sitePath(page.link),
    wordpressId: page.id,
    sourceUrl: page.link,
    legacyTemplate: page.template || undefined,
    legacyHtml: sanitizeHtml(page.content),
  })
}

for (const file of postFiles) {
  const record = JSON.parse(await readFile(resolve(postDirectory, file), 'utf8'))
  const post = record.post

  if (record.author) authors.set(record.author.id, record.author)
  for (const category of record.terms?.category ?? []) categories.set(category.id, category)

  documents.push({
    _id: documentId('post', post.id),
    _type: 'post',
    title: plainText(post.title?.rendered),
    path: sitePath(post.link),
    wordpressId: post.id,
    sourceUrl: post.link,
    publishedAt: post.date_gmt ? `${post.date_gmt}Z` : post.date,
    author: record.author
      ? { _type: 'reference', _ref: documentId('author', record.author.id) }
      : undefined,
    categories: (record.terms?.category ?? []).map((category) => ({
      _type: 'reference',
      _key: String(category.id),
      _ref: documentId('category', category.id),
    })),
    excerpt: plainText(post.excerpt?.rendered),
    legacyFeaturedImageUrl: record.thumbnail?.source_url || undefined,
    legacyHtml: sanitizeHtml(post.content?.rendered),
  })
}

for (const author of [...authors.values()].sort((a, b) => a.id - b.id)) {
  documents.unshift({
    _id: documentId('author', author.id),
    _type: 'author',
    name: author.name,
    wordpressId: author.id,
  })
}

for (const category of [...categories.values()].sort((a, b) => a.id - b.id)) {
  documents.unshift({
    _id: documentId('category', category.id),
    _type: 'category',
    title: category.name,
    path: `/category/${category.slug}`,
    wordpressId: category.id,
  })
}

await writeFile(output, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`, 'utf8')

const counts = Object.groupBy(documents, (document) => document._type)
for (const [type, items] of Object.entries(counts)) {
  process.stdout.write(`${type}: ${items.length}\n`)
}
