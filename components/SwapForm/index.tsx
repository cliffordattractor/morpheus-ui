import React, { FC, useState, useMemo, useEffect } from 'react';
import { ApproveTxPayloadType, getApprovalTxPayload, getHttpClient, getSwapTxPayload, SwapMessagePayload, SwapTxPayloadType } from '../../services/backendClient';
import { Box, Button, FormControl, FormLabel, Input, Text, HStack, VStack } from '@chakra-ui/react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { erc20Abi, zeroAddress } from 'viem';
import { oneInchNativeToken, routerAddress } from '../../config';
import { on } from 'events';

export type SwapMessageLike = {
    amount: string;
    dst: string;
    dst_address: string;
    quote: string;
    src: string;
    src_address: string;
} | SwapMessagePayload;

export type SwapFormProps = {
    onSubmitSwap: (swapTx: SwapTxPayloadType) => void;
    onSubmitApprove(approveTx: ApproveTxPayloadType): void;
    fromMessage: SwapMessageLike;
};


type FormData = {
    amount: string;
    tokenAddress0: string;
    tokenAddress1: string;
    approvalTxPayload: ApproveTxPayloadType | null;
    swapTxPayload: SwapTxPayloadType | null;
    slippage: number;
};

export const SwapForm: FC<SwapFormProps> = ({ onSubmitSwap, onSubmitApprove, fromMessage }) => {
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

    const isNativeToken = useMemo(() => {
        return fromMessage.src_address.toLowerCase() === oneInchNativeToken.toLowerCase();
    }, [fromMessage.src_address]);

    const allowance = useReadContract({
        abi: erc20Abi,
        address: formData.tokenAddress0 as `0x${string}`,
        functionName: 'allowance',
        args: [address || zeroAddress, routerAddress],
    }).data;

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            amount: fromMessage.amount,
            tokenAddress0: fromMessage.src_address,
            tokenAddress1: fromMessage.dst_address
        }));

        const delay = isNativeToken ? 0 : 1500;
        setTimeout(() => {
            if (!isNativeToken && address) {
                getApprovalTxPayload(getHttpClient(), chainId, fromMessage.src_address, Number(fromMessage.amount))
                    .then(approvalTxPayload => {
                        setFormData(prev => ({ ...prev, approvalTxPayload: approvalTxPayload.data.response }));
                    }).catch(console.error);
            }
        }, delay);

        setTimeout(() => {
            if (address) {
                getSwapTxPayload(getHttpClient(), fromMessage.src_address, fromMessage.dst_address, address, Number(fromMessage.amount), formData.slippage, chainId)
                    .then(swapTxPayload => {
                        setFormData(prev => ({ ...prev, swapTxPayload: swapTxPayload.data }));
                    })
                    .catch(console.error);
            }
        }, delay + 4000);
    }, [address, fromMessage, chainId, isNativeToken]);

    return (
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={4} m={4}>
            <form onSubmit={(e) => e.preventDefault()}>
                <VStack spacing={4}>
                    <HStack width="full" justifyContent="space-between">
                        <Box flex="1" pr={2}>
                            <FormControl id="from-token">
                                <FormLabel>From</FormLabel>
                                <Input type="text" value={fromMessage.src} isReadOnly />
                            </FormControl>
                        </Box>
                        <Box flex="1" pl={2}>
                            <FormControl id="to-token">
                                <FormLabel>To</FormLabel>
                                <Input type="text" value={fromMessage.dst} isReadOnly />
                            </FormControl>
                        </Box>
                        <Box flex="1" pl={2}>
                            <FormControl>
                                <FormLabel>Amount</FormLabel>
                                <Input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                />
                                <Text fontSize="sm" color="gray.500">
                                    ≈ ${parseFloat(formData.amount) * parseFloat(fromMessage.quote) || 0}
                                </Text>
                            </FormControl>
                        </Box>
                        <Box flex="1" pl={2}>
                            <FormControl>
                                <FormLabel>Slippage</FormLabel>
                                <Input
                                    type="number"
                                    value={formData.slippage}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slippage: parseFloat(e.target.value) }))}
                                />
                            </FormControl>
                        </Box>
                        <Box flex="1" pl={2}>
                            {(isNativeToken || (allowance && BigInt(allowance) >= BigInt(parseFloat(formData.amount) * 1e18))) ? (
                                <Button type="submit"
                                    onClick={() => null !== formData.swapTxPayload ? onSubmitSwap(formData.swapTxPayload as SwapTxPayloadType) : null}
                                    colorScheme="blue">
                                    Swap
                                </Button>
                            ) : (
                                <Button type="submit"
                                    onClick={() => null !== formData.approvalTxPayload ? onSubmitApprove(formData.approvalTxPayload as ApproveTxPayloadType) : null}
                                    colorScheme="blue">
                                    Approve
                                </Button>
                            )}
                        </Box>
                    </HStack>
                </VStack>
            </form>
        </Box>
    );
};
