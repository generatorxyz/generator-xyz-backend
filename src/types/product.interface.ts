export interface Price {
	id: string
	object: string
	active: boolean
	billing_scheme: string
	created: number
	currency: string
	custom_unit_amount: any
	livemode: boolean
	lookup_key: any
	metadata: {
		order_id: string
	}
	nickname: any
	product: Product
	recurring: {
		aggregate_usage: any
		interval: string
		interval_count: number
		usage_type: string
	}
	tax_behavior: string
	tiers_mode: any
	transform_quantity: any
	type: string
	unit_amount: number
	unit_amount_decimal: string
}

export interface Metadata {
	order_id: string
}

export interface Recurring {
	aggregate_usage: any
	interval: string
	interval_count: number
	usage_type: string
}
export interface Product {
	id: string
	object: string
	active: boolean
	created: number
	default_price: any
	description: string
	images: any[]
	livemode: boolean
	metadata: {}
	name: string
	package_dimensions: any
	shippable: any
	statement_descriptor: any
	tax_code: any
	unit_label: any
	updated: number
	url: any
}
