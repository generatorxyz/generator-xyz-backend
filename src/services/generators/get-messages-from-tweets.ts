import { getTweetTopics, tweetsByUsername } from './'
import axios from 'axios'
import { PromiseResponse } from '../../types'
import { axiosPostJsonData } from '../openai'
import { PromptChatResponse, PromptResponse } from '../../types/openai'

const ReqContentType = {
	facebook: 'Facebook Post',
	instagram: 'Instagram Post',
	linkedin: 'LinkedIn Post',
	twitter: 'Twitter Post',
	metadescription: 'Meta description',
}

enum Platform {
    facebook = 'facebook',
    instagram = 'instagram',
    linkedin = 'linkedin',
    twitter = 'twitter',
    metadescription = 'metadescription'
}

export default async (
	twitterApi: string,
	reqOptions: any,
	username: string,
	platform: keyof typeof Platform,
	style: string,
	amount: number
): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		try {
			const twitterData = await tweetsByUsername(twitterApi, reqOptions, username)
			const twitterTopics = await getTweetTopics(twitterApi, reqOptions, username)

			if (!twitterData?.body) {
				reject({
					statusCode: 400,
					body: {
						error: 'No tweets found',
					},
				})
			}

			let maxCharacters = 0

			switch (platform) {
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

			const topics = twitterTopics?.body?.topics
			const prompt = `Act like a marketeer. I want you to generate content based on a list of topics for a specific platform with a maximum length. The content I want you to generate is for a post on ${platform}. I want you to write ${amount} messages in the ${style} style. The maximum length of the generated content is ${maxCharacters} characters. 

            Topics: "${topics}"`

			console.log('prompt', prompt)

			const reqInput = {
				model: 'gpt-3.5-turbo',
				messages: [{ role: 'user', content: prompt }],
			}

			const reqHeaders = {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
					'OpenAI-Organization': 'org-qLG0OeNVKWx44kfXfn8N1QQY',
				},
			}

			const data = await axiosPostJsonData<PromptChatResponse>(
				'https://api.openai.com/v1/chat/completions',
				reqInput,
				reqHeaders
			)
            const responseText = data?.choices.map((choice) => choice?.message?.content).join('')
            
            const basePrice = 0.002 / 1000
            const totalTokens = data?.usage?.total_tokens + twitterTopics?.body?.usageTopics?.total_tokens
			const costs = totalTokens * basePrice


			resolve({
				statusCode: 200,
				body: {
                    messages: responseText,
                    usageMessages: data?.usage,
                    usageTotal: totalTokens,
                    costs,
                    ...twitterTopics?.body,
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
