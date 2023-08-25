import cors from 'cors';
import { add } from 'date-fns';
import express from 'express';
import { userServices } from '../../services/supabase';
import chalk from 'chalk'
const log = console.log

const router = express.Router()

router.get('/', cors(), async (req: any, res: any) => {
	const { id } = req.query

	if (!id) {
		res.status(400).send({ error: 'No session id provided' })
	}

	// console.log('req: ', req)
	userServices.getUser(id)
		.then((response) => {
			log(chalk.green(`[GET-USER]: ${response?.data?.id}`))

			res.status(response?.status).send({ ...response?.data })
		})
		.catch((error) => {
			log(chalk.red(`[ERROR-GET-USER]: ${JSON.stringify(error)}`))
			res.status(500).send(error)
		})
})
router.get('/count', cors(), async (req, res) => {
	// console.log('req: ', req)
	userServices.getUserAmount()
		.then((response) => {
			log(chalk.green(`[USER-COUNT]: ${ response?.count }`))
			
			res.status(response?.status).send({ count: response?.count })
		})
		.catch((error) => {
			log(chalk.red(`[ERROR-USER-COUNT]: ${JSON.stringify(error)}`))
			res.status(500).send(error)
		})
})
router.get('/profile', cors(), async (req: any, res: any) => {
	const { id } = req.query

	if (!id) {
		log(chalk.red(`[ERROR-USER-PROFILE]: No session id provided`))
		res.status(400).send({ error: 'No session id provided' })
	}

	// console.log('req: ', req)
	userServices.getUserProfile(id)
		.then((response) => {
			log(chalk.green(`[USER-PROFILE]: ${response?.data?.id}`))
			res.status(response?.status).send({ ...response?.data })
		})
		.catch((error) => {
			log(chalk.red(`[ERROR-USER-PROFILE]: ${JSON.stringify(error)}`))
			res.status(500).send(error)
		})
})
router.get('/credits', cors(), async (req: any, res: any) => {
	const { id } = req.query

	if (!id) {
		log(chalk.red(`[ERROR-USER-CREDITS]: No session id provided`))
		res.status(400).send({ error: 'No session id provided' })
	}

	// console.log('req: ', req)
	const { data, error } = await userServices.getUserCredits(id)

	if (error) {
		console.log('error', error)
		log(chalk.red(`[ERROR-USER-CREDITS]: ${JSON.stringify(error)}`))

		res.status(500).send(error)
	} else {
		log(chalk.green(`[USER-CREDITS]: ${data?.id}`))
		res.status(200).send({ data })
	}
})

router.post('/uc', cors(), async (req: any, res: any) => {
	const { user_id } = req.body

	if (!user_id) {
		log(chalk.red(`[ERROR-USER-UPDATE-CREDITS]: No user or subscription id provided`))
		res.status(400).send({ error: 'No user or subscription id provided' })
	}

	userServices.updateUserCredts(user_id)
		.then((response) => {
			console.log('userCredits', response)
			log(chalk.green(`[USER-UPDATE-CREDITS]: ${user_id}`))

			res.status(response?.statusCode).send({ ...response })
		})
		.catch((error) => {
			log(chalk.red(`[ERROR-USER-UPDATE-CREDITS]: ${JSON.stringify(error)}`))

			res.status(error?.statusCode).send(error)
		})
})

router.post('/send-email', cors(), async (req: any, res: any) => {
	userServices.sendEmail('Test email', 'This is a test email')
		.then((response: any) => {
			console.log('userCredits', response)
			log(chalk.green(`[USER-SEND-MAIL]: This is a test email`))

			res.status(response?.status).send({ message: response?.message })
		})
		.catch((error) => {
			console.log('error', error)
			log(chalk.red(`[ERROR-USER-SEND-MAIL]: ${JSON.stringify(error)}`))

			res.status(500).send(error)
		})
})

router.post('/credit-update-cycle', cors(), async (req: any, res: any) => {

	userServices.updateCreditCycle()
		.then((response) => {
			console.log('creditUpdateCycle', response)
			log(chalk.green(`[UPDATE-CREDITS-CYCLE]: ${JSON.stringify(response)}`))

			res.status(response?.statusCode).send({ ...response })
		})
		.catch((error) => {
			log(chalk.red(`[ERROR-UPDATE-CREDIT-CYCLE]: ${JSON.stringify(error)}`))

			res.status(error?.statusCode).send(error)
		})
})

function shouldCreditsBeUpdated(today: Date, user: any) {
	const subStartDate = new Date(user.sub_start_date)
	const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
	const nextMonthDate = add(subStartDate, { days: daysInMonth })
	const shouldUpdate = today.getDate() === nextMonthDate.getDate() && today.getMonth() === nextMonthDate.getMonth()
	console.log({ today, subStartDate, daysInMonth, nextMonthDate, shouldUpdate })
	return shouldUpdate
}

export default router