import { FindMainContentObject } from '../../../services/generators/page-content'
import { CheerioOutputHeadings } from '../../../types'

export interface SeoAudit {
	title: ISeoValidate
	description: ISeoValidate
	slug: ISeoValidate
	content: ISeoValidate
	contentSalience: ISeoValidateContent
    headings: SeoHeadingsOutput
	metaTags: ISeoValidate[] | null
	images: SeoImagesOutput[]
	twitter: SeoValidateTwitter
    og: SeoValidateOpenGraph
    manifest: string
    viewport: string
    
	hasManifest: boolean
	hasViewport: boolean
    headingsFeedback: SeoHeadingsFeedback
}
export interface SeoAuditInput {
	title: string
	description: string
	slug: string
	content: FindMainContentObject
	headings: CheerioOutputHeadings
	metaTags: string[]
	images: SeoImagesInput[]
	twitter: SeoTwitterInput
	og: SeoOpenGraphInput
	manifest: string
	viewport: string
}

export interface SeoHeadingsFeedback {
    singleH1: boolean
    hasH1: boolean
}
export interface SeoTwitterInput {
	title?: string | null
	description?: string | null
	image?: string | null
	card?: string | null
	type?: string | null
}
export interface SeoValidateTwitter extends SeoTwitterInput {
	hasTitle: boolean
	hasDescription: boolean
	hasImage: boolean
	hasCard: boolean
}

export interface SeoOpenGraphInput {
	title?: string | null
	description?: string | null
	image?: SeoImageGraphImageInput | null
	type?: string | null
	locale?: string | null
	site_name?: string | null
	url?: string | null
}

export interface SeoImageGraphImageInput {
	src?: string | null
	height?: string | null
	width?: string | null
	type?: string | null
	url?: string | null
	alt?: string | null
}

export interface SeoValidateOpenGraph extends SeoOpenGraphInput {
	hasTitle: boolean
	hasDescription: boolean
	hasImage: boolean
	hasType: boolean
	hasLocale: boolean
	hasSiteName: boolean
	hasUrl: boolean
	hasImageSrc: boolean
	hasImageHeight: boolean
	hasImageWidth: boolean
	hasImageType: boolean
	hasImageUrl: boolean
	hasImageAlt: boolean
}

export interface ISeoValidate {
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
}


export interface ISeoValidateContent {
	keywords: string[] | null
	wordSalience?: [string, number][] | null
}
export interface SeoValidateRules {
	minCharacters?: number
	maxCharacters?: number
	minWords?: number
	maxWords?: number
}

export interface SeoHeadingsInput {
	h1: string[]
	h2: string[]
	h3: string[]
	h4: string[]
	h5: string[]
	h6: string[]
}
export interface SeoHeadingsOutput {
	h1: CheerioOutputHeadings[]
	h2: CheerioOutputHeadings[]
	h3: CheerioOutputHeadings[]
	h4: CheerioOutputHeadings[]
	h5: CheerioOutputHeadings[]
	h6: CheerioOutputHeadings[]
}

export interface SeoImagesInput {
	src: string | null
	alt: string | null
	title: string | null
	width: string | null
	height: string | null
	async: string | null
}

export interface SeoImagesOutput extends SeoImagesInput {
	hasAlt: boolean
	hasTitle: boolean
	hasWidth: boolean
	hasHeight: boolean
	hasAsync: boolean
}

export enum OpenGraphType {
	Website = 'website',
	Article = 'article',
	Book = 'book',
	Profile = 'profile',
	MusicSong = 'music.song',
	MusicAlbum = 'music.album',
	MusicPlaylist = 'music.playlist',
	MusicRadioStation = 'music.radio_station',
	VideoMovie = 'video.movie',
	VideoEpisode = 'video.episode',
	VideoTVShow = 'video.tv_show',
	VideoOther = 'video.other',
}

export enum SeoValidateType {
	Title = 'title',
	Description = 'description',
	Slug = 'slug',
	Content = 'content',
	Headings = 'headings',
	MetaTags = 'metaTags',
	Images = 'images',
}