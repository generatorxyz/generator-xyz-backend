import {stripeGetPrices, stripeGetProduct, stripeGetProducts} from '../../services/stripe'
import cors from 'cors'
import express from 'express'
import Stripe from 'stripe'

import {
	getPaymentMethods,
	getSession,
	stripeNewCustomer,
	stripeNewSubscription,
	stripeSubscriptionCancelAction,
	stripeSubscriptionSuccess,
	stripeWebhook,
} from '../../lib'

import stripeOrderCheckout from './new-checkout'

const stripe = new Stripe(`${process.env.STRIPE_SECRET_KEY}`, {
	apiVersion: '2022-11-15',
})
const stripeRouter = express.Router()

stripeRouter.get('/session', cors(), async (req: any, res: any) => {
	const { id } = req.query
	if (!id) {
		res.status(400).send({ error: 'No session id provided' })
	}

	getSession(stripe, `${id}`)
		.then((data) => {
			console.log('session', data)

			res.status(data?.statusCode).send({ ...data?.body })
		})
		.catch((error) => {
			res.status(500).send(error)
		})
})
stripeRouter.post('/subscription-success', cors(), async (req: any, res: any) => {
	const { session_id, user_id } = req.body

	stripeSubscriptionSuccess(stripe, session_id, user_id)
		.then((data) => {
			console.log('subscription success', data)
			res.status(data?.statusCode).send({ ...data?.body })
		})
		.catch((error) => {
			res.status(500).send(error)
		})
})
stripeRouter.get('/payment-methods', cors(), async (req: any, res: any) => {
	// TODO: get payment methods
	getPaymentMethods(stripe)
		.then((data) => {
			console.log('payment methods', data)

			res.status(data?.statusCode).send({ ...data?.body })
		})
		.catch((error) => {
			res.status(500).send(error)
		})
})

stripeRouter.post('/create-customer', cors(), async (req: any, res: any) => {
	const { email, fullname, id } = req.body
	console.log('body', req.body)

	stripeNewCustomer(stripe, email, fullname, id)
		.then((data) => {
			console.log('response', data)

			res.status(data?.statusCode).send({ ...data?.body })
		})
		.catch((error) => {
			res.status(500).send(error)
		})
})
stripeRouter.post('/create-subscription', cors(), async (req: any, res: any) => {
	const { userId, priceId, supabaseUserId } = req.body
	console.log('body', req.body)

	stripeNewSubscription(stripe, userId, supabaseUserId, priceId)
		.then((data) => {
			console.log('subscriptionP', data)

			res.status(data?.statusCode).send({ ...data?.body })
		})
		.catch((error) => {
			res.status(500).send(error)
		})
})
stripeRouter.post('/order-checkout', cors(), async (req: any, res: any) => {
	const { userId, priceId, supabaseUserId } = req.body
	console.log('body', req.body)

	stripeOrderCheckout(stripe, userId, supabaseUserId, priceId)
		.then((data) => {
			console.log(`order checkout by ${userId} on email ${data?.body?.customer_details?.email} with price ${data?.body?.amount_total}}`)

			res.status(data?.statusCode).send({ ...data?.body })
		})
		.catch((error) => {
			res.status(500).send(error)
		})
})
stripeRouter.delete('/delete-subscription', cors(), async (req: any, res: any) => {
	const { subscriptionId } = req.query
	console.log('query', req.query)

	stripeSubscriptionCancelAction(stripe, subscriptionId)
		.then((data) => {
			console.log('subscriptionP', data)

			res.status(data?.statusCode).send({ ...data?.body })
		})
		.catch((error) => {
			res.status(500).send(error)
		})
})
stripeRouter.get('/products', cors(), async (req: any, res: any) => {
	stripeGetProducts(stripe)
		.then((data) => {
			console.log('products', data)

			res.status(data?.statusCode).send({ ...data?.body })
		})
		.catch((error) => {
			res.status(500).send(error)
		})
})
stripeRouter.get('/prices', cors(), async (req: any, res: any) => {
	stripeGetPrices(stripe)
		.then((data) => {
			console.log('products', data)

			res.status(data?.statusCode).send({ ...data?.body })
		})
		.catch((error) => {
			res.status(500).send(error)
		})
})

stripeRouter.post(
	'/webhook',
	express.raw({ type: 'application/json' }),
	async (req: any, res: any) => {
		// Return a 200 response to acknowledge receipt of the event
		console.log('WEBHOOK IMCOMMING FROM STRIPE', new Date())
		await stripeWebhook(stripe, req)
			.then((data) => {
				console.log('webhook', data)

				res.status(data?.statusCode).send({ ...data?.body })
			})
			.catch((error) => {
				res.status(error?.statusCode).send(error)
			})
	}
)

export default stripeRouter
