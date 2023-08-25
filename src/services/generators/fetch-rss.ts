import dotenv from 'dotenv'
dotenv.config()

import { PromiseResponse } from '../../types'
import { PromptResponse } from '../../types/openai'
import { axiosPostJsonData } from '../../services'

export default async (
    url: string,
    user_id: string
): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!url || !user_id)
			return reject({
				statusCode: 400,
				body: JSON.stringify({
					error: 'Missing parameters',
				}),
			})

		const prompt = `Act like a marketeer. Summarize the content in a promotional way: ${url}`

		const reqInput = {
			model: 'text-curie-001',
			prompt: prompt,
			temperature: 0.9,
			max_tokens: 500,
		}

		const reqHeaders = {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				'OpenAI-Organization': 'org-qLG0OeNVKWx44kfXfn8N1QQY',
			},
		}

		try {
			const data = await axiosPostJsonData<PromptResponse>(
				'https://api.openai.com/v1/completions',
				reqInput,
				reqHeaders
			)

			console.log('summary: ', data)
			const basePrice = 0.002 / 1000
			const costs = data?.usage?.total_tokens * basePrice
			const responseText = data?.choices
				.map((choice) => choice.text)
				.join('')

            resolve({
				statusCode: 200,
				body: {
					data,
					responseText,
					basePrice,
					costs,
					url
				},
			})
		} catch (error) {
			reject({
				statusCode: 500,
				body: {
					error: 'Something went wrong',
					message: error,
				},
			})
		}
	})
}
