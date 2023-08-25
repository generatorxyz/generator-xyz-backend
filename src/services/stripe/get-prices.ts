import { PromiseResponse } from '../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
dotenv.config()

export async function stripeGetPrices (stripe: Stripe): Promise<PromiseResponse> {
	return new Promise(async (resolve, reject) => {
		if (!stripe)
			reject({ statusCode: 400, body: { error: 'No stripe provided' } })

		try {
			const products = await stripe.prices.list({
				product: process.env.STRIPE_PRODUCT_ID ?? 'prod_NVWbaWHpo1ipB7', // Fallback is test product
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
