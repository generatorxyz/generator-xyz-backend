export interface CheerioOutputHeadings {
	[key: string]: {
		text: string
	}[]
}

export interface CheerioReturnData {
	statusCode: number
	body: {
		title: string
		description: string
		content: string
		url: string
		site_name: string
		image: string
		icon: string
		keywords: string[]
		headings: {
			[key: string]: CheerioOutputHeadings
		}
		images: string[]
		twitter: {
			title: string
			description: string
			image: string
			card: string
		}
		og: {
			title: string
			description: string
			image: string
		}
		manifest: string
		viewport: string
	}
}
