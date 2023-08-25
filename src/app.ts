import cors from 'cors'
import 'dotenv/config'
import express, { Request, Response } from 'express'
import https from 'https'

import { generatorsRouter, stripeRouter, usersRouter } from './routes'
import { sbWrapper } from './services'
import { getPageContent, getSocialMediaMessage } from './services/generators'

const supabase = sbWrapper.client

// Create a single supabase client for interacting with your database

const app = express()
const port = process.env.PORT || 3001

app.use(
    (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): void => {
        if (req.originalUrl.includes('webhook')) {
            next();
        } else {
            express.json()(req, res, next);
        }
    }
);

app.use(cors())

const allowlist: string[] = [
    'http://localhost:3000',
    'http://generatorxyz.com',
    'https://generatorxyz.com',
    'https://www.generatorxyz.com',
    'https://generatorxyz.com',
    'https://www.generatorxyz.com',
    'https://generatorxyz.netlify.app',
    'https://beta.generatorxyz.com',
]
const corsOptionsDelegate = function (req: Request, callback: any) {
    let corsOptions
    const origin = req.header('Origin') ?? ''
    if (allowlist.indexOf(origin) !== -1 || origin?.endsWith('netlify.app')) {
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: false } // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
}
app.options('*', cors(corsOptionsDelegate))

app.use('/payments', stripeRouter)
app.use('/users', usersRouter)
app.use('/generators', generatorsRouter)


app.post('/social-generator', cors(), async (req: Request, res: Response) => {
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

app.get(
    '/page-content',
    cors(),
    async (req: Request, res: Response) => {
        const { url } = req.query

        if (!url) {
            res.status(400).send({ error: 'No URL provided' })
        }
        try {
            await checkWebsite(`${ url }`)
        } catch (error) {
            return res.status(500).send({
                body: {
                    error: `It looks like ${ url } is not a valid URL. Or we can\'t reach the website. Please check the website in your browser.`,
                },
            })
        }
        try {
            const { statusCode, body } = await getPageContent(`${ url }`)
            console.log({ url })

            res.status(statusCode).send({
                body,
            })
        } catch (error) {
            res.status(500).send({
                error,
            })
        }
    }
)

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


app.get('/', (req: Request, res: Response) => {
    res.send({
        message: 'Hello, World! Sorry nothing to find here, go ahead to https://generatorxyz.com and login to use the generators 👍',
    })
})

/**
 * STRIPE
 */
app.listen(port, () => {
    console.log(`Application listening on port ${ port }`)
})
