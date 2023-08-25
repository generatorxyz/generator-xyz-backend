import { extract } from '@extractus/feed-extractor'
import https from 'https'
import {
	getPageContent,
	getSocialMediaMessage,
	getSummary,
	getWpSocialMediaMessage,
	getSeoSuggestions,
	getSeoReport,
} from '../../services/generators'

import cors from 'cors'
import express, { Request, Response } from 'express'
import { creditsService, sbWrapper } from '../../services'
import TwitterRoutes from './twitter-analyser'
import { validateSeoContent } from './seo-check'
import { SeoAuditInput } from './seo-check/types'

const router = express.Router()

const supabase = sbWrapper.getClient()

router.post('/summarize', cors(), async (req: any, res: any) => {
	const { id, url } = req.body

	console.log('summarize', { id, url })

	if (!id) {
		res.status(400).send({ error: 'No user id or URL provided' })
	}

	getSummary(url, id)
		.then((response) => {
			res.status(response?.statusCode).send({ ...response?.body })
		})
		.catch((error) => {
			console.log('error', error)
			res.status(500).send(error)
		})
})

router.post('/seo-suggestions', cors(), async (req: any, res: any) => {
	const { id, url, keywords } = req.body

	console.log('body', { url })
	const CANT_REACH_URL = `It looks like the URL is not a valid UR, or we can\'t reach the website because of unknown reasons. Please check the website in your browser. If the error works, send an email to info@generatorxyz.com with the URL so we can investigate it.`

	if (!url) {
		res.status(400).send({ error: 'No URL provided' })
	}
	try {
		console.log('checking url')
		await checkWebsite(`${url}`)
		console.log('checking url done')
	} catch (error) {
		return res.status(500).send({
			error: CANT_REACH_URL,
		})
	}
	console.log('url is checked!')
	try {
		const {
			body: { title, description, content },
		} = await getPageContent(`${url}`)
		console.log('summarize', { title, id, description })

		if (!id) {
			res.status(400).send({ error: 'No user id or URL provided' })
		}

		getSeoSuggestions(title, url, id, keywords, description, content)
			.then((response) => {
				res.status(response?.statusCode).send({ ...response?.body })
			})
			.catch((error) => {
				console.log('error', error)
				res.status(500).send(error)
			})
	} catch (error) {
		console.log('error', error)
		res.status(500).send({
			error,
		})
	}
})

router.post('/seo-content-test', cors(), async (req: any, res: any) => {
	const { id, url } = req.body

	console.log('SEO content test', { id, url })

	if (!id || !url) {
		res.status(400).send({ error: 'No user id or URL provided' })
	}

	const {
		body: { title, description, content, url: urlFromPage, headings, images, twitter, og, manifest,viewport },
	} = await getPageContent(`${url}`, true)

	const slug = getSlug(url)

	const seoTest = validateSeoContent({
		title,
		description,
		slug,
		content,
		headings,
		images,
		twitter,
		og,
		manifest,
		viewport,
	} as SeoAuditInput)

	const seoTestKeys = Object.keys(seoTest)

	res.status(200).send({
		data: {
			seoKeys: seoTestKeys,
			seo: seoTest,
		},
	})
})

function getSlug(url: string): string {
	console.log('getSlug', { url })
	const path = new URL(url).pathname
	const segments = path.split('/')
	const slug = segments[segments.length - 1] === '' ? segments[segments.length - 2] : segments[segments.length - 1]
	return slug
}

router.post('/seo-report', cors(), async (req: any, res: any) => {
	const { id, url } = req.body

	console.log('body', { url })
	const CANT_REACH_URL = `It looks like the URL is not a valid UR, or we can\'t reach the website because of unknown reasons. Please check the website in your browser. If the error works, send an email to info@generatorxyz.com with the URL so we can investigate it.`

	if (!url) {
		res.status(400).send({ error: 'No URL provided' })
	}
	try {
		console.log('checking url')
		await checkWebsite(`${url}`)
		console.log('checking url done')
	} catch (error) {
		return res.status(500).send({
			error: CANT_REACH_URL,
		})
	}
	console.log('url is checked!')
	try {
		const {
			body: { title, description, content },
		} = await getPageContent(`${url}`)
		console.log('summarize', { title, id, description })

		if (!id) {
			res.status(400).send({ error: 'No user id or URL provided' })
		}

		getSeoReport(title, url, id, description, content)
			.then((response) => {
				res.status(response?.statusCode).send({ ...response?.body })
			})
			.catch((error) => {
				console.log('error', error)
				res.status(500).send(error)
			})
	} catch (error) {
		console.log('error', error)
		res.status(500).send({
			error,
		})
	}
})

