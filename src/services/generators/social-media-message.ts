import dotenv from 'dotenv'
dotenv.config()

import { PromiseResponse } from '../../types'
import { PromptChatResponse } from '../../types/openai'
import { axiosPostJsonData, creditsService, messagesService, MessageType } from '../../services'

const ReqContentType = {
	facebook: 'Facebook Post',
	instagram: 'Instagram Post',
	linkedin: 'LinkedIn Post',
	twitter: 'Twitter Post',
	metadescription: 'Meta description',
}

export default async (
	pageContent: string,
	type: string,
	amount: string,
	audience: string,
	user_id: string
): Promise<PromiseResponse> => {
	const startDate = new Date().getTime()
	return new Promise(async (resolve, reject) => {
		const typeAmount = amount ? parseInt(amount, 0) : 1

		if (!pageContent || !type || !typeAmount)
			return new Error('Missing parameters')

		if (!pageContent || !type) {
			return reject({
				statusCode: 400,
				body: JSON.stringify({
					error: 'Missing parameters',
				}),
			})
		}

		const contentType = ReqContentType[type as keyof typeof ReqContentType]

		let maxCharacters = 0

		switch (type) {
			case 'facebook':
				maxCharacters = 5000
				break
			case 'instagram':
				maxCharacters = 2200
				break
			case 'linkedin':
				maxCharacters = 3000
				break
			case 'twitter':
				maxCharacters = 280
				break
			case 'metadescription':
				maxCharacters = 160
				break
		}
		
		const reqInput = {
			// model: 'text-davinci-003',
			model: 'gpt-3.5-turbo',
			// messages: [{role: 'user', content: prompt}],
			messages: [
				{ role: 'system', content: 'Act like a marketeer. I want you to write a social media message based on source content. I want you to generate the 1 message for a specific platform with a maximum length per message. Include a few hastags if possible. I want you to write the messages in the style that appeals the type of audience. Only give me the message, no descriptions, titles or introductions or anything else.' },
				{ role: 'assistant', content: 'Give me the source content.' },
				{ role: 'user', content: `${pageContent}` },
				{ role: 'assistant', content: 'What is the maximum length per message?' },
				{ role: 'user', content: `${maxCharacters} characters` },
				{ role: 'assistant', content: 'How many messages do I need to generate?' },
				{ role: 'user', content: `1 message` },
				{ role: 'assistant', content: 'For what platform are the messages?' },
				{ role: 'user', content: `${type}` },
				{ role: 'assistant', content: 'What is the audience for the message?' },
				{ role: 'user', content: `${audience}` },
			],
			// temperature: 0.9,
			// max_tokens: 500,
		}
		console.log('reqInput: ', reqInput)

		const reqHeaders = {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${ process.env.OPENAI_API_KEY }`,
				'OpenAI-Organization': 'org-qLG0OeNVKWx44kfXfn8N1QQY',
			},
		}

		try {
			const data = await axiosPostJsonData<PromptChatResponse>(
				'https://api.openai.com/v1/chat/completions',
				reqInput,
				reqHeaders
			)

			console.log('data: ', data)
			const basePrice = 0.002 / 1000
			const costs = data?.usage?.total_tokens * basePrice
			const responseText = data?.choices
				.map((choice) => choice?.message?.content)
				.join('')
			// console.log({data, summaryData, request})
			const { data: messageDate, error } = await messagesService.saveGeneratedMessage(responseText, user_id, 1, 'generatorxyz', pageContent, MessageType.DEFAULT)
			console.log({ messageDate, error })
			await creditsService.updateCreditsUser(user_id, 1, 'subtract')
			const endDate = new Date().getTime()
			resolve({
				statusCode: 200,
				body: {
					data,
					responseText,
					basePrice,
					costs,
					bodyContent: pageContent,
					time: endDate - startDate,
				},
			})
		} catch (error) {
			console.log('error: ', error)
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
