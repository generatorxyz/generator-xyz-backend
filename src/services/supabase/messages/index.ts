import sbWrapper from '../client'
import { Credit } from '../../../types/credit'

export enum MessageType {
    DEFAULT = 'default',
    SUMMARY = 'summary',
    SEO = 'seo',
}

class Credits {
    private client: any;

    constructor() {
        this.client = sbWrapper.getClient()
    }

    public async saveGeneratedMessage (
        message: string,
        userId: string,
        cost: number,
        apiKey: string | null = null,
        sourceContent: null | string = null,
        type: MessageType,
        url?: string,
    ) {
        console.log('saving message', {message, userId, cost, apiKey, sourceContent, type, url})
        return await this.client.from('messages').insert({
            message,
            cost,
            user_id: userId,
            api_key: apiKey,
            url: url ?? null,
            source_content: sourceContent,
            type: type ?? MessageType.DEFAULT
        })
    }
}

export default new Credits()