router.post('/fetch-rss', cors(), async (req: any, res: any) => {
	const { id, url } = req.body

	console.log('RSS', { id, url })

	if (!id) {
		res.status(400).send({ error: 'No user id or URL provided' })
	}

	const result = await extract(url)
	console.log(result)

	// getSummary(url, id)
	//     .then((response) => {
	res.status(200).send({ message: 'Hello', result })
	// })
	// .catch((error) => {
	//     console.log('error', error)
	//     res.status(500).send(error)
	// })
})

router.post('/social-generator', cors(), async (req: Request, res: Response) => {
	const { content, type, amount, audience, supabaseUserId } = req.body
	console.log('body', req.body)

	try {
		const data = await getSocialMediaMessage(content, type, amount, audience, supabaseUserId)

		if (data?.statusCode === 200) {
			console.log('response', data)

			res.status(data?.statusCode).send({
				body: data?.body,
			})
		} else {
			res.status(data?.statusCode).send({
				body: data,
			})
		}
	} catch (error) {
		res.status(500).send(error)
	}
})

router.post('/social-wp-generator', cors(), async (req: Request, res: Response) => {
	const { content, title, link, type, amount, length, user_id, api_key } = req.body
	let trimmedContent = content
	console.log('body', {
		content: content.slice(0, 200),
		title,
		link,
		type,
		amount,
		length,
		user_id,
		api_key,
	})
	if (!user_id || !api_key) {
		return res.status(401).send({
			body: {
				message: 'Invalid User Or API key',
			},
		})
	}

	const { data: profile, error: profileErro } = await supabase.from('profiles').select('*').eq('id', user_id).single()

	console.log('username: ', profile)
	if (profileErro || profile?.api_key !== api_key) {
		return res.status(401).send({
			body: {
				message: 'Invalid User Or API key',
			},
		})
	}
	const { data: credits } = await creditsService.getCreditsUser(user_id)

	const creditsCost = creditsService.costOfCredits(content)
	if (content.length > 7500 || !creditsCost) {
		trimmedContent = content.slice(0, 7500)
	}
	if (credits?.amount <= 0 && creditsCost && creditsCost?.credit > credits?.amount) {
		return res.status(401).send({
			body: {
				message: 'Insufficient credits',
			},
		})
	}

	try {
		const data = await getWpSocialMediaMessage(trimmedContent, title, link, type, length, api_key, user_id)

		// pageContent, title, type, length, api_key, userId
		if (data?.statusCode === 200) {
			console.log('response', data?.body)
			res.status(data?.statusCode).send({
				body: { ...data?.body, creditsCost },
			})

			const { data: msgData, error } = await supabase.from('messages').insert({
				message: data?.body?.responseText,
				cost: data?.body?.cost,
				user_id: user_id ?? null,
				api_key,
			})

			if (msgData) {
				console.log('message is saved: ', msgData)
			} else {
				console.log('Message not saved: ', error)
			}
		} else {
			res.status(data?.statusCode).send({
				body: data,
			})
		}
	} catch (error) {
		res.status(500).send(error)
	}
})

router.get('/page-content', cors(), async (req: Request, res: Response) => {
	const { url } = req.query

	console.log('query', { url })
	const CANT_REACH_URL = `It looks like the URL is not a valid UR, or we can\'t reach the website because of unknown reasons. Please check the website in your browser. If the error works, send an email to info@generatorxyz.com with the URL so we can investigate it.`

	console.log('url', url)

	if (!url) {
		res.status(400).send({ error: 'No URL provided' })
	}
	try {
		console.log('checking url')
		await checkWebsite(`${url}`)
		console.log('checking url done')
	} catch (error) {
		return res.status(500).send({
			error: CANT_REACH_URL,
		})
	}
	console.log('url is checked!')
	try {
		const { statusCode, body } = await getPageContent(`${url}`, true)
		console.log({ body })

		res.status(statusCode).send({
			body: body,
		})
	} catch (error) {
		console.log('error', error)
		res.status(500).send({
			error,
		})
	}
})

router.use('/', TwitterRoutes)

function checkWebsite(url: string) {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				resolve(res.statusCode === 200)
			})
			.on('error', function (e) {
				reject(false)
			})
	})
}

export default router
