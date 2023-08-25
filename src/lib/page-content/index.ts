import * as cheerio from 'cheerio'
import axios from 'axios';
import { PromiseResponse } from '../../types';

export default async (pageUrl: string): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!pageUrl) {
			reject({ statusCode: 400, body: { error: 'No URL provided' } })
		}

		const {data} = await axios.get(pageUrl)

		try {
			const $ = cheerio.load(data)

			const title =
				$('meta[property="og:title"]').attr('content') ||
				$('title').text() ||
				$('meta[name="title"]').attr('content')

			const description =
				$('meta[property="og:description"]').attr('content') ||
				$('meta[name="description"]').attr('content')
			
			console.log('description', description)

			const url = $('meta[property="og:url"]').attr('content')

			const site_name = $('meta[property="og:site_name"]').attr('content')

			const image =
				$('meta[property="og:image"]').attr('content') ||
				$('meta[property="og:image:url"]').attr('content')

			const icon =
				$('link[rel="icon"]').attr('href') ||
				$('link[rel="shortcut icon"]').attr('href')

			const keywords =
				$('meta[property="og:keywords"]').attr('content') ||
				$('meta[name="keywords"]').attr('content')

			// const bodyContent = $('h2, h3, p').text()
			// const pageContent = cleanContent(bodyContent)

			resolve({
				statusCode: 200,
				body: {
					title,
					description,
					url,
					site_name,
					image,
					icon,
					keywords,
					// pageContent,
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
