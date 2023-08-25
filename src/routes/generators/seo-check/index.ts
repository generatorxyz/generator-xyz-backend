import {
	SeoAuditInput,
	SeoAudit,
	SeoHeadingsOutput,
	SeoImagesInput,
	SeoTwitterInput,
	SeoValidateTwitter,
	SeoOpenGraphInput,
	SeoValidateOpenGraph,
	SeoImagesOutput,
	SeoValidateRules,
	OpenGraphType,
	SeoValidateType,
	ISeoValidate,
	ISeoValidateContent,
} from './types'
import { CheerioOutputHeadings } from '../../../types'
import { FindMainContentObject } from '../../../services/generators/page-content'

import * as ws from 'word-salience'

export function validateSeoContent(input: SeoAuditInput): SeoAudit {
	console.log('manifest', input?.manifest)
	console.log('viewport', input?.viewport)
	console.log({ hasManifest: input?.manifest ? true : false, hasViewport: input?.viewport ? true : false })
	const seoAudit: SeoAudit = {
		title: validateTitle(input?.title),
		description: validateDescription(input?.description),
		slug: validateSlug(input?.slug),
		content: validateContent(input?.content),
		contentSalience: new SeoValidateContent(input?.content?.content ?? ''),
		headings: validateHeadings(input?.headings),
		metaTags: null,
		images: validateImages(input?.images),
		twitter: validateTwitter(input?.twitter),
		og: validateOpenGraph(input?.og),
		manifest: input?.manifest,
		viewport: input?.viewport,
		hasManifest: input?.manifest ? true : false,
		hasViewport: input?.viewport ? true : false,
		headingsFeedback: {
			singleH1: input?.headings?.h1?.length === 1 ? true : false,
			hasH1: input?.headings?.h1?.length > 0 ? true : false,
		},
	}

	return seoAudit
}
function validateTitle(title: string): SeoValidate {
	return new SeoValidate(title, SeoValidateType.Title, {
		minCharacters: 50,
		maxCharacters: 60,
	})
}

function validateDescription(description: string): SeoValidate {
	console.log('description validate', description)
	return new SeoValidate(description, SeoValidateType.Description, {
		minCharacters: 150,
		maxCharacters: 160,
	})
}

function validateSlug(slug: string): SeoValidate {
	return new SeoValidate(slug, SeoValidateType.Slug, {
		maxCharacters: 70,
	})
}

function validateContent(content: FindMainContentObject): SeoValidate {
	console.log(content?.content?.substring(0, 100))
	return new SeoValidate(
		content?.content ?? '',
		SeoValidateType.Content,
		{
			minWords: 2200,
		},
		content?.message
	)
}

function validateHeadings(content: CheerioOutputHeadings): SeoHeadingsOutput {
	const keys = Object.keys(content)
	const headingsObj: any = {
		h1: [],
		h2: [],
		h3: [],
		h4: [],
		h5: [],
		h6: [],
	}
	keys.forEach((heading) => {
		const headingContent = content[heading]

		headingContent.forEach((x) => {
			const check = new SeoValidate(x.text, SeoValidateType.Headings, {
				minCharacters: 10,
				maxCharacters: 70,
			})
			headingsObj[heading].push(check)
		})
	})
	return headingsObj
}

function validateMetaTags(content: SeoImagesInput): any {
	return Array.from([content]).map((image) => {
		return new SeoValidateImage(image)
	})
}

function validateTwitter(content: SeoTwitterInput): SeoValidateTwitter {
	return {
		hasTitle: content?.title ? true : false,
		hasDescription: content?.description ? true : false,
		hasImage: content?.image ? true : false,
		hasCard: content?.card ? true : false,
		...content,
	}
}

function isValidOpenGraphType(type: string): boolean {
	return Object.values(OpenGraphType).includes(type as OpenGraphType)
}

function validateOpenGraph(content: SeoOpenGraphInput): SeoValidateOpenGraph {
	return {
		hasTitle: content?.title ? true : false,
		hasDescription: content?.description ? true : false,
		hasImage: content?.image ? true : false,
		hasUrl: content?.url ? true : false,
		hasImageSrc: content?.image?.src ? true : false,
		hasImageHeight: content?.image?.height ? true : false,
		hasImageWidth: content?.image?.width ? true : false,
		hasImageAlt: content?.image?.alt ? true : false,
		hasImageType: content?.image?.type ? true : false,
		hasLocale: content?.locale ? true : false,
		hasSiteName: content?.site_name ? true : false,
		hasImageUrl: content?.image?.url ? true : false,
		hasType: content?.type ? true : false,
		...content,
	}
}

function validateImages(content: SeoImagesInput[]): SeoImagesOutput[] {
	return content.map((image) => {
		return new SeoValidateImage(image)
	})
}

export class SeoValidateImage implements SeoImagesOutput {
	hasAlt: boolean
	hasTitle: boolean
	hasWidth: boolean
	hasHeight: boolean
	hasAsync: boolean
	src: string | null
	alt: string | null
	title: string | null
	width: string | null
	height: string | null
	async: string | null

	constructor(image: SeoImagesInput) {
		console.log('SeoValidateImage: ', image)
		this.src = image?.src || null
		this.alt = image?.alt || null
		this.title = image?.title || null
		this.width = image?.width || null
		this.height = image?.height || null
		this.async = image?.async || null

		this.hasAlt = this?.alt ? true : false
		this.hasTitle = this?.title ? true : false
		this.hasWidth = this?.width ? true : false
		this.hasHeight = this?.height ? true : false
		this.hasAsync = this?.async ? true : false
	}
}

