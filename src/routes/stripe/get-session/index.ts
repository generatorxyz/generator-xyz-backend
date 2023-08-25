import { PromiseResponse } from '../../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
dotenv.config()

export default async (stripe: Stripe, sessionId: string): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!sessionId) {
			reject({
				statusCode: 400,
				body: { error: 'No sessionId provided' },
			})
		}

		try {

			const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

			resolve({
				statusCode: 200,
				body: {
					...checkoutSession,
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
