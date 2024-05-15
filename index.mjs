import OpenAI from 'openai';
import "dotenv/config"
import inquirer from 'inquirer';

const messages = [
    {
        role: "system",
        content: `
        You are helpful AI assitant.
        * Ask one question at a one time.
        * Give options of each question if available.
        `
    }
]

const tools = [
    {
        type: "function",
        function: {
            name: "getTime",
            description: " Give return me the actual current time"
        }
    },
    {
        type: "function",
        function: {
            name: "orderPizza",
            description: "Place the order of user and return order id back.",
            parameters: {
                type: "object",
                properties: {
                    size: {
                        type: "string",
                        description: "the size of pizza Small - Medium - Big",
                    },
                    flavor: {
                        type: "string",
                        description: "the flavor of pizza Fajita , Tikka ",
                    },
                },
                required: ["size", "flavor"],

            }
        }
    }
]

const openai = new OpenAI();

const getTime = () => new Date().toLocaleString()

const orderPizza = () => "098765"

async function chat(user_query) {
    let aiRes = ""
    console.log(messages);
    messages.push({
        role: "user",
        content: User_Query
    })

    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        tools: tools,
        tool_choice: "auto"
    })
    messages.push(completion.choices[0].message)
    console.log(JSON.stringify(completion));
    console.log(completion.choices);
    // console.log(typeof completion.choices[0].message.content);
    const invokeFunction = completion.choices[0].finish_reason === "Tool_Calls."

    if (invokeFunction) {
        console.log("calling function");
        const functionName = completion.choices[0].message.tool_calls[0].function.name
        const functionArug = completion.choices[0].message.tool_calls[0].function.arguments
        const functionCallId = completion.choices[0].message.tool_calls[0].id
        if (functionName === "getTime") {
            const res = getTime()
            messages.push({
                role: "tool",
                content: res,
                tool_call_id: functionCallId
            })
            const completion2 = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                tools: tools,
                tool_choice: "auto"
            })
            aiRes = completion2.choices[0].message.content
            ;
        }

        if (functionName === "orderPizza") {
            console.log(functionArug, "this is functionArug");
            const res = orderPizza()
            messages.push({
                role: "tool",
                content: res,
                tool_call_id: functionCallId
            })
            const completion2 = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                tools: tools,
                tool_choice: "auto"
            })
            aiRes = completion2.choices[0].message.content
            ;
        }

    } else {
        aiRes = completion.choices[0].message.content
    }
    return aiRes
}


const askMan = () => {
    const ask = (query) => {
        inquirer
            .prompt([
                {
                    name: 'query',
                    message: query || "I am an AI assitant how can I help you? TO Exit Prompt enter 0 \n"
                }
            ])
            .then(async (answers) => {
                // console.log(answers.query);
                const res = await chat(answers.query)
                const ans = res

                if (answers.query != 0) {
                    ask(`${ans} \n `)
                }
            })
    }
    ask()
}
askMan()