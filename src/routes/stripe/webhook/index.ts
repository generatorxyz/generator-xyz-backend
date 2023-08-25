import { stripeSubscriptionCancel, stripeSubscriptionCreate, stripeOrderCheckout } from '../../../services/stripe'
import { PromiseResponse } from '../../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import { response } from 'express'
import sbWrapper from '../../../services/supabase/client'
dotenv.config()

const SIGNATURE = process.env.STRIPE_WEBHOOK_SIGNATURE

const supabase = sbWrapper.getClient()

export default async (
	stripe: Stripe,
	request: any
): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		const sig = request?.headers['stripe-signature'] ?? ''
		const endpointSecret = SIGNATURE

		

		if (!endpointSecret) {
			reject({
				statusCode: 400,
				body: {
					error: 'No endpoint secret provided',
				},
			})
		}

		let event
		// console.log('webhook conf:', {
		// 	sig,
		// 	endpointSecret,
		// 	payload: request.body,
		// 	resp: response
		// })
		try {
			event = stripe.webhooks.constructEvent(
				request.body,
				sig,
				endpointSecret ?? ''
			)
		} catch (err: any) {
			console.log('err: ', err)
			reject({
				statusCode: 400,
				body: {
					error: err?.message
				},
			})
			return
		}

		console.log('event: ', event?.type)
		let customer
		let subscription
		let refund
		let subscriptionSchedule
		let transfer

		// Handle the event
		switch (event.type) {
			case 'customer.created':
				customer = event.data.object
				// Then define and call a function to handle the event customer.created
				break
			case 'customer.deleted':
				customer = event.data.object
				// Then define and call a function to handle the event customer.deleted
				break
			case 'customer.subscription.created':
				subscription = event.data.object
				// Then define and call a function to handle the event customer.subscription.created
				break
			case 'customer.subscription.deleted':
				subscription = event.data.object
				// Triggers when a subscription is canceled or expires.
				// console.error('customer.subscription.deleted: ', subscription)

				break
			case 'customer.subscription.pending_update_applied':
				subscription = event.data.object
				// Then define and call a function to handle the event customer.subscription.pending_update_applied
				break
			case 'customer.subscription.pending_update_expired':
				subscription = event.data.object
				// Then define and call a function to handle the event customer.subscription.pending_update_expired
				break
			case 'customer.subscription.trial_will_end':
				subscription = event.data.object
				// Then define and call a function to handle the event customer.subscription.trial_will_end
				break
			case 'customer.subscription.updated':
				subscription = event.data.object
				// Then define and call a function to handle the event customer.subscription.updated
				break
			case 'refund.created':
				refund = event.data.object
				// Then define and call a function to handle the event refund.created
				break
			case 'refund.updated':
				refund = event.data.object
				// Then define and call a function to handle the event refund.updated
				break
			case 'subscription_schedule.aborted':
				subscriptionSchedule = event.data.object
				console.log('subscription_schedule.aborted: ', subscriptionSchedule)
				// Then define and call a function to handle the event subscription_schedule.aborted
				break
			case 'subscription_schedule.canceled':
				subscriptionSchedule = event.data.object

				// console.log('subscription_schedule.canceled: ', subscriptionSchedule)

				try {
					await stripeSubscriptionCancel(stripe, subscriptionSchedule)
					console.log('subscription canceled, email send')
				} catch (error) {
					console.log(
						'subscription canceled, email not send: ',
						error
					)
				}

				// Then define and call a function to handle the event subscription_schedule.canceled
				break
			case 'subscription_schedule.completed':
				subscriptionSchedule = event.data.object
				console.log('subscription_schedule.completed: ', subscriptionSchedule)
				// Then define and call a function to handle the event subscription_schedule.completed
				break
			case 'subscription_schedule.created':
				subscriptionSchedule = event.data.object
				// console.log('subscription_schedule.created: ', subscriptionSchedule)

				try {
					await stripeSubscriptionCreate(stripe, subscriptionSchedule)
					console.log('🎉 subscription created, email send')
				} catch (error) {
					console.log(
						'Something went wrong while creating a subscription, email not send: ',
						error
					)
				}
				// Then define and call a function to handle the event subscription_schedule.created
				break
			case 'subscription_schedule.expiring':
				subscriptionSchedule = event.data.object
				// Then define and call a function to handle the event subscription_schedule.expiring
				break
			case 'subscription_schedule.released':
				subscriptionSchedule = event.data.object
				// Then define and call a function to handle the event subscription_schedule.released
				break
			case 'subscription_schedule.updated':
				subscriptionSchedule = event.data.object
				// Then define and call a function to handle the event subscription_schedule.updated
				break
			case 'transfer.created':
				transfer = event.data.object
				// Then define and call a function to handle the event transfer.created
				break
			case 'transfer.reversed':
				transfer = event.data.object
				// Then define and call a function to handle the event transfer.reversed
				break
			case 'transfer.updated':
				transfer = event.data.object
				// Then define and call a function to handle the event transfer.updated
				break
			
			case 'checkout.session.completed':
				const session = event.data.object as any
				console.log('checkout.session.completed: ', session)

				try {
					await stripeOrderCheckout(stripe, session)
					console.log('🎉 order finished, email send')
				} catch (error) {
					console.log(
						'Something went wrong while performing the order, email not send: ',
						error
					)
				}
				




				// Then define and call a function to handle the event checkout.session.completed
				break
			
			// ... handle other event types
			default:
				// console.log(`Unhandled event type ${ event.type }`)
		}

		resolve({
			statusCode: 200,
			body: {
				message: 'success'
			},
		})

		// console.log('event', {
		// 	customer,
		// 	subscription,
		// 	refund,
		// 	subscriptionSchedule,
		// 	transfer,
		// })
	})
}
