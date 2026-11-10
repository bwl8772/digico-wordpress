import { parse } from '../web/node_modules/parse5/dist/index.js'

const base = new URL(process.argv[2] || 'http://127.0.0.1:4322/')
const pending = [base]
const visited = new Set()
const results = []
const brokenFragments = []
const inertLinks = []
const elementorActions = []
const productionLinks = []
let formCount = 0
let buttonCount = 0

function walk(node, visit) {
  visit(node)
  for (const child of node.childNodes ?? []) walk(child, visit)
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value ?? ''
}

function textContent(node) {
  let value = ''
  walk(node, (item) => {
    if (item.nodeName === '#text') value += item.value
  })
  return value.replace(/\s+/g, ' ').trim()
}

function isAnchorControl(node) {
  const className = `${attribute(node, 'class')} ${attribute(node.parentNode, 'class')}`
  return (
    attribute(node, 'role') === 'button' ||
    (!attribute(node, 'href') && attribute(node, 'tabindex') === '0') ||
    attribute(node, 'data-target').startsWith('#') ||
    /(?:elementor-accordion-title|elementor-toggle-title|sub-arrow)/.test(className)
  )
}

function pageKey(url) {
  const normalized = new URL(url)
  normalized.hash = ''
  if (normalized.pathname !== '/') normalized.pathname = normalized.pathname.replace(/\/+$/, '')
  return normalized.toString()
}

function isLocal(url) {
  return url.origin === base.origin
}

while (pending.length) {
  const current = pending.shift()
  const key = pageKey(current)
  if (visited.has(key)) continue
  visited.add(key)

  let response
  try {
    response = await fetch(key, { redirect: 'follow' })
  } catch (error) {
    results.push({ url: key, status: 'FETCH_ERROR', detail: error.message })
    continue
  }

  const contentType = response.headers.get('content-type') || ''
  const resolvedKey = pageKey(response.url)
  results.push({ url: key, resolvedUrl: resolvedKey, status: response.status, contentType })
  if (!response.ok || !contentType.includes('text/html')) continue

  if (resolvedKey !== key && visited.has(resolvedKey)) continue
  visited.add(resolvedKey)

  const document = parse(await response.text())
  const ids = new Set()
  const anchors = []

  walk(document, (node) => {
    const id = attribute(node, 'id')
    if (id) ids.add(id)

    if (node.tagName === 'form') formCount += 1
    if (node.tagName === 'button') buttonCount += 1
    if (node.tagName === 'a') anchors.push(node)
  })

  for (const anchor of anchors) {
    const href = attribute(anchor, 'href').trim()
    if (!href || href === '#' || href.startsWith('javascript:')) {
      if (!isAnchorControl(anchor)) {
        inertLinks.push({ page: resolvedKey, href: href || '(missing)', text: textContent(anchor) })
      }
      continue
    }

    if (/^(mailto:|tel:|sms:)/i.test(href)) continue

    let target
    try {
      target = new URL(href, resolvedKey)
    } catch {
      inertLinks.push({ page: resolvedKey, href, text: textContent(anchor) })
      continue
    }

    if (decodeURIComponent(target.hash.slice(1)).startsWith('elementor-action:')) {
      elementorActions.push({ page: resolvedKey, href })
      continue
    }

    if (/^(?:www\.)?digitalcommand\.co$/i.test(target.hostname)) {
      productionLinks.push({ page: resolvedKey, href })
    }

    if (!isLocal(target)) continue

    if (target.hash && target.pathname === new URL(resolvedKey).pathname) {
      const fragment = decodeURIComponent(target.hash.slice(1))
      if (fragment && !ids.has(fragment)) brokenFragments.push({ page: resolvedKey, href })
    }

    target.hash = ''
    if (!visited.has(pageKey(target))) pending.push(target)
  }
}

const brokenPages = results.filter(
  ({ status }) => status === 'FETCH_ERROR' || (typeof status === 'number' && status >= 400),
)

console.log(`Base: ${base}`)
console.log(`HTML/routes checked: ${results.length}`)
console.log(`Buttons found: ${buttonCount}`)
console.log(`Forms found: ${formCount}`)
console.log(`Elementor actions found: ${elementorActions.length}`)
console.log(`Broken routes: ${brokenPages.length}`)
console.log(`Broken same-page fragments: ${brokenFragments.length}`)
console.log(`Inert links: ${inertLinks.length}`)
console.log(`Production-domain links from local pages: ${productionLinks.length}`)

for (const [label, items] of [
  ['BROKEN ROUTES', brokenPages],
  ['BROKEN FRAGMENTS', brokenFragments],
  ['INERT LINKS', inertLinks],
  ['ELEMENTOR ACTIONS', elementorActions],
  ['PRODUCTION LINKS', productionLinks],
]) {
  if (!items.length) continue
  console.log(`\n${label}`)
  for (const item of items) console.log(JSON.stringify(item))
}

if (brokenPages.length || brokenFragments.length || inertLinks.length || productionLinks.length) {
  process.exitCode = 1
}
