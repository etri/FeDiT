import './App.css'
import CoreRouter from './route/CoreRouter.tsx'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export default function App() {
    const queryClient = new QueryClient()

    return (
        <>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <div className="flex h-screen overflow-hidden">
                        <div className="flex-1 overflow-y-auto">
                            <CoreRouter />
                        </div>
                    </div>
                </BrowserRouter>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </>
    )
}
