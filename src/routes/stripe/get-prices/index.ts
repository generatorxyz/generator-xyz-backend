import { PromiseResponse } from '../../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
dotenv.config()

export default async (stripe: Stripe): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!stripe)
			reject({ statusCode: 400, body: { error: 'No stripe provided' } })

		try {
			const prices = await stripe.prices.list({
				limit: 100,
			})

			resolve({
				statusCode: 200,
				body: {
					...prices,
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
