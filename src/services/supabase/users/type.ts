export interface User {
    id?: string;
    email?: string;
    customer_id?: string;
    created_at?: string | Date;
    sub_start_date?: string | Date;
    sub_end_date?: string | Date;
    sub_status?: 'paid' | 'canceled' | 'unpaid';
    sub_id?: string;
    session_id?: string;
}