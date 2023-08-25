import { Price, PromiseResponse } from '../../types'
import { stripeGetProducts } from './get-products'
import dotenv from 'dotenv'
import Stripe from 'stripe'
dotenv.config()

export async function stripeGetProduct(stripe: Stripe, productId: string): Promise<PromiseResponse> {
	return new Promise(async (resolve, reject) => {
		if (!stripe)
			reject({ statusCode: 400, body: { error: 'No stripe or product id provided' } })

		try {
			const prices = await stripeGetProducts(stripe)
			const pricesList = prices?.body?.data as Price[]
			const priceWithProduct = pricesList?.filter((price) => price?.product?.id === productId)

			// console.log('pricesList', pricesList)
			console.log('pricesList', pricesList.length)
			console.log('priceWithProduct', priceWithProduct)

			resolve({
				statusCode: 200,
				body: {
					...priceWithProduct,
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
