import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const origin = new URL(process.argv[2] || 'http://127.0.0.1:4322/')
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const userDataDirectory = await mkdtemp(join(tmpdir(), 'digital-command-browser-'))
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=0',
  `--user-data-dir=${userDataDirectory}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--window-size=1440,1000',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] })

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function devtoolsUrl() {
  return new Promise((resolve, reject) => {
    let buffer = ''
    const timer = setTimeout(() => reject(new Error('Chrome did not expose a DevTools endpoint')), 15_000)

    chrome.once('error', reject)
    chrome.stderr.on('data', (chunk) => {
      buffer += chunk.toString()
      const match = buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/)
      if (!match) return
      clearTimeout(timer)
      resolve(match[1])
    })
  })
}

let nextId = 0
const pending = new Map()
let socket

function send(method, params = {}, sessionId) {
  const id = ++nextId
  socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function evaluate(sessionId, expression) {
  const response = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, sessionId)

  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text)
  }
  return response.result.value
}

async function navigate(sessionId, path) {
  const url = new URL(path, origin).toString()
  await send('Page.navigate', { url }, sessionId)

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate(sessionId, 'document.readyState')
    if (ready === 'complete') break
    await delay(100)
  }
  await delay(500)
}

const results = []
function record(name, detail, passed = true) {
  results.push({ name, passed, detail })
  if (!passed) process.exitCode = 1
}

try {
  socket = new WebSocket(await devtoolsUrl())
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (!message.id || !pending.has(message.id)) return
    const request = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
  })

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)

  await navigate(sessionId, '/')
  const lightboxOpened = await evaluate(sessionId, `(() => {
    const trigger = document.querySelector('a[href*="elementor-action"]')
    trigger?.click()
    const modal = document.querySelector('.dc-video-lightbox')
    const frame = modal?.querySelector('iframe')
    return Boolean(trigger && modal && !modal.hidden && frame?.src.includes('autoplay=1'))
  })()`)
  record('Video lightbox opens', 'Elementor video action decoded into an autoplay embed', lightboxOpened)

  const lightboxClosed = await evaluate(sessionId, `(() => {
    document.querySelector('.dc-video-lightbox__close')?.click()
    const modal = document.querySelector('.dc-video-lightbox')
    return Boolean(modal?.hidden && !document.body.classList.contains('dc-lightbox-open'))
  })()`)
  record('Video lightbox closes', 'Close button restores the page state', lightboxClosed)

  const navigationStarted = await evaluate(sessionId, `(() => {
    const link = [...document.querySelectorAll('a[href]')].find((item) => new URL(item.href).pathname.replace(/\\/$/, '') === '/solutions')
    link?.click()
    return Boolean(link)
  })()`)
  await delay(700)
  const navigationPath = await evaluate(sessionId, 'window.location.pathname.replace(/\\/$/, \'\')')
  record('Core navigation works', navigationStarted ? `Navigated to ${navigationPath}` : 'Solutions link was not found', navigationStarted && navigationPath === '/solutions')

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  }, sessionId)
  await navigate(sessionId, '/')
  const mobileMenu = await evaluate(sessionId, `(() => {
    const toggle = document.querySelector('.elementor-menu-toggle')
    toggle?.click()
    const widget = toggle?.closest('.elementor-widget-nav-menu')
    const dropdown = widget?.querySelector('.elementor-nav-menu--dropdown')
    return {
      found: Boolean(toggle && dropdown),
      expanded: toggle?.getAttribute('aria-expanded'),
      visible: dropdown?.classList.contains('elementor-active'),
    }
  })()`)
  record('Mobile menu toggles', JSON.stringify(mobileMenu), mobileMenu.found && mobileMenu.expanded === 'true' && mobileMenu.visible)

  await send('Emulation.clearDeviceMetricsOverride', {}, sessionId)
  await navigate(sessionId, '/faq/')
  const accordion = await evaluate(sessionId, `(() => {
    const toggles = [...document.querySelectorAll('.ekit-accordion--toggler[data-target], .dc-faq-question')]
    const toggle = toggles.find((item) => item.getAttribute('aria-expanded') !== 'true') || toggles[0]
    toggle?.click()
    const target = toggle?.getAttribute('data-target') || (toggle?.getAttribute('aria-controls') ? '#' + toggle.getAttribute('aria-controls') : '')
    const panel = target ? document.querySelector(target) : null
    return {
      found: Boolean(toggle && panel),
      expanded: toggle?.getAttribute('aria-expanded'),
      visible: panel ? !panel.hidden && (panel.classList.contains('show') || panel.classList.contains('dc-faq-answer')) : false,
    }
  })()`)
  record('FAQ accordion toggles', JSON.stringify(accordion), accordion.found && accordion.expanded === 'true' && accordion.visible)

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  }, sessionId)
  await navigate(sessionId, '/')
  const carousel = await evaluate(sessionId, `(() => {
    const viewport = [...document.querySelectorAll('.dc-carousel-ready')]
      .find((item) => item.querySelectorAll(':scope > .swiper-wrapper > .swiper-slide').length > 1)
    if (!viewport) return { found: false }
    viewport.dispatchEvent(new Event('mouseenter'))
    const track = viewport.querySelector(':scope > .swiper-wrapper')
    const before = track?.style.transform
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
    return { found: true, before, after: track?.style.transform }
  })()`)
  record('Carousel advances', JSON.stringify(carousel), carousel.found && carousel.before !== carousel.after)

  await navigate(sessionId, '/contact/')
  const previewForm = await evaluate(sessionId, `(() => {
    const form = document.querySelector('[data-static-form]')
    if (!form) return { found: false }
    const allowed = form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    return { found: true, prevented: !allowed, message: form.querySelector('.dc-form-status')?.textContent }
  })()`)
  record(
    'Preview form is safely handled',
    JSON.stringify(previewForm),
    previewForm.found && previewForm.prevented && previewForm.message?.includes('not connected'),
  )

  console.log(`Browser interaction audit: ${origin}`)
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'}  ${result.name} — ${result.detail}`)
  }
} finally {
  socket?.close()
  chrome.kill('SIGTERM')
  if (chrome.exitCode === null) {
    await Promise.race([
      new Promise((resolve) => chrome.once('exit', resolve)),
      delay(3_000),
    ])
  }
  await rm(userDataDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}
