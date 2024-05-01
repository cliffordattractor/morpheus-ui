import React, { FC } from 'react';
import {
    Box,
    VStack,
    Text,
    Link
} from "@chakra-ui/react";
import { ConnectButton } from '@rainbow-me/rainbowkit';


export type LeftSidebarProps = {

};

export const LeftSidebar: FC<LeftSidebarProps> = () => {
    return (
        <Box width="400px" bg="gray.200" p={4}>
            <VStack align="stretch" height="85%">
                <Text fontSize="xl" mb={4}>Chats</Text>
                {/* Dynamic chat list can be added here */}
            </VStack>
        </Box>
    );
}