import React, { FC, useEffect, useState } from "react";
import { Box, Flex, Input, Button, Text } from "@chakra-ui/react";
import { ChatMessage, SwapTxPayloadType, ApproveTxPayloadType, SwapMessagePayload, sendSwapStatus, getHttpClient, UserOrAssistantMessage } from "../../services/backendClient";
import { SwapForm } from "../SwapForm";
import { useAccount, useCall, useChainId, useSendTransaction } from "wagmi";

export type ChatProps = {
    onSubmitMessage: (message: string) => void;
    messages: ChatMessage[];
};

export const Chat: FC<ChatProps> = ({
    onSubmitMessage,
    messages
}) => {
    const [message, setMessage] = useState('');
    const [messagesData, setMessagesData] = useState<ChatMessage[]>(messages);
    const [swapTxData, setSwapTxData] = useState<SwapTxPayloadType | null>(null);
    const [approveTxData, setApproveTxData] = useState<ApproveTxPayloadType | null>(null);



    const { address } = useAccount();
    const chainId = useChainId();

    useEffect(() => {
        setMessagesData([...messages]);
    }, [messages]);

    const { sendTransaction } = useSendTransaction(
        {
            mutation: {
                onError: (error) => {
                    if (error.name === 'TransactionExecutionError') {
                        sendSwapStatus(
                            getHttpClient(),
                            chainId,
                            address?.toLowerCase() || '0x',
                            'failed'
                        ).then((response: ChatMessage) => {
                            messagesData.push({
                                role: 'assistant',
                                content: response.content,
                            } as UserOrAssistantMessage);
                        })
                    }
                }
            }
        }
    );


    const handleSubmit = () => {
        onSubmitMessage(message);
        setMessage('');
    }

    return (
        <div>
            <Box flex="1" bg="gray.50" p={4} overflowY="scroll">
                {messagesData.map((message: ChatMessage, index) => (
                    <Box key={index} bg={message.role === 'user' ? 'gray.100' : 'gray.200'} p={2} borderRadius={4} mb={2}>
                        <Text fontWeight="bold">{message.role === 'user' ? 'You' : 'Morpheus'}</Text>
                        {
                            typeof message.content === 'string' ? message.content : <SwapForm
                                fromMessage={message.content as unknown as SwapMessagePayload}
                                onSubmitApprove={(approveTx) => {
                                    sendTransaction({
                                        account: address,
                                        data: (approveTx?.data || '0x') as `0x${string}`,
                                        to: (approveTx?.to || '0x') as `0x${string}`,
                                    });
                                }}
                                onSubmitSwap={(swapTx) => {
                                    sendTransaction({
                                        account: address,
                                        data: (swapTx?.tx.data || '0x') as `0x${string}`,
                                        to: (swapTx?.tx.to || '0x') as `0x${string}`,
                                        value: BigInt(swapTx?.tx.value || "0"),
                                    });
                                }}
                            />
                        }
                    </Box>
                ))}
            </Box>

            <Flex mt={4}>
                <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." />
                <Button colorScheme="blue" ml={2} onClick={handleSubmit}>Send</Button>
            </Flex>
        </div>
    );
}