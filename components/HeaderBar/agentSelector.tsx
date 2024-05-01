import { Box, CheckboxIcon, HStack, Icon, Spacer, Text, VStack } from '@chakra-ui/react';
import React, { FC, ComponentPropsWithoutRef, useState } from 'react';
import { useOutsideClick } from '@chakra-ui/react';
import { CheckIcon, ChevronDownIcon } from '@chakra-ui/icons'

interface AgentSelectorProps extends ComponentPropsWithoutRef<'div'> {
    onSelectedAgent: (agent: string) => void;
}

const AgentSelectorItem: FC<{ agent: string }> = ({ agent }) => {
    return (
        <Box sx={{
            backgroundColor: '#1C201D',
            textColor: 'gray.100',
            padding: '5px 10px 5px 10px',
            cursor: 'pointer',
            ':hover': {
                backgroundColor: '#1C201D',
            },
            textAlign: 'left',
            borderBottom: '1px solid #676B68',
        }}>
            <VStack sx={{
                textAlign: 'left',
            }}>
                <HStack flex={1}>
                    <Text align={'left'}>{agent}</Text>
                    <Spacer />
                    <CheckIcon />
                </HStack>
                <Text>Agent Description</Text>
            </VStack>
        </Box>
    );
}

export const AgentSelector: FC<AgentSelectorProps> = ({ onSelectedAgent }: AgentSelectorProps) => {
    const [show, setShow] = React.useState(false);

    const ref = React.useRef<HTMLDivElement>(null);

    useOutsideClick({
        ref: ref,
        handler: () => setShow(false),
    });



    return (
        <>
            <Box ref={ref} sx={{
                backgroundColor: 'transparent',
                borderRadius: '5px',
                border: '1px solid #9A9C9B',
                padding: '10px 10px 10px 10px',
                cursor: 'pointer',
                minWidth: '260px',
                textColor: '#9A9C9B'
            }} onClick={() => {
                console.log('toggle select')

                setShow(show => !show)
            }}>
                <HStack>
                    <Text align={'left'}>Select Agent</Text>
                    <Spacer />
                    <ChevronDownIcon />
                </HStack>
            </Box>
            {show && <Box sx={{
                position: 'absolute',
                backgroundColor: '#1C201D',
                padding: '5px 10px 5px 10px',
                boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                zIndex: 1,
                width: '15vw',
            }}>
                <AgentSelectorItem agent="Agent 1" />
                <AgentSelectorItem agent="Agent 2" />
                <AgentSelectorItem agent="Agent 3" />
            </Box>
            }

        </>
    );
}