import React, { FC, useCallback, useEffect, useState } from "react";
import { Box, Flex, Input, Button, Text, HStack, InputGroup, InputRightAddon, IconButton, Icon, Grid, GridItem } from "@chakra-ui/react";
import { Avatar } from "../Avatar";
import { ChatMessage, SwapTxPayloadType, ApproveTxPayloadType, SwapMessagePayload, sendSwapStatus, getHttpClient, UserOrAssistantMessage, SWAP_STATUS } from "../../services/backendClient";
import { SwapForm } from "../SwapForm";
import { useAccount, useCall, useChainId, useSendTransaction, useTransactionConfirmations } from "wagmi";
import { availableAgents } from "../../config";
import { Spinner } from "@chakra-ui/react";
import { SendIcon } from "../CustomIcon/SendIcon";

export type ChatProps = {
    onSubmitMessage: (message: string) => Promise<boolean>;
    onCancelSwap: () => void;
    messages: ChatMessage[];
    selectedAgent: string;
};

export const Chat: FC<ChatProps> = ({
    onSubmitMessage,
    onCancelSwap,
    messages,
    selectedAgent,
}) => {
    const [message, setMessage] = useState('');
    const [messagesData, setMessagesData] = useState<ChatMessage[]>(messages);
    const [countSwapsMessages, setCountSwapsMessages] = useState<number>(0);

    const { address } = useAccount();
    const chainId = useChainId();

    useEffect(() => {
        setMessagesData([...messages]);

        const swapsMessages = messages.filter((message) => message.role === 'swap');

        setCountSwapsMessages(swapsMessages.length);
    }, [messages]);

    const [txHash, setTxHash] = useState<string>(``);
    const [callbackSent, setCallbackSent] = useState<boolean>(false);
    const [showSpinner, setShowSpinner] = useState<boolean>(false);

    const confirmatons = useTransactionConfirmations({
        hash: (txHash || '0x') as `0x${string}`,
    });

    useEffect(() => {
        if (!callbackSent && confirmatons.data && confirmatons.data >= 1) {
            setCallbackSent(true);
            sendSwapStatus(
                getHttpClient(selectedAgent),
                chainId,
                address?.toLowerCase() || '0x',
                'success'
            ).then((response: ChatMessage) => {
                setMessagesData([...messagesData, {
                    role: 'assistant',
                    content: response.content,
                } as UserOrAssistantMessage]);

                setTxHash('');
                setCallbackSent(false);
            });
        }
    }, [confirmatons, callbackSent, chainId, selectedAgent, address, messagesData]);

    const { sendTransaction } = useSendTransaction(
        {
            mutation: {
                onError: (error) => {
                    console.log(`Error sending transaction: ${error}`);



                    sendSwapStatus(
                        getHttpClient(selectedAgent),
                        chainId,
                        address?.toLowerCase() || '0x',
                        'failed'
                    ).then((response: ChatMessage) => {
                        messagesData.push({
                            role: 'assistant',
                            content: response.content,
                        } as UserOrAssistantMessage);
                    })

                },
                onSuccess: (tx) => {
                    setTxHash(tx);

                    console.log('Transaction hash:', tx);
                }
            }
        }
    );

    const isMostRecentSwapMessage = useCallback((message: ChatMessage) => {
        const swapsMessages = messagesData.filter((message) => message.role === 'swap');

        return swapsMessages[swapsMessages.length - 1] === message;
    }, [messagesData]);

    const handleSubmit = async () => {
        if (!message) {
            return;
        }

        setShowSpinner(true);

        await onSubmitMessage(message);
        setMessage('');
        setShowSpinner(false);
    }

    return (
        <div style={{
            width: '65%'
        }}>
            <Box flex="1" bg="#020804" p={4} sx={{

                overflowY: 'scroll',
                overflowX: 'hidden',
                height: 'calc(100vh - 200px)',
                '::-webkit-scrollbar': {
                    width: '8px',
                    backgroundColor: 'transparent',
                },
                '::-webkit-scrollbar-thumb': {
                    backgroundColor: '#111613',
                    borderRadius: '4px',
                },
                ... ((availableAgents[selectedAgent]?.requirements.connectedWallet && !address) ? {
                    pointerEvents: 'none',

                } : {})
            }}>
                {messagesData.map((message: ChatMessage, index) => (
                    <Grid
                        templateAreas={`
                        "avatar name"
                        "avatar message"
                    `}
                        templateColumns={'0fr 3fr'}
                        key={index} bg={'#020804'}
                        color={'white'}
                        borderRadius={4}
                        mb={2}
                        gap={2}
                    >
                        <GridItem area="avatar">
                            <Avatar isAgent={message.role !== 'user'} agentName={availableAgents[selectedAgent]?.name || 'Undefined Agent'} />
                        </GridItem>
                        <GridItem area="name">
                            <Text sx={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                lineHeight: '125%',
                                mt: 1,
                                ml: 2

                            }}>{message.role === 'user' ? 'Me' : availableAgents[selectedAgent]?.name || 'Undefined Agent'}</Text>
                        </GridItem>

                        <GridItem area={'message'}>

                            {
                                typeof message.content === 'string' ?
                                    <Text
                                        sx={{
                                            fontSize: '16px',
                                            lineHeight: '125%',
                                            mt: 4,
                                            mb: 5,
                                            ml: 2,
                                        }}
                                    >{message.content}</Text> : <SwapForm
                                        isActive={isMostRecentSwapMessage(message)}
                                        onCancelSwap={onCancelSwap}
                                        selectedAgent={selectedAgent}
                                        fromMessage={message.content as unknown as SwapMessagePayload}
                                        onSubmitApprove={(approveTx) => {
                                            setTxHash('');
                                            sendTransaction({
                                                account: address,
                                                data: (approveTx?.data || '0x') as `0x${string}`,
                                                to: (approveTx?.to || '0x') as `0x${string}`,
                                            });
                                        }}
                                        onSubmitSwap={(swapTx) => {
                                            setTxHash('');
                                            sendTransaction({
                                                account: address,
                                                data: (swapTx?.tx.data || '0x') as `0x${string}`,
                                                to: (swapTx?.tx.to || '0x') as `0x${string}`,
                                                value: BigInt(swapTx?.tx.value || "0"),
                                            });
                                        }}
                                    />
                            }
                        </GridItem>
                    </Grid>
                ))}
            </Box>

            {showSpinner && <Flex justifyContent="center" alignItems="center" sx={{

            }}>
                <Spinner color="white" size="xl" />
            </Flex>}


            <Flex mt={4} sx={{
                pl: 6,
                pr: 6
            }}>
                <InputGroup sx={{
                    pt: 2,
                    pb: 2,
                    borderRadius: '8px',
                    backgroundColor: '#353936',
                }}>
                    <Input
                        onKeyDown={(e) => {
                            if (e.altKey && e.key === 'Enter') {
                                setMessage(message + '\n');
                            } else if (e.key === 'Enter') {
                                handleSubmit();
                            }
                        }}
                        sx={{
                            border: 'none',
                            color: 'white',
                            '&:focus': {
                                borderColor: 'none !important',
                                boxShadow: 'none !important',
                            }
                        }}
                        disabled={messagesData[messagesData.length - 1]?.role === 'swap'}
                        value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." />
                    <InputRightAddon

                        sx={{
                            backgroundColor: 'transparent',
                            border: 'none',
                        }}>
                        <IconButton
                            sx={{
                                backgroundColor: 'transparent',
                                fontSize: '24px',
                                color: '#59F886',
                                "&:hover": {
                                    backgroundColor: 'transparent',
                                }
                            }}
                            aria-label="Send" onClick={handleSubmit} icon={
                                <SendIcon width="24px" height="24px" />
                            } />
                    </InputRightAddon>
                </InputGroup>
            </Flex>
        </div>
    );
}