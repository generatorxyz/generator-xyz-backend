import cors from 'cors';
import express from 'express';
import axios from 'axios';
import { extract } from '@extractus/feed-extractor'

import { getMessagesFromTweets, getTweetTopics, tweetsByUsername } from '../../../services/generators';
import { axiosPostJsonData } from '../../../services';
import { PromptChatResponse, PromptResponse } from '../../../types/openai';

// const client = new TwitterApi(`${ process.env.TWITTER_API_KEY }`);


const router = express.Router()
const twitterApi = 'https://api.twitter.com/2'
const reqOptions = {
    headers: {
        Authorization: `Bearer ${ process.env.TWITTER_BEARER }`
    }
}

router.get('/tweets-by-username', cors(), async (req: any, res: any) => {
    const { username } = req.query

    const data = await tweetsByUsername(twitterApi, reqOptions, username)

    console.log('data', data)

    res.status(data?.statusCode).send(data?.body)
})

router.post('/twitter-analyser', cors(), async (req: any, res: any) => {
    const { username } = req.body

    if (!username) {
        res.status(400).send({ error: 'No username provided' })
    }

    try {
        const twitterData = await getTweetTopics(twitterApi, reqOptions, username)

        res.status(200).send({
            ...twitterData?.body
        })

    } catch (error) {
        console.log('error', error)
    }
})
router.post('/recommend-tweets', cors(), async (req: any, res: any) => {
    const { username } = req.body

    if (!username) {
        res.status(400).send({ error: 'No username provided' })
    }

    try {
        const twitterData = await getMessagesFromTweets(twitterApi, reqOptions, username, 'twitter', 'friendly', 3)

        res.status(200).send({
            messages: twitterData,
        })

    } catch (error) {
        console.log('error', error)
    }
})

router.post('/rss-analyser', cors(), async (req: any, res: any) => {
    const { url } = req.body

    if (!url) {
        res.status(400).send({ error: 'No url provided' })
    }

    const result = await extract(url)
    console.log(result)

    let entries = null;
    if (!result?.entries) {
        res.status(400).send({ error: 'No entries found' })
        return
    } else {
        entries = [...result?.entries.map((item: any) => `${ item.title }: ${ item.description }`)].slice(0, 10)
    }

    const prompt = `Give me the topics of these RSS feed items: ${ entries.join('') }. Return the topics as a valid JSON array of strings.`

    // console.log('prompt', prompt)

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

    try {

        const data = await axiosPostJsonData<PromptChatResponse>(
            'https://api.openai.com/v1/chat/completions',
            reqInput,
            reqHeaders
        )
        console.log('data', data)
        const basePrice = 0.002 / 1000
        const costs = data?.usage?.total_tokens * basePrice
        const responseText = data?.choices
            .map((choice) => choice?.message?.content)
            .join('')
        const json = JSON.parse(responseText)
        res.status(200).send({
            json,
            costs,
            responseText,
        })

    } catch (error) {
        console.log('error', error)
    }
})

export default router