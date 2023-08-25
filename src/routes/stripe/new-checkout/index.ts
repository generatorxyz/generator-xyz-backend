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

			let customer = null;
			if (!userProfile?.customer_id) {
				console.log('creating customer')
				customer = await stripe.customers.create({
					email: userProfile?.username,
					name: userProfile?.name,
					metadata: {
						supabaseUserId,
					},
				})
			} else {
				console.log('retrieve customer')
				customer = await stripe.customers.retrieve(userProfile?.customer_id)
			}
			
			await supabase.from('profiles').update({ customer_id: customer?.id }).eq('id', supabaseUserId)

			const options = {
				line_items: [{ price: priceId, quantity: 1 }],
				mode: 'payment',
				success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${process.env.FRONTEND_URL}/generators`,
				automatic_tax: {
					enabled: true,
				},
				customer: customer?.id,
				metadata: {
					supabaseUserId
				},
				invoice_creation: {
					enabled: true,
				},
				client_reference_id: userId,
				customer_update: {
					address: 'auto'
				},
				allow_promotion_codes: true,
			} as Stripe.Checkout.SessionCreateParams

			console.log('options', options)

			const checkoutSession = await stripe.checkout.sessions.create(options)

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
