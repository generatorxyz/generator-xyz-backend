import { Credit } from "@/types/credit";

const TOKEN_CREDIT_CONVERSION_OBJ: Credit[] = [
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

function costOfCredits(content: string) {
    const characters = content.length;
    if(characters > 9000) {
        return false
    }
    console.log(characters)
    const tokens = TOKEN_CREDIT_CONVERSION_OBJ.find((obj) => obj.max_characters >= characters)
    console.log(tokens)
    return tokens
}

export { costOfCredits }
