import { PromiseResponse } from '../../types'
import dotenv from 'dotenv'
import Stripe from 'stripe'
dotenv.config()

interface iStripeProduct {
    id: string;
    object: string;
    active: boolean;
    attributes: any[];
    created: number;
    default_price: string;
    description: string;
    images: string[];
    livemode: boolean;
    metadata: iStripeProductMetadata;
    name: string;
    package_dimensions: null;
    shippable: null;
    statement_descriptor: null;
    tax_code: string;
    type: string;
    unit_label: string;
    updated: number;
	url: null;
	price: any
}

interface iStripeProductMetadata {
    amount: string;
}


export async function stripeGetProducts (stripe: Stripe): Promise<PromiseResponse> {
	return new Promise(async (resolve, reject) => {
		if (!stripe)
			reject({ statusCode: 400, body: { error: 'No stripe provided' } })

		try {
			const products = await stripe.products.list({
				ids: [
					process.env.STRIPE_PRODUCT_STARTER as string,
					process.env.STRIPE_PRODUCT_PRO as string,
					process.env.STRIPE_PRODUCT_ULTRA as string,
				]
			})

			const prices = products?.data.map(async (product) => {
				return await stripe.prices.retrieve(`${product?.default_price}`)
			})
			
			const resolvedPrices = await Promise.all(prices)

			const pricesMap = new Map()

			resolvedPrices.forEach((price) => {
				pricesMap.set(price?.product, price)
			})

			const productsWithPrices = products?.data.map((product, index) => {
				return {
					...product,
					mappedPrice: pricesMap.get(product?.id)
				}
			})

			resolve({
				statusCode: 200,
				body: {
					products: productsWithPrices,
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
