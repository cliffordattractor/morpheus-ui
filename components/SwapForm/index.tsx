import React, { FC, useState, useMemo, useEffect, useCallback } from 'react';
import { ApproveTxPayloadType, getApprovalTxPayload, getHttpClient, getSwapTxPayload, SwapMessagePayload, SwapTxPayloadType } from '../../services/backendClient';
import { Box, Button, FormControl, FormLabel, Input, Text, HStack, VStack, IconButton, AlertIcon, InputGroup, InputRightAddon } from '@chakra-ui/react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { erc20Abi, zeroAddress } from 'viem';
import { oneInchNativeToken, routerAddress } from '../../config';
import { on } from 'events';
import { InfoIcon } from '@chakra-ui/icons';

export type SwapMessageLike = {
    amount: string;
    dst: string;
    dst_address: string;
    dst_amount: string | number;
    quote: string;
    src: string;
    src_address: string;
    src_amount: number;
} | SwapMessagePayload;

export type SwapFormProps = {
    onSubmitSwap: (swapTx: SwapTxPayloadType) => void;
    onSubmitApprove(approveTx: ApproveTxPayloadType): void;
    onCancelSwap: () => void;
    fromMessage: SwapMessageLike;
    selectedAgent: string;
    isActive: boolean;
};


type FormData = {
    amount: string;
    tokenAddress0: string;
    tokenAddress1: string;
    approvalTxPayload: ApproveTxPayloadType | null;
    swapTxPayload: SwapTxPayloadType | null;
    slippage: number;
};

