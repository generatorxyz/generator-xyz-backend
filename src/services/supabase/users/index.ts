import sbWrapper from '../client'
import { User } from '@/services/supabase/users/type'
import nodemailer from 'nodemailer'
import mg from 'nodemailer-mailgun-transport'
import { add } from 'date-fns';

const transporter = nodemailer.createTransport(
	mg({
		auth: {
			domain: 'mail.generatorxyz.com',
			api_key: process.env.MAILGUN_API_KEY ?? '',
		},
		host: 'api.eu.mailgun.net'
	})
)
class Users {
	private client: any

	constructor() {
		this.client = sbWrapper.client
	}

	public userClient() {
		return this.client.from('user')
	}

	public async getUser(user_id: string) {
		return await this.userClient().select('*, profiles(*)').eq('id', user_id).single()
	}

	public async getUserProfile(user_id: string) {
		console.log('user_id', user_id)
		return await this.client.from('profiles').select('*').eq('id', user_id).single()
	}
	public async getUserCredits(user_id: string) {
		console.log('user_id', user_id)
		return await this.client.from('credits').select('*').eq('user_id', user_id).maybeSingle()
	}

	public async getUserByEmail(email: string) {
		return await this.userClient().select('*').eq('email', email).single()
	}

	public async updateUser(user_id: string, data: User) {
		return await this.userClient().update(data).eq('id', user_id).select()
	}

	public async getUserAmount() {
		return await this.client.from('profiles').select('*', { count: 'exact', head: true })
	}
	public async updateUserCredts(user_id: string): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const { data, error } = await this.getUserCredits(user_id)
			console.log('credits', { data, error })
			let creditUpdates: string[] = []
			if (data?.updated_at !== null) {
				creditUpdates = [...data.updated_at]
			}
			console.log('creditUpdates', creditUpdates)
			const today = new Date()
			const todayIso = today.toISOString()
			creditUpdates.push(todayIso)
			console.log('todayIso', todayIso)
			console.log('creditUpdates', creditUpdates)
			// 2023-01-19 20:25:47.723775+00


			const { data: userCredit, error: userCreditError } = await this.client
				.from('credits')
				.update({
					amount: 100,
				})
				.eq('user_id', user_id)
				.select()

			if (userCreditError) {
				console.log('userCreditError', userCreditError)
				reject({
					statusCode: 500,
					error: JSON.stringify(userCreditError),
				})
			} else {
				console.log('userCredit', userCredit)
				resolve({
					statusCode: 200,
					body: 'ok',
				})
			}
		})
	}

	public async updateCreditCycle(): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const today = new Date()
			console.log(`---- updateCreditCycle ${today} ----`)
			// const { data, error } = await supabase.from('user').select('*').neq('sub_start_date', null)
			const { data, error } = await this.client.from('user').select('*').not('sub_start_date', 'is', null)
			const { data: dataCredits, error: errorCredits } = await this.client.from('credits').select('*')
			let userCredits: any[] = []
			let usersToUpdate: any[] = []
			if (data && data.length > 0) {
				console.log('data', data)
				
				usersToUpdate = data.filter((user: any) => shouldCreditsBeUpdated(today, user, dataCredits))
				console.log('usersToUpdate', usersToUpdate)

				userCredits = usersToUpdate.map((user) => {
					const obj = {
						user_id: user.id,
						amount: 100
					}
					return obj
				})

				if (Array.isArray(userCredits) && userCredits.length > 0) {
					const { data: dataCredits, error: errorCredits } = await this.client
						.from('credits')
						.upsert(userCredits)
						.select()

					if (error) {
						console.log('error', error)

						await this.sendEmailAccountsError(usersToUpdate)
						reject({
							statusCode: 500,
							body: error
						})
					} else {


						console.log('userCredits', userCredits)
						await this.sendEmailAccountsUpdated(usersToUpdate)
						resolve({
							statusCode: 200,
							body: { dataCredits, userCredits }
						})
					}
				} else {
					console.log('no users to update')
					await this.sendEmailAccountsUpdated(usersToUpdate)
					resolve({
						statusCode: 200,
						body: 'no users to update'
					})
				}
			}

			if (error) {
				console.log('error', error)

				await this.sendEmailAccountsUpdated(usersToUpdate)

				reject({
					statusCode: 500,
					body: error
				})
			}
		})
	}

	public async sendEmailAccountsUpdated(users: any[]) {
		return new Promise(async (resolve, reject) => {

			const updatedUsers = users.map((user) => user.email)

			const updatedUsersHtml = updatedUsers.map((user) => `<li>${ user }</li>`).join('')

			const email = await transporter.sendMail({
				from: 'Ray from GeneratorXYZ.com <info@generatorxyz.com>',
				to: 'ray@byrayray.dev',
				subject: `${ updatedUsers.length } Accounts updated with 100 credits 🎉`,
				html: `
				<h1>Accounts updated 🎉</h1>
				<ul>
					${ updatedUsersHtml }
				</ul>
			`,
			}).then((info) => resolve(info)).catch((error) => reject(error))

		})
	}
	public async sendEmailAccountsError(users: any[]) {
		return new Promise(async (resolve, reject) => {

			const updatedUsers = users.map((user) => user.email)

			const updatedUsersHtml = updatedUsers.map((user) => `<li>${ user }</li>`).join('')

			const email = await transporter.sendMail({
				from: 'Ray from GeneratorXYZ.com <info@generatorxyz.com>',
				to: 'ray@byrayray.dev',
				subject: `${ updatedUsers.length } Accounts credit update failed ⚠️`,
				html: `
				<h1>Accounts updated ⚠️</h1>
				<ul>
					${ updatedUsersHtml }
				</ul>
			`,
			}).then((info) => resolve(info)).catch((error) => reject(error))

		})
	}
	public async sendEmail(subject: string, body: string) {
		return new Promise(async (resolve, reject) => {

			const email = await transporter.sendMail({
				from: 'Ray from GeneratorXYZ.com <info@generatorxyz.com>',
				to: 'ray@byrayray.dev',
				subject: `${ subject }`,
				html: `
				<h1>${subject}</h1>
				${body}
			`,
			}).then((info) => resolve(info)).catch((error) => reject(error))

		})
	}
}

function shouldCreditsBeUpdated(today: Date, user: any, credits: any[]) {
	const userCredit = credits.find((credit) => credit.id === user.id)
	console.log({ userCredit })
	const subStartDate = new Date(user.sub_start_date)
	const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
	const nextMonthDate = add(subStartDate, { days: daysInMonth })
	const shouldUpdate = today.getDate() === nextMonthDate.getDate() && today.getMonth() === nextMonthDate.getMonth()
	console.log({ today, subStartDate, daysInMonth, nextMonthDate, shouldUpdate })
	console.log('isUserCreditsUpdatedToday: ', isUserCreditsUpdatedToday(today, userCredit))
	return shouldUpdate && isUserCreditsUpdatedToday(today, userCredit)
}
function isUserCreditsUpdatedToday(today: Date, credit: any) {
	console.log('isUserCreditsUpdatedToday', credit)
	const creditUpdatedDate = new Date(credit.updated_at)
	const shouldUpdate = today.getDate() !== creditUpdatedDate.getDate() && today.getMonth() !== creditUpdatedDate.getMonth()
	console.log({ today, shouldUpdate })
	return shouldUpdate
}


export default new Users()
