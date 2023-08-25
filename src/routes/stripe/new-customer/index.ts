import { sbWrapper } from '../../../services'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import { PromiseResponse } from '../../../types'
dotenv.config()

const supabase = sbWrapper.getClient()

export default async (stripe: Stripe, email: string, fullname: string, supabaseUserId: string): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!email || !fullname || !supabaseUserId) {
			reject({ statusCode: 400, body: { error: 'No email provided' } })
		}

		try {
			let customer = null;
			const { data: userHasCustomerId, error: userNotFound } = await supabase
				.from('profiles')
				.select()
				.eq('id', supabaseUserId)
				.limit(1)
				.single()
			
			console.log('userHasCustomerId', { userHasCustomerId, userNotFound })
			
			if (userNotFound) {
				reject({ statusCode: 400, body: { error: 'User not found' } })
			}
			
			if (!userHasCustomerId?.customer_id) {
				customer = await stripe.customers.create({
					email,
					name: fullname,
					metadata: {
						supabaseUserId,
					}
				})
				console.log('New customer: ', { customer, email, supabaseUserId })
			} else {
				customer = await stripe.customers.retrieve(userHasCustomerId?.customer_id)
				console.log('Existing customer', { customer, email, supabaseUserId })
			}

			if (userHasCustomerId?.customer_id || customer?.id) {
				await supabase
					.from('profiles')
					.update({
						customer_id: customer?.id, // <- Customer id from API endpoint
					})
					.match({
						id: supabaseUserId, // <- Uuid of the user from Supabase sign up
					})
			}

			resolve({
				statusCode: 200,
				body: {
					...customer,
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
