import { PromiseResponse } from '../../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
dotenv.config()
import { sbWrapper } from '../../../services'

const supabase = sbWrapper.getClient()

export default async (
	stripe: Stripe,
	subscriptionId: string
): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!subscriptionId) {
			reject({
				statusCode: 400,
				body: { error: 'No subscription id provided' },
			})
		}

		try {
			const subscriptionCancel = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
			
			const dataObj = {
				sub_end_date: new Date(subscriptionCancel?.current_period_end * 1000),
				sub_status: 'canceled'
			}
			
			const { data: userUpdate, error: userUpdateError } = await supabase
					.from('user')
					.update(dataObj)
					.eq('sub_id', subscriptionCancel?.id)

			resolve({
				statusCode: 200,
				body: {
					message: 'ok',
					data: subscriptionCancel
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
