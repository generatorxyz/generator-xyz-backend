import { SupabaseClient, createClient } from '@supabase/supabase-js';
import 'dotenv/config'

interface Country {
    id: string;
    name: string;
    iso2: string;
    iso3: string;
    local_name: string;
    continent: string
}

class SupabaseWrapper {
    public client: any;
    public countries: Country[] = []

    constructor() {
        this.client = this.sbCreateClient()
        const { data: countries, error } = this.getCountries()
        if (countries) {
            this.countries = countries
        }
    }

    public getClient(): SupabaseClient {
        return this.client
    }

    private sbCreateClient() {
        return createClient(
            `${process.env.SUPABASE_URL}`,
            `${process.env.SUPABASE_SERVICE_KEY}`
        )
    }

    private getCountries() {
        return this.client
            .from('countries')
            .select('*')
    }
}

export default new SupabaseWrapper()