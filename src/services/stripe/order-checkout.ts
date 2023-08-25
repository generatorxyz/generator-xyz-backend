import { PromiseResponse } from '../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import nodemailer from 'nodemailer'
import mg from 'nodemailer-mailgun-transport'
import sbWrapper from '../supabase/client'
import users from '../supabase/users'
import { creditsService } from '../../services'

dotenv.config()

const transporter = nodemailer.createTransport(
	mg({
		auth: {
			domain: 'mail.generatorxyz.com',
			api_key: process.env.MAILGUN_API_KEY ?? '',
		},
		host: 'api.eu.mailgun.net',
	})
)

const supabase = sbWrapper.getClient()
const dateFormatOptions: Intl.DateTimeFormatOptions = {
	dateStyle: 'medium',
	timeStyle: 'short',
	hour12: false,
}
const dateFormat = new Intl.DateTimeFormat('nl-NL', dateFormatOptions)
const numberFormat = new Intl.NumberFormat('nl-NL', {
	style: 'currency',
	currency: 'EUR',
})

export default async (stripe: Stripe, session: any): Promise<PromiseResponse> => {
	return new Promise(async (resolve, reject) => {
		if (!session) {
			reject({
				statusCode: 400,
				body: { error: 'No subscription provided' },
			})
		}

		try {
			const checkout = await stripe.checkout.sessions.retrieve(session?.id)
			console.log('checkout: ', checkout)
			const products = await stripe.checkout.sessions.listLineItems(session?.id)
			console.log('products: ', products)

			const productItem = products?.data[0]
			const nickname = productItem?.price?.nickname as string
			const productCreditAmount = parseInt(nickname)

			const { data, error } = await supabase.from('orders').insert({
				user_id: session?.metadata?.supabaseUserId,
				product_id: productItem?.price?.product,
				price_id: productItem?.price?.id,
				amount: productCreditAmount ?? null,
				customer_id: session?.customer,
			})

			if (error) {
				console.log('error: ', error)
			} else {
				console.log('order is saved: ', data)
			}

			const {data: userData, error: userError} = await users.getUserProfile(session?.metadata?.supabaseUserId)
			console.log('userData: ', userData)

			const updateCredits = await creditsService.updateCreditsUser(
				session?.metadata?.supabaseUserId,
				productCreditAmount,
				'add'
			)

			console.log('updateCredits: ', updateCredits)

			const username = userData?.full_name ?? userData?.username ?? 'Unknown'

			console.log('username: ', username)

			await transporter.sendMail({
				from: 'Ray from GeneratorXYZ.com <info@generatorxyz.com>',
				to: 'ray@byrayray.dev',
				subject: `Order succeed 🎉: ${username}`,
				// text: 'Subscription Created',
				html: `
					<div style="font-size: 16px;">
						<h1>Order succeed 🎉</h1>
						<p>
							${username} has bought ${nickname} credits. The current balance is ${nickname} credits.
						</p>
					</div>
				`,
			})
			await transporter.sendMail({
				from: 'Ray from GeneratorXYZ.com <info@generatorxyz.com>',
				to: userData?.username,
				cc: 'ray@byrayray.dev',
				subject: `Order succeed 🎉: ${username}`,
				html: `
					<div style="font-size: 16px;">
						<h1>Order succeed 🎉</h1>
						<p>
							Your order has been succesfull. The current balance is ${nickname} credits.
						</p>
						<p>Enjoy!</p>
						<p>Best regards,</p>
						<p>Ray from GeneratorXYZ.com</p>

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