export class SeoValidate implements ISeoValidate {
	minCharacters?: number
	maxCharacters?: number
	minWords?: number
	maxWords?: number
	isValid: boolean
	isTooLong: boolean
	isTooShort: boolean
	message: string | null
	length: number
	input: string
	type: SeoValidateType
	wordLength: number
	typeCount: 'words' | 'characters'
	hasDuplicate: boolean

	#notUsedWords = [
		'and',
		' but',
		'or',
		'the',
		'a',
		'an',
		'in',
		'of',
		'to',
		'for',
		'with',
		'on',
		'at',
		'from',
		'by',
		'about',
		'as',
	]

	constructor(input: string, type: SeoValidateType, rules: SeoValidateRules, serverMessage?: string) {
		const isArrayAndHasMoreThanZero = Array.isArray(input) && input?.length > 0
		const isArrayAndHasMoreThanOne = Array.isArray(input) && input?.length > 1
		const content = isArrayAndHasMoreThanZero ? input[0] : input
		const contentLength = content.length

		console.log('isArrayAndHasMoreThanZero: ', isArrayAndHasMoreThanZero)

		this.hasDuplicate = isArrayAndHasMoreThanOne ? true : false
		this.minCharacters = rules?.minCharacters
		this.maxCharacters = rules?.maxCharacters
		this.minWords = rules?.minWords
		this.maxWords = rules?.maxWords
		this.typeCount = this.minCharacters || this.maxCharacters ? 'characters' : 'words'
		this.length = contentLength
		this.wordLength = `${content}`?.trim().split(/\s+/).filter(Boolean).length

		this.input = input
		this.type = type

		this.isValid = this.checkValid(content, rules)
		this.isTooLong =
			this.typeCount === 'characters'
				? this.checkTooLong(content, rules?.maxCharacters)
				: this.checkTooLong(content, rules?.maxWords)
		this.isTooShort =
			this.typeCount === 'characters'
				? this.checkTooShort(content, rules?.minCharacters)
				: this.checkTooShort(content, rules?.minWords)
		this.message = serverMessage ?? this.getMessage()
	}

	getMessage(): string | null {
		if (!this.isValid) {
			if (this.isTooLong) {
				return `Too long. Max ${this.typeCount === 'characters' ? this.maxCharacters : this.maxWords} ${
					this.typeCount
				}.${this.hasDuplicate ? ' Duplicates found, please resolve them' : ''}`
			}
			if (this.isTooShort) {
				return `Too short. Min ${this.typeCount === 'characters' ? this.minCharacters : this.minWords} ${
					this.typeCount
				}.${this.hasDuplicate ? ' Duplicates found, please resolve them' : ''}`
			}
		} else {
			if (this.type === SeoValidateType.Slug && !this.checkSlug(this.input)) {
				return `Valid, but try to prevent words like: "${this.#notUsedWords
					.join(', ')
					.trim()}" since they don't add any value to your SEO.`
			}
		}
		return null
	}
	checkTooLong(input: string, length: number | undefined): boolean {
		return checkTooLong(input, length)
	}
	checkTooShort(input: string, length: number | undefined): boolean {
		return checkTooShort(input, length)
	}
	checkValid(input: string, rules: SeoValidateRules): boolean {
		if (rules?.minCharacters || rules?.maxCharacters) {
			if (rules?.minCharacters && rules?.maxCharacters) {
				return (
					!this.checkTooLong(input, rules?.maxCharacters) && !this.checkTooShort(input, rules?.minCharacters)
				)
			}
			if (rules?.minCharacters && !rules?.maxCharacters) {
				return !this.checkTooShort(input, rules?.minCharacters)
			}
			if (!rules?.minCharacters && rules?.maxCharacters) {
				return !this.checkTooLong(input, rules?.maxCharacters)
			}
		}

		if (rules?.minWords || rules?.maxWords) {
			if (rules?.minWords && rules?.maxWords) {
				return !this.checkTooLong(input, rules?.maxWords) && !this.checkTooShort(input, rules?.minWords)
			}
			if (rules?.minWords && !rules?.maxWords) {
				return !this.checkTooShort(input, rules?.minWords)
			}
			if (!rules?.minWords && rules?.maxWords) {
				return !this.checkTooLong(input, rules?.maxWords)
			}
		}

		if (this.hasDuplicate) {
			return !this.hasDuplicate
		}

		return false
	}

	checkSlug(input: string): boolean {
		return this.#notUsedWords.includes(input)
	}

	checkIfHasH1(input: CheerioOutputHeadings): boolean {
		const keys = Object.keys(input)
		const headingsAmount = keys.map((heading) => input[heading].length)
		return headingsAmount[0] !== 1
	}
}

export class SeoValidateContent implements ISeoValidateContent {
	keywords: string[] | null
	wordSalience?: [string, number][] | null

	constructor(content: string) {
		this.wordSalience = this.getWordSalience(content)
		this.keywords = this.getKeywords(content)
	}

	getKeywords(content: string): string[] | null {
		return this.wordSalience?.map((x: [string, number]) => x[0]) ?? null
	}

	getWordSalience(content: string): [string, number][] | null {
		const wordSalience = ws.getSalientWords(content, true, true)
		const firstTenWords = wordSalience?.slice(0, 10)
		return firstTenWords && firstTenWords.length > 0 ? firstTenWords : null
	}
}

function checkTooLong(input: string, length: number | undefined): boolean {
	return length && input.length > length ? true : false
}
function checkTooShort(input: string, length: number | undefined): boolean {
	return length && input.length < length ? true : false
}
