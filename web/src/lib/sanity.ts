import { sanityClient } from 'sanity:client'
import {
  POSTS_QUERY,
  ROUTABLE_CONTENT_BY_PATH_QUERY,
  ROUTABLE_CONTENT_PATHS_QUERY,
} from './queries'

export const CORE_PAGE_PATHS = [
  '/',
  '/solutions',
  '/launchpad',
  '/consulting',
  '/get-navi',
  '/change-management',
  '/expert-network',
  '/digital-training',
  '/resources',
  '/events',
  '/webinars',
  '/blog',
  '/digital-academy',
  '/fellowship',
  '/about-us',
  '/our-story',
  '/faq',
  '/contact',
  '/230k-by-2030',
  '/404',
] as const

export function normalizeSitePath(path = '') {
  const trimmed = path.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}` : '/'
}

export function isCorePagePath(path: string) {
  return CORE_PAGE_PATHS.includes(normalizeSitePath(path) as (typeof CORE_PAGE_PATHS)[number])
}

export function paramFromSitePath(path: string) {
  return normalizeSitePath(path).replace(/^\//, '')
}

export function getRoutableContentByPath(path: string) {
  return sanityClient.fetch(ROUTABLE_CONTENT_BY_PATH_QUERY, {
    path: normalizeSitePath(path),
    corePaths: [...CORE_PAGE_PATHS],
  })
}

export function getPosts() {
  return sanityClient.fetch(POSTS_QUERY)
}

export function getRoutableContentPaths() {
  return sanityClient.fetch(ROUTABLE_CONTENT_PATHS_QUERY, { corePaths: [...CORE_PAGE_PATHS] })
}
