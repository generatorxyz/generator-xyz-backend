import { Schema, model, connect } from 'mongoose'

export enum DbSourceContentTypes {
	tweet = 'tweet',
	facebook = 'facebook',
	instagram = 'instagram',
	linkedin = 'linkedin',
	twitter = 'twitter',
	rssItem = 'rssItem',
}

export interface DbSourceContent {
	id: string
	content: string
	title: string
	type: keyof typeof DbSourceContentTypes
	date: number
	url: string
	userId: string
}

export const sourceContentSchema = new Schema<DbSourceContent>({
	id: { type: String, required: true },
	content: { type: String, required: true },
	title: { type: String, required: true },
	type: { type: String, required: true },
	date: { type: Number, required: true },
	url: { type: String, required: true },
	userId: { type: String, required: true },
})

export const SourceContent = model<DbSourceContent>('SourceContent', sourceContentSchema);
