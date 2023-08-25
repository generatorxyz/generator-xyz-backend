import { PromiseResponse } from '../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import nodemailer from 'nodemailer'
import mg from 'nodemailer-mailgun-transport'
import sbWrapper from '../supabase/client'
import users from '../supabase/users'

dotenv.config()

const transporter = nodemailer.createTransport(
	mg({
		auth: {
			domain: 'mail.generatorxyz.com',
			api_key: process.env.MAILGUN_API_KEY ?? '',
		},
		host: 'api.eu.mailgun.net'
	})
)

const supabase = sbWrapper.getClient()
const userService = users
const dateFormatOptions: Intl.DateTimeFormatOptions = {
	dateStyle: 'medium',
	timeStyle: 'short',
	hour12: false
}
const dateFormat = new Intl.DateTimeFormat('nl-NL', dateFormatOptions)
const numberFormat = new Intl.NumberFormat('nl-NL', {
	style: 'currency',
	currency: 'EUR',
})

export default async (
	stripe: Stripe,
	subscription: any
): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!subscription) {
			reject({
				statusCode: 400,
				body: { error: 'No subscription provided' },
			})
		}

		const supabaseId = subscription?.metadata?.supabaseUserId
		const stripeCustomer = subscription.customer

		const periodEnd = subscription?.current_phase?.end_date
		const periodStart = subscription?.current_phase?.start_date

		const subscriptionId = subscription?.subscription
		const startDate = subscription?.created

		console.log('SUBSCRIPTION: ', subscription)

		try {
			const customerObj = await stripe.customers.retrieve(
				`${stripeCustomer}`
			)
			const customerName = customerObj?.deleted
				? 'Created'
				: customerObj?.name
			const subscriptionDetails = await stripe.subscriptions.retrieve(`${ subscriptionId }`)
			const firstSubscriptionItem = subscriptionDetails?.items?.data[0]
			const price = firstSubscriptionItem?.plan?.amount ?? '0'
			const productId = firstSubscriptionItem?.plan?.product
			const product = await stripe.products.retrieve(`${productId}`)
			console.log('product: ', product)
			let userName = stripeCustomer

			if (supabaseId) {
				await userService.updateUser(supabaseId, {
					sub_start_date: new Date(periodStart * 1000),
					sub_status: 'paid',
				})
			

				const { data: userProfile, error: userProfileNotFound } =
					await supabase
						.from('profiles')
						.select()
						.eq('user_id', supabaseId)
						.single()

				userName = userProfile?.full_name
			}

			await transporter.sendMail({
				from: 'Ray from GeneratorXYZ.com <info@generatorxyz.com>',
				to: 'ray@byrayray.dev',
				subject: `Subscription Created 🎉: ${userName ?? 'Unknown'}`,
				// text: 'Subscription Created',
				html: `
				<div style="font-size: 16px;">
				<h1>Subscription Created 🎉</h1>
				<ul>
				<li>Subscription ID: <code style="background-color: #ccc;">${
					subscription.id
				}</code></li>
				<li>Customer (ID/name): <code style="background-color: #ccc;">${
					userName ?? 'Unknown'
				}</code></li>
				<li>Product: ${product?.name}</li>
				<li>Price: ${numberFormat.format(
					parseFloat(`${price}`) / 100
				)}</li>
				<li>Supabase ID: <code style="background-color: #ccc;">${
					supabaseId ?? 'unknown 🤔'
				}</code></li>
				<li>Subscription started: ${dateFormat.format(new Date(startDate * 1000))}</li>
				<li>Period Start: ${dateFormat.format(new Date(periodStart * 1000))}</li>
				<li>Period End: ${dateFormat.format(new Date(periodEnd * 1000))}</li>
				</ul>
				</div>
			`,
			})

			resolve({
				statusCode: 200,
				body: {
					message: 'ok',
					// ...subscriptionDeleted,
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
