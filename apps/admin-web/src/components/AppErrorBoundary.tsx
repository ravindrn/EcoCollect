import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
        return { error }
    }

    private reset = () => {
        this.setState({ error: null })
    }

    render() {
        if (this.state.error) {
            return (
                <main>
                    <h1>Something went wrong</h1>
                    <p>{this.state.error.message}</p>
                    <button type="button" onClick={this.reset}>Try again</button>
                    
                </main>
            )
        }

        return this.props.children
    }
}