import dotenv from 'dotenv'
dotenv.config()

import { PromiseResponse } from '../../types'
import { PromptChatResponse, PromptResponse } from '../../types/openai'
import { axiosPostJsonData, creditsService, sbWrapper, messagesService, MessageType } from '..'

const supabase = sbWrapper.client

export default async (
	pageTitle: string,
	url: string,
	user_id: string,
	keywords: string,
	pageDescription?: string,
	pageContent?: string
): Promise<PromiseResponse> => {
	const startDate = new Date().getTime()
	return new Promise(async (resolve, reject) => {
		if (!pageTitle || !user_id)
			return reject({
				statusCode: 400,
				body: JSON.stringify({
					error: 'Missing parameters',
				}),
			})

		const prompt = `Act like a marketeer and SEO expert. You are very good in writing content about any topic. I want you to generate 3 better titles, meta description and keywords for a page based on the current titel, meta description, wanted keywords, and possibily page content. 
		
		I want you to strictly keep in mind that the title and meta description has a max amount of characters. The title can be between 50 and max 60 characters. The meta description can be between 150 and max 160 characters. Take into account the audience which you can estimate based on the page content. Also tell me why these suggestions are better. 

		The formatting should be HTML, this is very important! It should be in a <ol> list with <li> items. The first item should be the current title, meta description, keywords and reason. The second item should be the second suggestion, the third item should be the third suggestion.
		
		 The HTML should be like this example:
		
		<ol>
			<li>
				<p>
					<strong>Title: </strong> The New Title. <em class="amount-characters">[amount of characters]</em>
				</p>
				<p>
					<strong>Meta description: </strong> The new meta description. <em class="amount-characters">[amount of characters]</em>
				</p>
				<p>
					<strong>Keywords: </strong> The keywords.
				</p>
				<p>
					<strong>Reason: </strong> Explain why this is better
				</p>
			</li>
		</ol>
		`

		console.log('prompt', prompt)

		const reqInput = {
			model: 'gpt-3.5-turbo',
			temperature: 0.6,
			messages: [
				{ role: 'system', content: prompt },
				{ role: 'assistant', content: 'Give me the current title.' },
				{ role: 'user', content: `${pageTitle}` },
				{ role: 'assistant', content: 'Give me the meta description.' },
				{ role: 'user', content: `${pageDescription ?? 'The meta description could not be found'}` },
				{ role: 'assistant', content: 'Give me the page content.' },
				{ role: 'user', content: `${pageContent ?? 'No content found'}` },
				{ role: 'assistant', content: 'Give me the wanted keywords if you want me to use it.' },
				{ role: 'user', content: keywords },
			],
		}

		const reqHeaders = {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				'OpenAI-Organization': 'org-qLG0OeNVKWx44kfXfn8N1QQY',
			},
		}

		try {
			const data = await axiosPostJsonData<PromptChatResponse>(
				'https://api.openai.com/v1/chat/completions',
				reqInput,
				reqHeaders
			)

			const responseText = data?.choices.map((choice) => choice?.message.content).join('')
			const substringWithOnlyOl = responseText?.substring(responseText?.indexOf('<ol>'))
			console.log('seo improvements: ', responseText.substring(0, 300))

			const { data: messageDate, error } = await messagesService.saveGeneratedMessage(
				substringWithOnlyOl,
				user_id,
				1,
				'generatorxyz',
				null as null,
				MessageType.SEO,
				url
			)
			console.log({ messageDate, error })

			await creditsService.updateCreditsUser(user_id, 1, 'subtract')
			const endDate = new Date().getTime()

			resolve({
				statusCode: 200,
				body: {
					data,
					responseText: substringWithOnlyOl,
					url,
					pageTitle,
					pageDescription,
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
	return `${substr}${restStr}`
}
