import axios from 'axios'
import * as cheerio from 'cheerio'
// import https from 'https'
import 'dotenv/config'

import { CheerioOutputHeadings, PromiseResponse } from '../../types'

export default async (pageUrl: string, withContent: boolean = false): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!pageUrl) {
			reject({ statusCode: 400, body: { error: 'No URL provided' } })
		}

		const CANT_REACH_URL = `It looks like the URL is not a valid UR, or we can\'t reach the website because of unknown reasons. Please check the website in your browser. If the error works, send an email to info@generatorxyz.com with the URL so we can investigate it.`

		let response = null
		try {
			response = await axios.get(pageUrl, {
				maxRedirects: 5,
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
				},
			})
		} catch (error) {
			reject({ statusCode: 500, body: { error: CANT_REACH_URL } })
		}

		try {
			const $ = cheerio.load(response?.data)

			const canonical = $('link[rel="canonical"]').attr('href') || null

			const twitter = {
				title:
					($('meta[name="twitter:title"]').attr('content') ??
						$('meta[property="twitter:title"]').attr('content')) ||
					null,
				description:
					($('meta[name="twitter:description"]').attr('content') ??
						$('meta[property="twitter:description"]').attr('content')) ||
					null,
				image:
					($('meta[name="twitter:image"]').attr('content') ??
						$('meta[property="twitter:image"]').attr('content')) ||
					null,
				card:
					($('meta[name="twitter:card"]').attr('content') ??
						$('meta[property="twitter:card"]').attr('content')) ||
					null,
			}

			const og = {
				title:
					($('meta[property="og:title"]').attr('content') ?? $('meta[name="og:title"]').attr('content')) ||
					null,
				description:
					($('meta[property="og:description"]').attr('content') ??
						$('meta[name="og:description"]').attr('content')) ||
					null,
				type:
					($('meta[property="og:type"]').attr('content') ?? $('meta[name="og:type"]').attr('content')) ||
					null,
				locale:
					($('meta[property="og:locale"]').attr('content') ?? $('meta[name="og:locale"]').attr('content')) ||
					null,
				site_name:
					($('meta[property="og:site_name"]').attr('content') ??
						$('meta[name="og:site_name"]').attr('content')) ||
					null,
				url: ($('meta[property="og:url"]').attr('content') ?? $('meta[name="og:url"]').attr('content')) || null,
				image: {
					src:
						($('meta[property="og:image"]').attr('content') ??
							$('meta[name="og:image"]').attr('content')) ||
						null,
					height:
						($('meta[property="og:image:height"]').attr('content') ??
							$('meta[name="og:image:height"]').attr('content')) ||
						null,
					width:
						($('meta[property="og:image:width"]').attr('content') ??
							$('meta[name="og:image:width"]').attr('content')) ||
						null,
					type:
						($('meta[property="og:image:type"]').attr('content') ??
							$('meta[name="og:image:type"]').attr('content')) ||
						null,
					url:
						($('meta[property="og:image:url"]').attr('content') ??
							$('meta[name="og:image:url"]').attr('content')) ||
						null,
				},
			}

			const manifest = $('link[rel="manifest"]').attr('href') || null

			const icon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || null

			const keywords =
				$('meta[property="og:keywords"]').attr('content') || $('meta[name="keywords"]').attr('content') || null

			const viewport = $('meta[name="viewport"]').attr('content') || null

			const headings = $('h1, h2, h3, h4, h5, h6')
			const images = Array.from($('img') ?? [])

			const headingsObj: CheerioOutputHeadings = {}

			headings.each((index, element) => {
				const heading = $(element).text()
				console.log('heading', heading)
				console.log('level', $(element).prop('tagName').toLowerCase() ?? $(element).prop('name').toLowerCase())
				const headingLevel = $(element).prop('tagName').toLowerCase() ?? $(element).prop('name').toLowerCase()
				if (!headingsObj[headingLevel]) {
					headingsObj[headingLevel] = [
						{
							text: heading,
						},
					]
				} else {
					headingsObj[headingLevel].push({
						text: heading,
					})
				}
			})

			// Sort object properties of headingsObj
			const sortedHeadingsObj: CheerioOutputHeadings = {}
			Object.keys(headingsObj)
				.sort()
				.forEach((key) => {
					sortedHeadingsObj[key] = headingsObj[key]
				})

			const bodyContent = withContent ? findMainContent($) : null

			console.log('bodyContent', bodyContent)

			resolve({
				statusCode: 200,
				body: {
					title: Array.from($('title')).map((title) => $(title).text()) || [],
					description:
						Array.from($('meta[name="description"]') ?? []).map((meta) => $(meta).attr('content')) || [],
					content: bodyContent,
					icon: icon || null,
					keywords: keywords || null,
					headings: sortedHeadingsObj || null,
					canonical: canonical || null,
					images:
						images.length > 0
							? images.map((image) => {
									return {
										src: $(image).attr('src'),
										alt: $(image).attr('alt'),
										width: $(image).attr('width'),
										height: $(image).attr('height'),
										async: $(image).attr('async'),
									}
							  })
							: undefined,
					twitter,
					og,
					manifest,
					viewport,
				},
			})
		} catch (error) {
			console.log(error)
			reject({
				statusCode: 500,
				body: {
					error,
				},
			})
		}
	})
}

function ifYoutubeUrl(url: string): boolean {
	const regex =
		/^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?youtu(?:\.be\/|be\.com\/watch\?v=|be\.com\/embed\/|be\.com\/v\/|be\.com\/playlist\?list=|be\.com\/.+\/.+\/.+\/.+\/.+\/.)([A-Za-z0-9_-]{11})(?:\S+)?/
	return regex.test(url)
}

function extractYouTubeVideoId(url: string): string | null {
	const regex =
		/^(?:(?:https?:)?\/\/)?(?:www\.)?youtu(?:\.be|be\.(?:com|googleapis\.com))\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)?((\w|-){11})(?:\S+)?$/
	const match = url.match(regex)
	return match ? match[1] : null
}

export interface FindMainContentObject {
	content: string | null
	message?: string
}

function findMainContent($: cheerio.CheerioAPI): FindMainContentObject | null {
	let content = null
	let foundValidContent = false
	const mainElement = $('main')
	console.log('mainElement: ', $('main').text())
	if (mainElement) {
		content = $(mainElement).text()
		foundValidContent = true
	}

	const articleElement = $('article')
	console.log('articleElement: ', $('article').text())
	if (articleElement) {
		content = $(articleElement).text()
		foundValidContent = true
	}

	const contentDump = $('h1, h2, h3, h4, h5, h6, p')
	console.log('contentDump: ', $('h1, h2, h3, h4, h5, h6, p').text())
	if (contentDump) {
		content = $(contentDump).text()
	}

	const response: FindMainContentObject = {
		content: content?.replaceAll('.', '.\n ') ?? null,
	}

	if (!foundValidContent) {
		response.message = 'No main or article element found'
	}


	// Fallback to the parent with the most 'p' tags
	return response
}
