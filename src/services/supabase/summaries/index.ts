import sbWrapper from '../client'
import { Credit } from '../../../types/credit'

class Credits {
    private client: any;
    TOKEN_CREDIT_CONVERSION_OBJ: Credit[] = [
        {
            max_characters: 1500,
            credit: 1
        },
        {
            max_characters: 3000,
            credit: 2
        },
        {
            max_characters: 4500,
            credit: 3
        },
        {
            max_characters: 6000,
            credit: 4
        },
        {
            max_characters: 7500,
            credit: 5
        },
        {
            max_characters: 9000,
            credit: 6
        },
    ]
    constructor() {
        this.client = sbWrapper.getClient()
    }

    public async getCreditsUser(user_id: string) {
        return await this.client
            .from('credits')
            .select('*')
            .eq('user_id', user_id)
            .single()
    }
    
    public costOfCredits(content: string): Credit | undefined {
        const characters = content.length;
        if(characters > 9000) {
            return undefined
        }
        const tokens = this.TOKEN_CREDIT_CONVERSION_OBJ.find((obj) => obj.max_characters >= characters)
        return tokens
    }
    
}

export default new Credits()
