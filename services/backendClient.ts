import axios, { Axios } from 'axios';
import { CANCELLED } from 'dns';

export type ChatMessageBase = {
    role: "user" | "assistant" | "swap";
};

export type UserOrAssistantMessage = ChatMessageBase & {
    role: "user" | "assistant";
    content: string;
};

export const SWAP_STATUS = {
    CANCELLED: "cancel",
    SUCCESS: "success",
    FAILED: "fail"
}

export type SwapTxPayloadType = {
    dstAmount: string;
    tx: {
        data: string;
        from: string;
        gas: number;
        gasPrice: string;
        to: string;
        value: string;
    };
};

export type ApproveTxPayloadType = {
    data: string;
    gasPrice: string;
    to: string;
    value: string;
};

export type SwapMessagePayload = {
    amount: string;
    dst: string;
    dst_address: string;
    quote: string;
    src: string;
    src_address: string;
};

export type SwapMessage = ChatMessageBase & {
    role: "swap";
    content: SwapMessagePayload;
};

export type SystemMessage = ChatMessageBase & {
    role: "system";
    content: string;
};

export type ChatMessage = UserOrAssistantMessage | SwapMessage | SystemMessage;

export type ChatsListItem = {
    index: number; //  index at chats array
    title: string; // title of the chat (first message content)
}

export const getHttpClient = (swapAgentUrl?: string) => {
    return axios.create({
        baseURL: swapAgentUrl || 'http://localhost:8080',
    });
}

export const getChats = async () => {
    // now chats will be stored at local storage

    const chats = localStorage.getItem('chats');
    if (chats) {
        return JSON.parse(chats);
    }

    return [];
}

//

export const getAllowance = async (backendClient: Axios, chainId: number, tokenAddress: string, walletAddress: string) => {
    return await backendClient.post('/allowance', {
        "chain_id": chainId,
        "tokenAddress": tokenAddress,
        "walletAddress": walletAddress
    });
}

export const getApprovalTxPayload = async (backendClient: Axios, chainId: number, tokenAddress: string, amount: number) => {
    return await backendClient.post('/approve', {
        "chain_id": chainId,
        "tokenAddress": tokenAddress,
        "amount": BigInt(amount * 10 ** 18).toString()
    });
}

export const getSwapTxPayload = async (backendClient: Axios,
    token0: string,
    token1: string,
    walletAddress: string,
    amount: number,
    slippage: number,
    chainId: number,
) => {
    return await backendClient.post('/swap', {
        src: token0,
        dst: token1,
        walletAddress: walletAddress,
        amount: BigInt(amount * 10 ** 18).toString(),
        slippage: slippage,
        chain_id: chainId
    });
}

export const sendSwapStatus = async (
    backendClient: Axios,
    chainId: number,
    walletAddress: string,
    swapStatus: string,
): Promise<ChatMessage> => {

    const responseBody = await backendClient.post('/tx_status', {
        "chain_id": chainId,
        "wallet_address": walletAddress,
        "flag": swapStatus
    });

    return {
        role: responseBody.data.role,
        content: responseBody.data.content
    } as ChatMessage;
}

export const getMessagesHistory = async (
    backendClient: Axios,
): Promise<ChatMessage[]> => {
    const responseBody = await backendClient.get('/messages');


    return responseBody.data.messages.map((message: any) => {
        return {
            role: message.role,
            content: message.content
        } as ChatMessage;

    });
}
export const writeMessage = async (
    history: ChatMessage[],
    message: string,
    backendClient: Axios,
    chainId: number,
    address: string
) => {
    const newMessage: ChatMessage = {
        role: 'user',
        content: message
    };

    history.push(newMessage);
    let resp;
    try {
        resp = await backendClient.post('/',
            {
                prompt: {
                    role: 'user',
                    content: message
                },
                "chain_id": String(chainId),
                "wallet_address": address,
            });
    } catch (e) {
        console.error(e);

        // resp = {
        //     data: {
        //         content: "Sorry, I'm not available right now. Please try again later."
        //     }
        // };
    } finally {
        console.log("Finally write message");
        // history.push({
        //     role: 'assistant',
        //     content: resp?.data.content || "Unknown error occurred."
        // });
    }

    return await getMessagesHistory(backendClient);
}