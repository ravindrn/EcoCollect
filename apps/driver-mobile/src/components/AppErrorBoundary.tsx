import { Component, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

type Props = { children: ReactNode}
type State = { error: Error | null}

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
            return(
                <View>
                    <Text>Something Went Wrong</Text>
                    <Text>{this.state.error.message}</Text>
                    <Pressable onPress={this.reset}>
                        <Text>Try again</Text>
                    </Pressable>
                </View>
            )
        }
        return this.props.children
    }
}