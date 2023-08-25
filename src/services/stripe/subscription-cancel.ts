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
const dateFormat = new Intl.DateTimeFormat('nl-NL')
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
		const stripeCustomer = subscription?.customer
		
		const phase = subscription?.phases[0]
		console.log('phase items: ', phase?.items)
		const periodStart = phase?.start_date
		const periodEnd = phase?.end_date
		
		const firstSubscriptionItem = subscription?.items?.data[0]
		console.log('firstSubscriptionItem: ', firstSubscriptionItem)

		const cancelationDate = subscription?.canceled_at

		console.log('SUBSCRIPTION: ', subscription)

		try {
			const customerObj = await stripe.customers.retrieve(
				`${ stripeCustomer }`
			)
			const customerName = customerObj?.deleted
				? 'Deleted'
				: customerObj?.name

			let userName = stripeCustomer

			if (supabaseId) {
				await userService.updateUser(supabaseId, {
					sub_end_date: new Date(periodEnd * 1000),
					sub_status: 'canceled',
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
				subject: `Subscription Cancelled 😢: ${ userName ?? 'Unknown' }`,
				// text: 'Subscription Cancelled',
				html: `
				<div style="font-size: 16px;">
				<h1>Subscription Cancelled 😢</h1>
				<ul>
				<li>Subscription ID: <code style="background-color: #ccc;">${ subscription.id
					}</code></li>
				<li>Customer (ID/name): <code style="background-color: #ccc;">${ userName ?? 'Unknown'
					}</code></li>
				<li>Supabase ID: <code style="background-color: #ccc;">${ supabaseId ?? 'unknown 🤔'
					}</code></li>
				<li>Subscription canceled: ${ dateFormat.format(new Date(cancelationDate * 1000)) }</li>
				<li>Period Start: ${ dateFormat.format(new Date(periodStart * 1000)) }</li>
				<li>Period End: ${ dateFormat.format(new Date(periodEnd * 1000)) }</li>
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
