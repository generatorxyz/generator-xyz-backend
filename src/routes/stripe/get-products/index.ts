import { PromiseResponse } from '../../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
dotenv.config()

export default async function stripeGetProducts (stripe: Stripe): Promise<PromiseResponse> {
	return new Promise(async (resolve, reject) => {
		if (!stripe)
			reject({ statusCode: 400, body: { error: 'No stripe provided' } })

		try {
			const products = await stripe.prices.list({
				active: true,
				expand: ['data.product']
			})

			resolve({
				statusCode: 200,
				body: {
					...products,
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
