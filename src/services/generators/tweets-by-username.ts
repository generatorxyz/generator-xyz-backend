import axios from 'axios';
import { PromiseResponse } from '../../types';

export default async (twitterApi: string, reqOptions: any, username: string): Promise<PromiseResponse> => {
    return new Promise(async (resolve, reject) => {
        try {
            const { data: usernameData } = await axios.get(twitterApi + `/users/by/username/${ username }`, reqOptions)
            const userId = await usernameData.data.id
            if (!userId) {
                reject({
                    statusCode: 400,
                    body: {
                        error: 'No user found',
                    },
                })
                return
            }
            const { data } = await axios.get(twitterApi + `/users/${ userId }/tweets?max_results=25`, reqOptions)
            const { data: likedTweets } = await axios.get(twitterApi + `/users/${ userId }/liked_tweets?max_results=25`, reqOptions)
            if (!data || !likedTweets) {
                reject({
                    statusCode: 400,
                    body: {
                        error: 'No tweets found',
                    },
                })
                return
            }

            const mergedTweets = [...data.data, ...likedTweets.data]

            console.log('mergedTweets', mergedTweets)

            resolve({
                statusCode: 200,
                body: [
                    ...mergedTweets
                    // pageContent,
                ],
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
