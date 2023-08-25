import { getSummary } from '../../../services/generators'
import { extract } from '@extractus/feed-extractor'
import cors from 'cors'
import express from 'express'

const router = express.Router()

router.post('/fetch-rss', cors(), async (req: any, res: any) => {
    const { id, url } = req.body

    console.log('RSS', { id, url })

    if (!id) {
        res.status(400).send({ error: 'No user id or URL provided' })
    }

    const result = await extract(url)
console.log(result)

    // getSummary(url, id)
    //     .then((response) => {
            res.status(200).send({ message: 'Hello', result })
        // })
        // .catch((error) => {
        //     console.log('error', error)
        //     res.status(500).send(error)
        // })
})

export default router