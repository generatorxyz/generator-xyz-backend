import { PromiseResponse } from '../../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
dotenv.config()

export default async (stripe: Stripe): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!stripe)
			reject({ statusCode: 400, body: { error: 'No stripe provided' } })

		try {
			const paymentIntents = await stripe.paymentMethods.list({
				type: 'card',
			})

			resolve({
				statusCode: 200,
				body: {
					...paymentIntents,
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
