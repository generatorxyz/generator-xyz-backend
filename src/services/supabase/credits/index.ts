import sbWrapper from '../client'
import { Credit } from '../../../types/credit'

const supabase = sbWrapper.getClient()

class Credits {
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
    }

    public async getCreditsUser(user_id: string) {
        return await supabase
            .from('credits')
            .select('*')
            .eq('user_id', user_id)
            .single()
    }

    public async updateCreditsUser(user_id: string, amount: number, type: 'add' | 'subtract' = 'subtract') {
        const { data, error } = await this.getCreditsUser(user_id)
        if (error) {
            return { error }
        }
        const { amount: currentAmount } = data
        const newAmount = type === 'add' ? currentAmount + amount : currentAmount - amount
        
        return await supabase
            .from('credits')
            .update({ amount: newAmount, updated_at: new Date() })
            .eq('user_id', user_id)
            .single()
    }
    
    public costOfCredits(content: string): Credit | undefined {
        const characters = content.length;
        if(characters > 9000) {
            return undefined
        }
        console.log(characters)
        const tokens = this.TOKEN_CREDIT_CONVERSION_OBJ.find((obj) => obj.max_characters >= characters)
        console.log(tokens)
        return tokens
    }
    
}

export default new Credits()
