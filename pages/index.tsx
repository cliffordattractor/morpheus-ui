import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import { Flex } from '@chakra-ui/react';
import { LeftSidebar } from '../components/LeftSidebar';
import { Chat } from '../components/Chat';
import { writeMessage, getHttpClient, ChatMessage, getMessagesHistory } from '../services/backendClient';
import { useEffect, useState } from 'react';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { HeaderBar } from '../components/HeaderBar';

const Home: NextPage = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chainId = useChainId();
  const { address } = useAccount();

  useEffect(() => {
    getMessagesHistory(
      getHttpClient(),
    ).then((messages: ChatMessage[]) => {
      console.log(messages);
      setChatHistory([...messages])
    });
  }, []);

  return (
    <>
      <HeaderBar />
      <Flex height="100vh">

        <LeftSidebar />
        <Flex flex="1" flexDirection="column" p={4}>
          <Chat messages={chatHistory} onSubmitMessage={async (message: string) => {

            if (!address) {
              return;
            }

            const _newHistory = await writeMessage(chatHistory, message, getHttpClient(), chainId, address);

            setChatHistory([..._newHistory])
          }} />
        </Flex>
      </Flex>
    </>
  );
};

export default Home;
