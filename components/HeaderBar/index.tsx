import React, { FC, ComponentPropsWithoutRef } from 'react';
import Image from 'next/image';
import { Box, HStack, Spacer } from '@chakra-ui/react';
import { AgentSelector } from './agentSelector';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export type HeaderBarProps = ComponentPropsWithoutRef<'div'>;

export const HeaderBar: FC<HeaderBarProps> = (props) => {
    return (
        <Box bgColor={'header'} sx={{
            // height: '6.25vh',
            padding: '10px 10px 10px 10px',
        }}>
            <HStack sx={{

            }}>
                <Box>
                    <Image src='/assets/logo.svg' alt="logo" width={60} height={30} />
                </Box>
                <Spacer />
                <Box>
                    <AgentSelector onSelectedAgent={(agent) => {
                        console.log(agent);
                    }
                    } />
                </Box>
                <Spacer />
                <Box>
                    <ConnectButton />
                </Box>
            </HStack>
        </Box>
    );
};