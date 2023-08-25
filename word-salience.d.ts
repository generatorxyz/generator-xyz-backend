declare module 'word-salience' {
   export function getSalientWords(content: string, unstemmed: boolean, multiply: boolean): [string, number][]
}