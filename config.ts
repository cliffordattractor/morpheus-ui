export const routerAddress = '0x111111125421cA6dc452d289314280a0f8842A65';
export const oneInchNativeToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const availableAgents: {
    [key: string]: {
        name: string,
        description: string,
        endpoint: string,
        requirements: {
            connectedWallet: boolean
        }

    }
} = {
    'swap-agent': {
        'name': 'Swap Agent',
        'description': 'Swap Agent Description',
        'endpoint': 'http://127.0.0.1:8080',
        requirements: {
            connectedWallet: true
        }
    },
    'functional-data-agent': {
        'name': 'Functional Data Agent',
        'description': 'Functional Data Agent Description',
        'endpoint': 'http://127.0.0.1:8081',
        requirements: {
            connectedWallet: false
        }
    }
}