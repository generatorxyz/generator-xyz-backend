import axios from 'axios'

export async function axiosGetJsonData<T>(url: string): Promise<T> {
	try {
		const response = await axios.get<T>(url)
		return response.data
	} catch (error: any) {
		throw new Error(`Error in 'axiosGetJsonData(${url})': ${error?.message}`)
	}
}
export async function axiosPostJsonData<T>(url: string, data: any, headers: any): Promise<T> {
	try {
		const response = await axios.post<T>(url, data, headers)
		return response.data
	} catch (error: any) {
		throw new Error(`Error in 'axiosGetJsonData(${url})': ${error?.message}`)
	}
}
