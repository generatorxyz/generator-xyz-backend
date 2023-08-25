import { tweetsByUsername } from './';
import axios from 'axios';
import { PromiseResponse } from '../../types';
import { axiosPostJsonData } from '../openai';
import { PromptChatResponse, PromptResponse } from '../../types/openai';

export default async (twitterApi: string, reqOptions: any, username: string): Promise<PromiseResponse> => {
    return new Promise(async (resolve, reject) => {
        try {
            const twitterData = await tweetsByUsername(twitterApi, reqOptions, username)

            if (!twitterData?.body) {
                reject({
                    statusCode: 400,
                    body: {
                        error: 'No tweets found',
                    },
                })
            }

            const tweets = twitterData?.body?.map((tweet: any) => `${ tweet.text } \n\n `)

            const prompt = `Describe the topics of these tweets: ${ tweets.join('') }.`

            console.log('prompt', prompt)

            const reqInput = {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
            }

            const reqHeaders = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${ process.env.OPENAI_API_KEY }`,
                    'OpenAI-Organization': 'org-qLG0OeNVKWx44kfXfn8N1QQY',
                },
            }

            const data = await axiosPostJsonData<PromptChatResponse>(
				'https://api.openai.com/v1/chat/completions',
                reqInput,
                reqHeaders
            )
            const responseText = data?.choices
				.map((choice) => choice?.message?.content)
                .join('')
            
            resolve({
                statusCode: 200,
                body: {
                    topics: responseText,
                    usageTopics: data?.usage,
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