export const SwapForm: FC<SwapFormProps> = ({ isActive, onSubmitSwap, onSubmitApprove, onCancelSwap, fromMessage, selectedAgent }) => {
    const { address } = useAccount();
    const chainId = useChainId();
    const [formData, setFormData] = useState<FormData>({
        amount: '',
        tokenAddress0: '',
        tokenAddress1: '',
        approvalTxPayload: null,
        swapTxPayload: null,
        slippage: 0.1
    });

    console.log(fromMessage);

    const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);

    const isNativeToken = useMemo(() => {
        // BUG HERE need to catch up
        return fromMessage.src_address.toLowerCase() === oneInchNativeToken.toLowerCase();
    }, [fromMessage.src_address]);

    const allowance = useReadContract({
        abi: erc20Abi,
        address: formData.tokenAddress0 as `0x${string}`,
        functionName: 'allowance',
        args: [address || zeroAddress, routerAddress],
    }).data;

    const handleApprove = useCallback(async (address: string) => {
        setIsButtonLoading(true);

        try {
            if (isNativeToken) {
                return;
            }

            const _payload = await getApprovalTxPayload(getHttpClient(selectedAgent), chainId, fromMessage.src_address, Number(fromMessage.src_amount));

            onSubmitApprove(_payload.data.response);
        } catch (e) {
            console.log(`Failed to generate Approve TX payload: ${e}`);
        } finally {
            setIsButtonLoading(false);
        }
    }, [onSubmitApprove, isNativeToken]);

    const handleSwap = useCallback(async (address: string) => {

        setIsButtonLoading(true);

        try {
            const _payload = await getSwapTxPayload(
                getHttpClient(selectedAgent),
                fromMessage.src_address,
                fromMessage.dst_address,
                address,
                Number(fromMessage.src_amount),
                formData.slippage,
                chainId
            );

            onSubmitSwap(_payload);
        } catch (e) {
            console.log(`Failed to generate Swap TX payload: ${e}`);
        } finally {
            setIsButtonLoading(false);
        }
    }, [fromMessage, chainId, selectedAgent, formData.slippage, onSubmitSwap]);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            amount: fromMessage.amount,
            tokenAddress0: fromMessage.src_address,
            tokenAddress1: fromMessage.dst_address
        }));

        // const delay = isNativeToken ? 0 : 1500;
        // setTimeout(() => {
        //     if (!isNativeToken && address) {
        //         getApprovalTxPayload(getHttpClient(selectedAgent), chainId, fromMessage.src_address, Number(fromMessage.amount))
        //             .then(approvalTxPayload => {
        //                 setFormData(prev => ({ ...prev, approvalTxPayload: approvalTxPayload.data.response }));
        //             }).catch(console.error);
        //     }
        // }, delay);

        // setTimeout(() => {
        //     if (address) {
        //         getSwapTxPayload(getHttpClient(selectedAgent), fromMessage.src_address, fromMessage.dst_address, address, Number(fromMessage.dst_amount), formData.slippage, chainId)
        //             .then(swapTxPayload => {
        //                 setFormData(prev => ({ ...prev, swapTxPayload: swapTxPayload.data }));
        //             })
        //             .catch(console.error);
        //     }
        // }, delay + 4000);
    }, [address, fromMessage, chainId, isNativeToken]);

    return (
        <Box sx={{
            border: "1px solid #CCCECD",
            borderRadius: "8px",
            backgroundColor: "#111613",
            p: 3,
            mt: 4,
            ml: 2,
            mb: 4,
            overflow: "hidden",
            position: "relative",
            '& > *': {
                filter: !isActive ? 'blur(8px)' : 'none',
                pointerEvents: !isActive ? 'none' : 'auto',
            }
        }}>
            <form onSubmit={(e) => e.preventDefault()}>
                <VStack>
                    <HStack width="full" justifyContent="space-between">
                        <Box flex="1" w={"10%"} pr={2} borderRight={`1px solid #CCCECD`}>
                            <VStack>
                                <Text>You pay</Text>
                                <HStack>
                                    <Text
                                        sx={{
                                            color: '#9A9C9B',
                                            fontSize: "16px",
                                            fontStyle: "normal",
                                            fontWeight: 400,
                                            lineHeight: "125 %"
                                        }}
                                    >{fromMessage.src_amount}</Text>
                                    <Text>{fromMessage.src}</Text>
                                </HStack>
                            </VStack>
                        </Box>
                        <Box flex="1" pl={2} borderRight={`1px solid #CCCECD`}>
                            <VStack>
                                <Text >
                                    You receive
                                </Text>
                                <HStack>
                                    <Text
                                        sx={{
                                            color: '#9A9C9B',
                                            fontSize: "16px",
                                            fontStyle: "normal",
                                            fontWeight: 400,
                                            lineHeight: "125 %"
                                        }}
                                    >{parseFloat(String(fromMessage.dst_amount)).toFixed(4)}</Text>
                                    <Text>{fromMessage.dst}</Text>
                                </HStack>

                            </VStack>
                        </Box>
                        <Box flex="1" pl={2}>
                            <FormControl>
                                <HStack mb={1}>
                                    <Text sx={{
                                        fontSize: '16px',
                                    }}>
                                        Slippage
                                    </Text>
                                    <IconButton sx={{
                                        backgroundColor: 'transparent',
                                        width: '20px',
                                        height: '20px',
                                        color: '#FFFFFF',
                                        '&:hover': {
                                            backgroundColor: 'transparent'
                                        }
                                    }} aria-label="i" icon={<InfoIcon />} />
                                </HStack>
                                <InputGroup sx={{
                                    backgroundColor: '#111613',
                                    borderRadius: '8px',
                                    border: "1px solid #676B68",
                                }}>
                                    <Input
                                        sx={{
                                            border: 'none',
                                            color: 'white',

                                        }}
                                        type="number"
                                        value={formData.slippage}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slippage: parseFloat(e.target.value) }))}
                                    />
                                    <InputRightAddon sx={{
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#9A9C9B'
                                    }} children="%"></InputRightAddon>
                                </InputGroup>
                                <Text sx={{
                                    color: '#676B68',
                                    fontSize: '10px',
                                }}>Using 1 inch</Text>

                            </FormControl>
                        </Box>
                        <Box flex="1" alignItems={'center'} justifyContent={'center'} pl={4}>
                            <VStack>
                                {(isNativeToken || (allowance && BigInt(allowance) >= BigInt(parseFloat(String(formData.amount)) * 1e18))) ? (
                                    <Button isLoading={isButtonLoading} variant={'greenCustom'} w={'100%'} type="submit"
                                        onClick={() => handleSwap(address || '')}
                                        colorScheme="blue">
                                        Swap
                                    </Button>
                                ) : (
                                    <Button isLoading={isButtonLoading} type="submit" w={'100%'} variant={'greenCustom'}
                                        onClick={() => handleApprove(address || '')}
                                        colorScheme="blue">
                                        Approve
                                    </Button>
                                )}

                                <Button variant={'ghost'} w={'100%'} sx={{
                                    fontSize: '14px',
                                    color: "#FFFFFF",
                                    fontWeight: 500,
                                    fontFamily: 'Inter',
                                    '&:hover': {
                                        backgroundColor: 'transparent',
                                        color: '#59F886'
                                    }
                                }}
                                    onClick={onCancelSwap}
                                >
                                    Cancel
                                </Button>
                            </VStack>
                        </Box>
                    </HStack>
                </VStack>
            </form>
        </Box >
    );
};
