import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'

class SupabaseWrapper {
    client;

    constructor() {
        this.client = this.sbCreateClient()
    }

    getClient() {
        return this.client
    }

    sbCreateClient() {
        return createClient(
            `${process.env.SUPABASE_URL}`,
            `${process.env.SUPABASE_KEY}`
        )
    }
}

export default new SupabaseWrapper()