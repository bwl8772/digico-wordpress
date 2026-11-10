import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse, serializeOuter } from '../web/node_modules/parse5/dist/index.js'

const root = resolve(import.meta.dirname, '..')
const outputDirectory = resolve(root, 'web/src/content/core')

const pages = [
  { slug: 'home', path: '/', source: '.firecrawl/digitalcommand-home-raw.html' },
  { slug: 'solutions', path: '/solutions', source: '.firecrawl/core-solutions.html' },
  { slug: 'launchpad', path: '/launchpad', source: '.firecrawl/core-launchpad.html' },
  { slug: 'consulting', path: '/consulting', source: '.firecrawl/core-consulting.html' },
  { slug: 'get-navi', path: '/get-navi', source: '.firecrawl/core-get-navi.html' },
  { slug: 'change-management', path: '/change-management', source: '.firecrawl/core-change-management.html' },
  { slug: 'expert-network', path: '/expert-network', source: '.firecrawl/core-expert-network.html' },
  { slug: 'digital-training', path: '/digital-training', source: '.firecrawl/core-digital-training.html' },
  { slug: 'resources', path: '/resources', source: '.firecrawl/core-resources.html' },
  { slug: 'events', path: '/events', source: '.firecrawl/core-events.html' },
  { slug: 'webinars', path: '/webinars', source: '.firecrawl/core-webinars.html' },
  { slug: 'digital-academy', path: '/digital-academy', source: '.firecrawl/core-digital-academy.html' },
  { slug: 'fellowship', path: '/fellowship', source: '.firecrawl/core-fellowship.html' },
  { slug: 'about-us', path: '/about-us', source: '.firecrawl/core-about-us.html' },
  { slug: 'our-story', path: '/our-story', source: '.firecrawl/core-our-story.html' },
  { slug: 'faq', path: '/faq', source: '.firecrawl/core-faq.html' },
  { slug: 'contact', path: '/contact', source: '.firecrawl/core-contact.html' },
  { slug: '230k-by-2030', path: '/230k-by-2030', source: '.firecrawl/core-230k-by-2030.html' },
]

function walk(node, visit) {
  visit(node)
  for (const child of node.childNodes ?? []) walk(child, visit)
}

function findElement(rootNode, predicate) {
  let result
  walk(rootNode, (node) => {
    if (!result && node.tagName && predicate(node)) result = node
  })
  return result
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

function textContent(node) {
  let value = ''
  walk(node, (item) => {
    if (item.nodeName === '#text') value += item.value
  })
  return value.trim()
}

function shouldRemove(node) {
  if (!node.tagName) return false
  if (['script', 'noscript', 'iframe'].includes(node.tagName)) return true

  const marker = `${attribute(node, 'id')} ${attribute(node, 'class')}`.toLowerCase()
  return [
    'grecaptcha',
    'recaptcha',
    'chatbot',
    'fb_dialog',
    'facebook-jssdk',
    'the_champ_sharing_container',
  ].some((name) => marker.includes(name))
}

function cleanTree(node) {
  if (node.childNodes) {
    node.childNodes = node.childNodes.filter((child) => !shouldRemove(child))
    for (const child of node.childNodes) cleanTree(child)
  }

  if (!node.tagName) return

  for (const attr of [...(node.attrs ?? [])]) {
    if (attr.name.startsWith('on')) removeAttribute(node, attr.name)
  }

  if (node.tagName === 'a') {
    const target = attribute(node, 'data-target')
    if (target.startsWith('#')) setAttribute(node, 'href', target)

    const href = attribute(node, 'href')
    if (/^https:\/\/(?:www\.)?digitalcommand\.co(?:\/|$)/.test(href)) {
      const url = new URL(href)
      setAttribute(node, 'href', `${url.pathname}${url.search}${url.hash}`)
    }
  }

  if (node.tagName === 'img') {
    const dataSource = attribute(node, 'data-src')
    if (dataSource) setAttribute(node, 'src', dataSource)
    const dataSourceSet = attribute(node, 'data-srcset')
    if (dataSourceSet) setAttribute(node, 'srcset', dataSourceSet)
    removeAttribute(node, 'loading')
  }

  if (node.tagName === 'form') {
    setAttribute(node, 'action', '#')
    setAttribute(node, 'data-static-form', 'true')
  }

  if (attribute(node, 'class').includes('elementor-section-stretched')) {
    const style = attribute(node, 'style')
      .replace(/(?:^|\s)width:\s*[^;]+;?/gi, '')
      .replace(/(?:^|\s)left:\s*[^;]+;?/gi, '')
      .trim()
    if (style) setAttribute(node, 'style', style)
    else removeAttribute(node, 'style')
  }
}

function getHeadMarkup(head) {
  return (head.childNodes ?? [])
    .filter((node) => {
      if (node.tagName === 'style') return true
      if (node.tagName !== 'link') return false
      const rel = attribute(node, 'rel')
      const href = attribute(node, 'href')
      return ['stylesheet', 'preload'].includes(rel) && href.includes('digitalcommand.co')
    })
    .map((node) => serializeOuter(node))
    .join('\n')
}

async function importPage(page) {
  const raw = await readFile(resolve(root, page.source), 'utf8')
  const document = parse(raw)
  const html = findElement(document, (node) => node.tagName === 'html')
  const head = findElement(document, (node) => node.tagName === 'head')
  const body = findElement(document, (node) => node.tagName === 'body')
  const pageRoot = findElement(body, (node) => attribute(node, 'id') === 'page')

  if (!html || !head || !body || !pageRoot) {
    throw new Error(`Could not find the expected document shell in ${page.source}`)
  }

  const titleNode = findElement(head, (node) => node.tagName === 'title')
  const descriptionNode = findElement(
    head,
    (node) => node.tagName === 'meta' && attribute(node, 'name') === 'description',
  )
  const canonicalNode = findElement(
    head,
    (node) => node.tagName === 'link' && attribute(node, 'rel') === 'canonical',
  )

  cleanTree(pageRoot)

  const snapshot = {
    source: `https://digitalcommand.co${page.path === '/' ? '/' : `${page.path}/`}`,
    path: page.path,
    lang: attribute(html, 'lang') || 'en-US',
    title: titleNode ? textContent(titleNode) : 'Digital Command',
    description: descriptionNode ? attribute(descriptionNode, 'content') : '',
    canonical: canonicalNode ? attribute(canonicalNode, 'href') : '',
    bodyClass: attribute(body, 'class'),
    head: getHeadMarkup(head),
    body: serializeOuter(pageRoot),
  }

  await writeFile(
    resolve(outputDirectory, `${page.slug}.json`),
    `${JSON.stringify(snapshot)}\n`,
    'utf8',
  )
}

await mkdir(outputDirectory, { recursive: true })
for (const page of pages) {
  await importPage(page)
  process.stdout.write(`Imported ${page.path}\n`)
}
