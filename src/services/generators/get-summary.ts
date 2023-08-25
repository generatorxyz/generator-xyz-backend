import dotenv from 'dotenv'
dotenv.config()

import { PromiseResponse } from '../../types'
import { PromptResponse } from '../../types/openai'
import { axiosPostJsonData, creditsService, sbWrapper, messagesService, MessageType } from '../../services'

const supabase = sbWrapper.client

export default async (
	url: string,
	user_id: string
): Promise<PromiseResponse> => {
	const startDate = new Date().getTime()
	return new Promise(async (resolve, reject) => {
		if (!url || !user_id)
			return reject({
				statusCode: 400,
				body: JSON.stringify({
					error: 'Missing parameters',
				}),
			})

		const prompt = `Make a summary from the following URL, write it like i'm in second grade: ${ url }`

		const reqInput = {
			model: 'text-davinci-003',
			prompt: prompt,
			temperature: 0.9,
			max_tokens: 500,
		}

		const reqHeaders = {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${ process.env.OPENAI_API_KEY }`,
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

			const { data: messageDate, error } = await messagesService.saveGeneratedMessage(responseText, user_id, 1, 'generatorxyz', null as null, MessageType.SUMMARY, url)
			console.log({ messageDate, error })

			await creditsService.updateCreditsUser(user_id, 1, 'subtract')
			const endDate = new Date().getTime()

			resolve({
				statusCode: 200,
				body: {
					data,
					responseText: formatResponseText(responseText),
					basePrice,
					costs,
					url,
					time: endDate - startDate,
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

export function formatResponseText(response: any): string {
	const positionLineBreak = response?.indexOf('\n')
	console.log('response', response)

	// regex for checking ? . ! and new lines
	// const regex = /([.?!])\s*(?=[A-Z])/g
	const regex = /[\?\.\!\n\r]/g
	const substr = response?.substring(0, 10).replaceAll(regex, '')
	console.log('substr', substr)
	const restStr = response?.substring(10)
	console.log('restStr', restStr)
	return `${ substr }${ restStr }`
}
