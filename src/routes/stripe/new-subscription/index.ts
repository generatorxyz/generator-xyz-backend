import { PromiseResponse } from '../../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import { sbWrapper } from '../../../services'
dotenv.config()

const supabase = sbWrapper.getClient()

export default async (stripe: Stripe, userId: string, supabaseUserId: string, priceId: string): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!userId || !supabaseUserId || !priceId) {
			reject({
				statusCode: 400,
				body: { error: 'No user and/or price provided' },
			})
		}

		try {
			const { data: userProfile, error: userProfileNotFound } =
				await supabase
					.from('profiles')
					.select()
					.eq('id', supabaseUserId)
					.limit(1)
                    .single()
            
            console.log({ userProfile, userProfileNotFound })

			if (userProfileNotFound) {
				reject({ statusCode: 400, body: { error: 'User not found' } })
			}

			const checkoutSession = await stripe.checkout.sessions.create({
				// payment_method_types: ['card'],
				line_items: [{ price: priceId, quantity: 1 }],
				mode: 'subscription',
				success_url: `${process.env.FRONTEND_URL}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${process.env.FRONTEND_URL}/subscription-cancel?session_id={CHECKOUT_SESSION_ID}`,
				automatic_tax: {
					enabled: true,
				},
				customer_email: userProfile?.username,
				metadata: {
					supabaseUserId
				}
			})

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
