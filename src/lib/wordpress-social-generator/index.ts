import dotenv from 'dotenv'
dotenv.config()
import axios from 'axios'

import { PromiseResponse, PromptRequest } from '../../types'
import { PromptResponse } from '@/types/openai'

function getCompletion<T>(input: PromptRequest): Promise<T> {
	return axios.post('https://api.openai.com/v1/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			'OpenAI-Organization': 'org-qLG0OeNVKWx44kfXfn8N1QQY',
		},
		body: JSON.stringify(input),
	})
  }

const ReqContentType = {
	facebook: 'Facebook Post',
	instagram: 'Instagram Post',
	linkedin: 'LinkedIn Post',
	twitter: 'Twitter Post',
}

type ReqContentTypes = keyof typeof ReqContentType

export default async (
	pageContent: string,
	title: string,
	link: string,
	type: string,
	length: number,
	apiKey: string,
	userId: string
): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!pageContent || !type || !title || !link || !userId || !length)
			return {
				statusCode: 400,
				body: JSON.stringify({
					error: 'Missing parameters',
					props: {
						pageContent,
						title,
						type,
						length,
						userId,
					},
				}),
			}

		const contentType = ReqContentType[type as ReqContentTypes]
		const prompt = `I want you to act as a social media marketeer. You will be responsible for writing attractive social media messages. I will provide you with the source content, amount of messages, title, length and the platform to write the message for. I want you to write a compeling message that attract users to interact with it. I also want you to include the link in the message. Also include relevant hashtags. But don't let it exceeds the maximum length of a message on the platform. .
		
		${length ? `Length of messages: ${length}.` : ''}
		Platform: ${contentType}.
		${title ? `Title: ${title}.` : ''}
		${link ? `Link: ${link}.` : ''}
		Source content: ${pageContent}`

		console.log('prompt: ', {
			contentType,
			length,
			title,
			link,
			pageContent: pageContent.slice(0, 200),
		})

		await getCompletion<PromptResponse>({
			model: 'text-davinci-003',
			prompt: prompt,
			temperature: 0.8,
			max_tokens: 500,
		})
			.then((data) => {
				const basePrice = 0.02 / 1000
				const costs = data?.usage?.total_tokens * basePrice
				const responseText = data?.choices
					.map((choice) => choice.text)
					.join('')
				console.log('Response: ', { data })
				resolve({
					statusCode: 200,
					body: {
						data,
						responseText,
						basePrice,
						costs,
						bodyContent: pageContent,
						userId,
						apiKey,
					},
				})
			})
			.catch((error) => {
				reject({
					statusCode: 500,
					body: {
						error: 'Something went wrong',
						message: error,
					},
				})
			})
	})
}
