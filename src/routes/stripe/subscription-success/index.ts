import { PromiseResponse } from '../../../types';
import dotenv from 'dotenv'
import Stripe from 'stripe';
dotenv.config()
import { sbWrapper } from '../../../services'

const supabase = sbWrapper.getClient()

export default async (stripe: Stripe, session_id: string, user_id: string): Promise<PromiseResponse> => {
    return new Promise(async (resolve, reject) => {
        if (!session_id || !user_id) {
            reject({ statusCode: 400, body: { error: 'No session or user id provided' } })
        }

        try {
            const session = await stripe.checkout.sessions.retrieve(session_id)
            if (session?.payment_status !== 'paid') {
                reject({
                    statusCode: 400,
                    body: {
                        error: 'Payment not successful'
                    },
                })
            } else {
                const customer = await stripe.customers.retrieve(`${ session?.customer }`)

                const dataObj = {
                    session_id: session?.id,
                    sub_id: session?.subscription,
                    sub_start_date: new Date(session?.created * 1000),
                    sub_end_date: null,
                    sub_status: session?.payment_status
                }

                console.log('dataObj', { dataObj })


                const { data: userUpdate, error: userUpdateError } = await supabase
                    .from('user')
                    .update(dataObj)
                    .eq('id', user_id)
                    .select()

                const { data: userCredit, error: userCreditError } = await supabase
                    .from('credits')
                    .update({
                        amount: 100
                    })
                    .eq('user_id', user_id)
                    .select()

                console.log('userUpdate', { userUpdate, userUpdateError })
                console.log('userCredit', { userCredit, userCreditError })

                resolve({
                    statusCode: 200,
                    body: {
                        customer, session, userUpdate, userCredit
                    },
                })
            }


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
